// Buyer store functionality

let selectedProduct = null;

// Product card click
document.querySelectorAll('.buyer-product-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedProduct = JSON.parse(card.dataset.product);
    
    document.getElementById('orderProductId').value = selectedProduct._id;
    document.getElementById('orderProductImage').src = selectedProduct.baseImage;
    document.getElementById('orderProductName').textContent = selectedProduct.name;
    document.getElementById('orderProductPrice').textContent = `KES ${selectedProduct.sellerPrice}`;
    document.getElementById('orderQuantity').value = 1;
    updateTotal();
    
    new bootstrap.Modal(document.getElementById('orderModal')).show();
  });
});

// Quantity controls
document.getElementById('qtyMinus')?.addEventListener('click', () => {
  const input = document.getElementById('orderQuantity');
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
    updateTotal();
  }
});

document.getElementById('qtyPlus')?.addEventListener('click', () => {
  const input = document.getElementById('orderQuantity');
  if (parseInt(input.value) < 100) {
    input.value = parseInt(input.value) + 1;
    updateTotal();
  }
});

document.getElementById('orderQuantity')?.addEventListener('change', updateTotal);

function updateTotal() {
  if (!selectedProduct) return;
  const quantity = parseInt(document.getElementById('orderQuantity').value) || 1;
  const total = selectedProduct.sellerPrice * quantity;
  document.getElementById('orderTotal').textContent = `KES ${total}`;
}

// Order form submission
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const orderData = {
    productId: formData.get('productId'),
    buyerName: formData.get('buyerName'),
    buyerPhone: formData.get('buyerPhone'),
    buyerEmail: formData.get('buyerEmail'),
    quantity: parseInt(formData.get('quantity')),
    county: formData.get('county'),
    deliveryAddress: formData.get('deliveryAddress')
  };
  
  // Close order modal and show payment modal
  bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
  const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
  paymentModal.show();
  
  // Reset payment modal state
  document.getElementById('paymentLoading').style.display = 'block';
  document.getElementById('paymentSuccess').style.display = 'none';
  document.getElementById('paymentError').style.display = 'none';
  
  try {
    // Create order
    const orderResponse = await fetch(`/shop/${storeSlug}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const orderResult = await orderResponse.json();
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }
    
    // Initiate M-Pesa payment
    const mpesaResponse = await fetch(`/shop/${storeSlug}/mpesa-stk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderResult.orderId,
        phone: orderData.buyerPhone
      })
    });
    
    const mpesaResult = await mpesaResponse.json();
    
    if (mpesaResult.success) {
      document.getElementById('paymentLoading').style.display = 'none';
      document.getElementById('paymentSuccess').style.display = 'block';
    } else {
      throw new Error(mpesaResult.error);
    }
  } catch (error) {
    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentError').style.display = 'block';
    document.getElementById('paymentErrorMsg').textContent = error.message || 'Payment failed. Please try again.';
  }
});
