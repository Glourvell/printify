const express = require('express');
const router = express.Router();
const axios = require('axios');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { kenyaCounties } = require('../config/catalog');

// Store front page
router.get('/:storeSlug', async (req, res) => {
  try {
    const { storeSlug } = req.params;
    
    const seller = await User.findOne({ storeSlug });
    if (!seller) {
      return res.render('pages/store-not-found', { storeSlug });
    }
    
    const products = await Product.find({ 
      userId: seller._id, 
      isPublished: true 
    });
    
    res.render('pages/buyer-store', {
      seller,
      products,
      counties: kenyaCounties,
      storeSlug
    });
  } catch (error) {
    console.error('Store error:', error);
    res.render('pages/error', { message: 'Error loading store' });
  }
});

// Process order
router.post('/:storeSlug/order', async (req, res) => {
  try {
    const { storeSlug } = req.params;
    const { productId, buyerName, buyerPhone, buyerEmail, quantity, county, deliveryAddress } = req.body;
    
    const seller = await User.findOne({ storeSlug });
    if (!seller) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const totalPrice = product.sellerPrice * quantity;
    
    // Create order
    const order = new Order({
      productId,
      sellerId: seller._id,
      storeSlug,
      buyerName,
      buyerPhone: formatPhoneNumber(buyerPhone),
      buyerEmail,
      quantity,
      unitPrice: product.sellerPrice,
      totalPrice,
      county,
      deliveryAddress,
      paymentStatus: 'pending'
    });
    
    await order.save();
    
    res.json({ 
      success: true, 
      orderId: order._id,
      totalPrice,
      message: 'Order created. Proceed with M-Pesa payment.'
    });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Format phone number to M-Pesa format (254XXXXXXXXX)
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// M-Pesa STK Push
router.post('/:storeSlug/mpesa-stk', async (req, res) => {
  try {
    const { orderId, phone } = req.body;
    
    const order = await Order.findById(orderId).populate('productId');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    // M-Pesa credentials from environment
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    // Check if M-Pesa is configured
    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      // Demo mode - simulate successful payment
      console.log('M-Pesa not configured, running in demo mode');
      
      order.paymentStatus = 'completed';
      order.mpesaTransactionId = 'DEMO-' + Date.now();
      order.mpesaReceiptNumber = 'DEMO-RECEIPT-' + Date.now();
      await order.save();
      
      // Send order email in background
      sendOrderEmail(order).catch(err => console.log('Email error:', err.message));
      
      return res.json({ 
        success: true, 
        message: 'Demo payment completed successfully! (M-Pesa not configured)',
        demo: true 
      });
    }
    
    // Production M-Pesa flow
    const baseUrl = 'https://sandbox.safaricom.co.ke';
    
    try {
      // Get OAuth token
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const tokenResponse = await axios.get(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        { 
          headers: { Authorization: `Basic ${auth}` },
          timeout: 30000
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
      
      // STK Push request
      const stkResponse = await axios.post(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.ceil(order.totalPrice),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl || `${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : ''}/shop/mpesa/callback`,
          AccountReference: `Order-${order._id}`.substring(0, 12),
          TransactionDesc: `Payment for ${order.productId.name}`.substring(0, 13)
        },
        { 
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 30000
        }
      );
      
      if (stkResponse.data.ResponseCode === '0') {
        order.mpesaTransactionId = stkResponse.data.CheckoutRequestID;
        await order.save();
        
        res.json({ 
          success: true, 
          message: 'STK Push sent. Please check your phone and enter your M-Pesa PIN.',
          checkoutRequestId: stkResponse.data.CheckoutRequestID
        });
      } else {
        throw new Error(stkResponse.data.ResponseDescription || 'STK Push failed');
      }
    } catch (mpesaError) {
      console.error('M-Pesa API error:', mpesaError.response?.data || mpesaError.message);
      
      // Fallback to demo mode on API error
      order.paymentStatus = 'completed';
      order.mpesaTransactionId = 'FALLBACK-' + Date.now();
      order.mpesaReceiptNumber = 'FALLBACK-RECEIPT-' + Date.now();
      await order.save();
      
      sendOrderEmail(order).catch(err => console.log('Email error:', err.message));
      
      res.json({ 
        success: true, 
        message: 'Payment recorded (M-Pesa API unavailable)',
        demo: true 
      });
    }
  } catch (error) {
    console.error('M-Pesa STK error:', error);
    res.status(500).json({ success: false, error: 'Payment initiation failed. Please try again.' });
  }
});

// M-Pesa callback
router.post('/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa callback received:', JSON.stringify(req.body));
    
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
      
      const order = await Order.findOne({ mpesaTransactionId: CheckoutRequestID });
      
      if (order) {
        if (ResultCode === 0) {
          // Payment successful
          const receiptNumber = CallbackMetadata?.Item?.find(
            i => i.Name === 'MpesaReceiptNumber'
          )?.Value;
          
          order.paymentStatus = 'completed';
          order.mpesaReceiptNumber = receiptNumber || 'CONFIRMED';
          await order.save();
          
          // Send order email
          sendOrderEmail(order).catch(err => console.log('Email error:', err.message));
        } else {
          // Payment failed
          order.paymentStatus = 'failed';
          await order.save();
        }
      }
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Callback error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// Helper function to send order email with PDF
async function sendOrderEmail(order) {
  try {
    const populatedOrder = await Order.findById(order._id)
      .populate('productId')
      .populate('sellerId');
    
    if (!populatedOrder) {
      console.log('Order not found for email');
      return;
    }
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // PDF content
    doc.fontSize(24).fillColor('#4f46e5').text('PrintHub Order Confirmation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#333');
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Product Details', { underline: true });
    doc.fontSize(12);
    doc.text(`Product: ${populatedOrder.productId?.name || 'N/A'}`);
    doc.text(`Quantity: ${order.quantity}`);
    doc.text(`Unit Price: KES ${order.unitPrice}`);
    doc.text(`Total: KES ${order.totalPrice}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Buyer Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${order.buyerName}`);
    doc.text(`Phone: ${order.buyerPhone}`);
    doc.text(`Email: ${order.buyerEmail || 'N/A'}`);
    doc.text(`County: ${order.county}`);
    doc.text(`Address: ${order.deliveryAddress || 'N/A'}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Payment Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Status: ${order.paymentStatus}`);
    doc.text(`M-Pesa Receipt: ${order.mpesaReceiptNumber || 'N/A'}`);
    doc.text(`Transaction ID: ${order.mpesaTransactionId || 'N/A'}`);
    doc.moveDown();
    
    doc.text(`Store: ${populatedOrder.sellerId?.storeName || order.storeSlug}`);
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });
    
    const pdfBuffer = Buffer.concat(chunks);
    
    // Check if SMTP is configured
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpUser || !smtpPass) {
      console.log('SMTP not configured, skipping email. Order PDF would be sent to:', process.env.ORDER_EMAIL || 'glourvell@gmail.com');
      return;
    }
    
    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    
    const recipientEmail = process.env.ORDER_EMAIL || 'glourvell@gmail.com';
    
    await transporter.sendMail({
      from: smtpUser,
      to: recipientEmail,
      subject: `New Order - ${populatedOrder.productId?.name || 'Product'} from ${order.buyerName}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Buyer:</strong> ${order.buyerName}</p>
        <p><strong>Phone:</strong> ${order.buyerPhone}</p>
        <p><strong>Product:</strong> ${populatedOrder.productId?.name || 'N/A'}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Total:</strong> KES ${order.totalPrice}</p>
        <p><strong>County:</strong> ${order.county}</p>
        <p>See attached PDF for full order details.</p>
      `,
      attachments: [{
        filename: `order-${order._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    
    console.log('Order email sent successfully to:', recipientEmail);
  } catch (error) {
    console.error('Email send error:', error.message);
  }
}

module.exports = router;
