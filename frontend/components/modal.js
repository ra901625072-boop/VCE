/**
 * Modal Dialog Controller — VCE Flow Tracker
 * Accessible dialog manager with focus restoration & backdrop click dismissal.
 */

export class Modal {
  constructor(modalId) {
    this.modalEl = document.getElementById(modalId);
    this.previouslyFocusedEl = null;
    if (!this.modalEl) return;

    this.initEvents();
  }

  initEvents() {
    // Backdrop click close
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Close button click
    const closeButtons = this.modalEl.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  open() {
    if (!this.modalEl) return;
    this.previouslyFocusedEl = document.activeElement;
    this.modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus first interactive control after transition starts
    setTimeout(() => {
      const firstInput = this.modalEl.querySelector('input:not([type="hidden"]), select, textarea, button.btn-primary');
      if (firstInput) {
        firstInput.focus();
      }
    }, 60);
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
    document.body.style.overflow = '';

    // Restore focus to opener element if applicable
    if (this.previouslyFocusedEl && typeof this.previouslyFocusedEl.focus === 'function') {
      this.previouslyFocusedEl.focus();
    }
  }

  isOpen() {
    return this.modalEl && this.modalEl.classList.contains('open');
  }
}
