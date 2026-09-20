/**
 * Login Page Controller — VCE Pali e-Gram
 * Handles credential submission, 8-hour shift initialization, and password visibility.
 */
import { auth } from './auth.js';

class LoginController {
  constructor() {
    this.form = document.getElementById('login-form');
    this.usernameInput = document.getElementById('username');
    this.passwordInput = document.getElementById('current-password');
    this.btnSubmit = document.getElementById('btn-submit');
    this.btnLabel = document.getElementById('btn-label');
    this.btnSpinner = document.getElementById('btn-spinner');
    this.alertBox = document.getElementById('login-alert');
    this.alertIcon = document.getElementById('login-alert-icon');
    this.alertMsg = document.getElementById('login-alert-msg');
    this.btnTogglePw = document.getElementById('btn-toggle-pw');
    this.eyeIconShow = document.getElementById('eye-icon-show');
    this.eyeIconHide = document.getElementById('eye-icon-hide');
    this.capsWarning = document.getElementById('caps-warning');
    this.btnTheme = document.getElementById('btn-theme-switch-login');

    this.init();
  }

  init() {
    // If user is already authenticated within the 8-hour window, redirect to app
    auth.redirectIfAuthenticated();

    // In native Android app, remove APK download options
    const isNative = typeof window.AndroidBridge !== 'undefined' ||
                     navigator.userAgent.includes('VCE-Android-Native') ||
                     window.location.search.includes('native=true') ||
                     document.documentElement.classList.contains('is-native-app');
    if (isNative) {
      document.documentElement.classList.add('is-native-app');
      document.querySelectorAll('.apk-download-option, #card-apk-distribution, [href*="/download/apk"], [download*=".apk"]').forEach(el => el.remove());
    }

    this.bindEvents();
    this.checkUrlParams();
  }

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      this.showAlert('Your previous 8-hour shift session has expired. Please sign in to resume duty.', 'info');
    } else if (params.get('logged_out') === '1') {
      this.showAlert('You have been successfully signed out of the e-Gram workstation.', 'success');
    }
  }

  showAlert(message, type = 'error') {
    this.alertBox.className = `login-alert ${type}`;
    this.alertMsg.textContent = message;
    if (type === 'error') {
      this.alertIcon.textContent = '❌';
    } else if (type === 'info') {
      this.alertIcon.textContent = '⏳';
    } else if (type === 'success') {
      this.alertIcon.textContent = '✓';
    }
    this.alertBox.style.display = 'flex';
  }

  hideAlert() {
    this.alertBox.style.display = 'none';
  }

  bindEvents() {
    // Password visibility toggle
    if (this.btnTogglePw) {
      this.btnTogglePw.addEventListener('click', () => {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.eyeIconShow.style.display = isPassword ? 'none' : 'block';
        this.eyeIconHide.style.display = isPassword ? 'block' : 'none';
        this.passwordInput.focus();
      });
    }

    // Caps Lock Warning
    if (this.passwordInput && this.capsWarning) {
      const checkCaps = (e) => {
        if (e.getModifierState && e.getModifierState('CapsLock')) {
          this.capsWarning.style.display = 'flex';
        } else {
          this.capsWarning.style.display = 'none';
        }
      };
      this.passwordInput.addEventListener('keyup', checkCaps);
      this.passwordInput.addEventListener('keydown', checkCaps);
    }

    // Theme Switcher
    if (this.btnTheme) {
      this.btnTheme.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('vce_theme', next);
      });
    }

    // Form Submission
    if (this.form) {
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.btnSubmit.disabled = true;
      this.btnSpinner.style.display = 'inline-block';
      this.btnLabel.style.display = 'none';
    } else {
      this.btnSubmit.disabled = false;
      this.btnSpinner.style.display = 'none';
      this.btnLabel.style.display = 'flex';
    }
  }

  async handleLogin() {
    this.hideAlert();
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;

    if (!username) {
      this.showAlert('Please enter your Operator ID / Username.', 'error');
      this.usernameInput.focus();
      return;
    }
    if (!password) {
      this.showAlert('Please enter your password.', 'error');
      this.passwordInput.focus();
      return;
    }

    this.setLoading(true);

    try {
      const response = await auth.login(username, password);
      // Immediately wipe credentials from form memory
      this.passwordInput.value = '';
      this.usernameInput.value = '';
      
      this.showAlert('Authentication successful! Starting 8-hour shift session...', 'success');

      // Check for redirect target
      const params = new URLSearchParams(window.location.search);
      const targetUrl = params.get('redirect') || '/pages/dashboard.html';

      setTimeout(() => {
        window.location.replace(targetUrl);
      }, 400);

    } catch (err) {
      this.setLoading(false);
      this.showAlert(err.message || 'Login failed. Please check your credentials.', 'error');
      this.passwordInput.value = '';
      this.passwordInput.focus();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LoginController();
});
