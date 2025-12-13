import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { app, auth } from './firebase-config.js';

const showError = (message) => {
  const errorDiv = document.getElementById('authError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => errorDiv.style.display = 'none', 5000);
};

const showLoading = (show) => {
  document.getElementById('authLoading').style.display = show ? 'block' : 'none';
};

const handleAuthSuccess = async (user) => {
  showLoading(true);
  try {
    const response = await fetch('/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        phone: user.phoneNumber,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL
      })
    });
    
    const data = await response.json();
    if (data.success) {
      window.location.href = data.redirect;
    } else {
      showError(data.error || 'Authentication failed');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
  }
  showLoading(false);
};

// Google Auth
const googleProvider = new GoogleAuthProvider();

const handleGoogleAuth = async () => {
  if (!auth) {
    showError('Firebase is not configured. Please set up Firebase credentials.');
    return;
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await handleAuthSuccess(result.user);
  } catch (error) {
    if (error.code !== 'auth/popup-closed-by-user') {
      showError(error.message);
    }
  }
};

document.getElementById('googleLoginBtn')?.addEventListener('click', handleGoogleAuth);
document.getElementById('googleSignupBtn')?.addEventListener('click', handleGoogleAuth);

// Phone Auth
let confirmationResult = null;
let recaptchaVerifier = null;

const setupRecaptcha = (containerId) => {
  if (!auth) return null;
  
  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: () => {},
      'expired-callback': () => {}
    });
  } catch (error) {
    console.log('Recaptcha setup error:', error);
    return null;
  }
};

const sendOtp = async (phoneInput, recaptchaContainer, otpSection) => {
  if (!auth) {
    showError('Firebase is not configured. Please set up Firebase credentials.');
    return;
  }
  
  const phone = phoneInput.value.trim();
  if (!phone || phone.length < 9) {
    showError('Please enter a valid phone number');
    return;
  }
  
  const fullPhone = '+254' + phone.replace(/^0/, '');
  
  try {
    showLoading(true);
    
    if (!recaptchaVerifier) {
      recaptchaVerifier = setupRecaptcha(recaptchaContainer);
    }
    
    if (!recaptchaVerifier) {
      showError('Could not set up verification. Please try Google sign-in instead.');
      showLoading(false);
      return;
    }
    
    confirmationResult = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier);
    document.getElementById(otpSection).style.display = 'block';
    showLoading(false);
  } catch (error) {
    showError(error.message);
    showLoading(false);
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  }
};

const verifyOtp = async (otpInput) => {
  const otp = otpInput.value.trim();
  if (!otp || otp.length !== 6) {
    showError('Please enter a valid 6-digit OTP');
    return;
  }
  
  try {
    showLoading(true);
    const result = await confirmationResult.confirm(otp);
    await handleAuthSuccess(result.user);
  } catch (error) {
    showError('Invalid OTP. Please try again.');
    showLoading(false);
  }
};

// Login phone handlers
document.getElementById('sendLoginOtp')?.addEventListener('click', () => {
  sendOtp(
    document.getElementById('loginPhone'),
    'loginRecaptcha',
    'loginOtpSection'
  );
});

document.getElementById('verifyLoginOtp')?.addEventListener('click', () => {
  verifyOtp(document.getElementById('loginOtp'));
});

// Signup phone handlers
document.getElementById('sendSignupOtp')?.addEventListener('click', () => {
  sendOtp(
    document.getElementById('signupPhone'),
    'signupRecaptcha',
    'signupOtpSection'
  );
});

document.getElementById('verifySignupOtp')?.addEventListener('click', () => {
  verifyOtp(document.getElementById('signupOtp'));
});
