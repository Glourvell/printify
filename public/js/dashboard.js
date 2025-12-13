// Dashboard common functionality

// Profile form submission
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const displayName = formData.get('displayName');
  
  try {
    const response = await fetch('/dashboard/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Profile updated successfully!');
    } else {
      alert('Error updating profile: ' + data.error);
    }
  } catch (error) {
    alert('Connection error. Please try again.');
  }
});
