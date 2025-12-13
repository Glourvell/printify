// My Products page functionality

// Edit product buttons
document.querySelectorAll('.edit-product-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const product = JSON.parse(btn.dataset.product);
    
    document.getElementById('editProductId').value = product._id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.sellerPrice;
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editLogoPosition').value = product.logoPosition || 'front';
    
    new bootstrap.Modal(document.getElementById('editProductModal')).show();
  });
});

// Edit product form submission
document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const productId = formData.get('productId');
  
  try {
    const response = await fetch(`/products/update/${productId}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      location.reload();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});

// Delete product buttons
document.querySelectorAll('.delete-product-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const productId = btn.dataset.id;
    
    try {
      const response = await fetch(`/products/delete/${productId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        btn.closest('.col-6').remove();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Connection error. Please try again.');
    }
  });
});

// Store name to slug preview
document.getElementById('storeName')?.addEventListener('input', (e) => {
  const slug = e.target.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  document.getElementById('storeSlugPreview').value = slug;
});

// Create store form
document.getElementById('createStoreForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const storeName = document.getElementById('storeName').value;
  
  try {
    const response = await fetch('/store/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Store created successfully!');
      location.reload();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});

// Copy store URL
document.getElementById('copyStoreUrl')?.addEventListener('click', () => {
  const urlInput = document.getElementById('storeUrl');
  urlInput.select();
  document.execCommand('copy');
  
  const btn = document.getElementById('copyStoreUrl');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
  setTimeout(() => btn.innerHTML = originalHtml, 2000);
});
