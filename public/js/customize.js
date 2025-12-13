// Product customization functionality

const form = document.getElementById('customizeForm');
const logoInput = document.getElementById('logoInput');
const logoOverlay = document.getElementById('logoOverlay');
const profitDisplay = document.getElementById('profitDisplay');
const positionBadge = document.getElementById('positionBadge');
const priceInput = form?.querySelector('input[name="sellerPrice"]');
const basePriceInput = form?.querySelector('input[disabled]');

// Logo preview
logoInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      logoOverlay.src = event.target.result;
      logoOverlay.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// Profit calculation
priceInput?.addEventListener('input', () => {
  const sellerPrice = parseFloat(priceInput.value) || 0;
  const basePrice = parseFloat(basePriceInput?.value) || 0;
  const profit = sellerPrice - basePrice;
  profitDisplay.value = profit >= 0 ? profit : 0;
});

// Size and color selection
// const sizeSelect = form?.querySelector('select[name="size"]');
// const colorSelect = form?.querySelector('select[name="color"]');
// const sizeDisplay = document.getElementById('sizeDisplay');
// const colorDisplay = document.getElementById('colorDisplay');

// sizeSelect?.addEventListener('change', (e) => {
//   if (sizeDisplay) sizeDisplay.textContent = `Size: ${e.target.value}`;
// });

// colorSelect?.addEventListener('change', (e) => {
//   if (colorDisplay) colorDisplay.textContent = `Color: ${e.target.value}`;
//   if (logoOverlay) logoOverlay.style.filter = `hue-rotate(${getColorHue(e.target.value)}deg)`;
// });

// function getColorHue(color) {
//   const hues = { black: 0, white: 0, red: 0, blue: 240, green: 120 };
//   return hues[color.toLowerCase()] || 0;
// }



// Logo position update
document.querySelectorAll('input[name="logoPosition"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const position = e.target.value;
    positionBadge.textContent = `Logo Position: ${position.charAt(0).toUpperCase() + position.slice(1)}`;
    
    // Adjust logo position visually
    const positions = {
      front: { top: '30%', left: '50%' },
      back: { top: '35%', left: '50%' },
      left: { top: '40%', left: '25%' },
      right: { top: '40%', left: '75%' }
    };
    
    const pos = positions[position];
    if (pos) {
      logoOverlay.style.top = pos.top;
      logoOverlay.style.left = pos.left;
    }
  });
});

// Form submission
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(form);
  
  try {
    const response = await fetch('/products/add', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Product added to My Products!');
      window.location.href = '/dashboard/my-products';
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});
