/**
 * Toast Notification System — VCE Pali e-Gram Center & Financial Ledger
 * Tactile interactive toasts with animated SVG status icons and horizontal slide dismissal.
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon-wrap" style="flex-shrink:0; display:flex; align-items:center;">${iconSvg}</div>
      <div style="flex:1; line-height:1.4;">${message}</div>
      <div class="toast-progress" style="transition: transform ${duration}ms linear; transform: scaleX(0);"></div>
    `;

    this.container.appendChild(toast);

    // Trigger timer bar
    requestAnimationFrame(() => {
      const progress = toast.querySelector('.toast-progress');
      if (progress) progress.style.transform = 'scaleX(1)';
    });

    let isDismissed = false;
    const dismiss = () => {
      if (isDismissed) return;
      isDismissed = true;
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 160);
    };

    // Click to dismiss immediately with animation
    toast.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }

  success(message) {
    this.show(message, 'success');
  }

  error(message) {
    this.show(message, 'error', 4500);
  }

  warning(message) {
    this.show(message, 'warning', 4000);
  }

  info(message) {
    this.show(message, 'info');
  }
}

export const notify = new NotificationManager();
