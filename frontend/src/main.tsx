import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Intercept native Android bridge / APK detection flag
const isNative =
  typeof (window as any).AndroidBridge !== 'undefined' ||
  navigator.userAgent.includes('VCE-Android-Native') ||
  window.location.search.includes('native=true');

if (isNative) {
  document.documentElement.classList.add('is-native-app');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
