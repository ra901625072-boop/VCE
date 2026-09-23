/**
 * Modal Dialog Controller — VCE Pali e-Gram Center & Financial Ledger
 * Accessible dialog manager with state-machine entrance/exit transitions and focus restoration.
 */

export function closeModalAnimated(modalEl, onComplete = null) {
  if (!modalEl) return;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    modalEl.classList.remove('open', 'active', 'closing');
    document.body.style.overflow = '';
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  modalEl.classList.add('closing');
  setTimeout(() => {
    modalEl.classList.remove('open', 'active', 'closing');
    document.body.style.overflow = '';
    if (typeof onComplete === 'function') onComplete();
  }, 140);
}

export class Modal {
  constructor(modalId) {
    this.modalEl = document.getElementById(modalId);
    this.previouslyFocusedEl = null;
    this.isClosing = false;
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
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
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
    this.isClosing = false;
    this.modalEl.classList.remove('closing');
    this.previouslyFocusedEl = document.activeElement;
    this.modalEl.classList.add('open');
    this.modalEl.classList.add('active');
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
    if (!this.modalEl || !this.isOpen() || this.isClosing) return;

    this.isClosing = true;
    closeModalAnimated(this.modalEl, () => {
      this.isClosing = false;
      // Restore focus to opener element if applicable
      if (this.previouslyFocusedEl && typeof this.previouslyFocusedEl.focus === 'function') {
        this.previouslyFocusedEl.focus();
      }
    });
  }

  isOpen() {
    return this.modalEl &&
      (this.modalEl.classList.contains('open') || this.modalEl.classList.contains('active')) &&
      !this.modalEl.classList.contains('closing');
  }
}
