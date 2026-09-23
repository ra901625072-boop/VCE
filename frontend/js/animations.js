/**
 * Motion & Animation Controller — VCE Pali e-Gram Center & Financial Ledger
 * Fast, tactile, accessible micro-interactions and state-machine transitions.
 * Zero artificial loading delays — built for high-throughput institutional productivity.
 */
import { formatINR } from './api.js';

export const isReducedMotion = () => {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Tabular number roll (180ms–220ms) with smooth cubic-bezier deceleration.
 * Cancels any active frame step to prevent animation collisions on rapid state changes.
 */
export function animateNumber(element, endPaise, duration = 200, onComplete = null) {
  if (!element) return;

  const currentPaiseAttr = element.getAttribute('data-paise');
  const startPaise = currentPaiseAttr !== null ? parseInt(currentPaiseAttr, 10) : 0;
  element.setAttribute('data-paise', endPaise);

  if (isReducedMotion() || startPaise === endPaise) {
    element.textContent = formatINR(endPaise);
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  // Cancel prior active animation frame if stored on element
  if (element._animFrameId) {
    cancelAnimationFrame(element._animFrameId);
  }

  const startTime = performance.now();
  const diff = endPaise - startPaise;

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Cubic ease-out curve: fast acceleration -> gentle settle
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round(startPaise + diff * eased);
    element.textContent = formatINR(currentVal);

    if (progress < 1) {
      element._animFrameId = requestAnimationFrame(step);
    } else {
      element.textContent = formatINR(endPaise);
      element._animFrameId = null;
      if (typeof onComplete === 'function') onComplete();
    }
  }

  element._animFrameId = requestAnimationFrame(step);
}

/**
 * Flash ledger confirmation on financial metrics when state updates (Receipts/Expenses/Udhar).
 * Gives the operator immediate visual confirmation of which metric was affected.
 */
export function flashMetric(element, type = 'revenue') {
  if (!element || isReducedMotion()) return;

  const cls = type === 'expense'
    ? 'flash-ledger-expense'
    : type === 'pending'
      ? 'flash-ledger-pending'
      : 'flash-ledger-revenue';

  element.classList.remove('flash-ledger-revenue', 'flash-ledger-expense', 'flash-ledger-pending');
  // Trigger reflow to restart animation
  void element.offsetWidth;
  element.classList.add(cls);

  setTimeout(() => {
    element.classList.remove(cls);
  }, 750);
}

/**
 * Tactile validation feedback: Horizontal micro-shake on form inputs or cards.
 */
export function shakeInput(element) {
  if (!element) return;

  const target = element.closest('.form-control') || element.closest('.form-group') || element;
  target.classList.remove('input-error-shake');
  void target.offsetWidth;
  target.classList.add('input-error-shake');

  if (typeof element.focus === 'function') {
    element.focus();
  }

  setTimeout(() => {
    target.classList.remove('input-error-shake');
  }, 260);
}

/**
 * Table row entrance highlight for newly registered citizen tokens, receipts, or expenses.
 */
export function animateRowAddition(rowElement) {
  if (!rowElement || isReducedMotion()) return;

  rowElement.classList.add('row-newly-added');
  setTimeout(() => {
    rowElement.classList.remove('row-newly-added');
  }, 1200);
}

/**
 * Clean row exit animation before DOM removal.
 */
export function animateRowRemoval(rowElement, onComplete) {
  if (!rowElement) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  if (isReducedMotion()) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  rowElement.classList.add('row-exit-collapse');
  setTimeout(() => {
    if (typeof onComplete === 'function') onComplete();
  }, 140);
}

/**
 * Animate progress bar fill smoothly from 0 or current to target percentage.
 */
export function animateProgressBar(barElement, targetPct, duration = 260) {
  if (!barElement) return;

  barElement.classList.add('progress-bar-animated');
  if (isReducedMotion()) {
    barElement.style.width = `${Math.min(100, Math.max(0, targetPct))}%`;
    return;
  }

  barElement.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barElement.style.width = `${Math.min(100, Math.max(0, targetPct))}%`;
    });
  });
}

/**
 * Tactile physical actuation feedback for keyboard shortcut badges (.nav-kbd-hint).
 */
export function triggerKbdShortcutFeedback(keyChar) {
  if (!keyChar) return;
  const targetChar = String(keyChar).toUpperCase();

  document.querySelectorAll('.nav-kbd-hint').forEach(badge => {
    if (badge.textContent.trim().toUpperCase() === targetChar) {
      badge.classList.add('kbd-pressed');
      setTimeout(() => {
        badge.classList.remove('kbd-pressed');
      }, 140);
    }
  });
}

/**
 * Pop animation on status badge state changes (e.g. In Progress -> Ready / Completed).
 */
export function triggerBadgePop(badgeElement) {
  if (!badgeElement || isReducedMotion()) return;
  badgeElement.classList.remove('badge-state-pop');
  void badgeElement.offsetWidth;
  badgeElement.classList.add('badge-state-pop');
  setTimeout(() => {
    badgeElement.classList.remove('badge-state-pop');
  }, 200);
}

export function triggerStagger() {
  // Institutional Workstation Rule: Zero artificial staggered delay on content loading.
}
