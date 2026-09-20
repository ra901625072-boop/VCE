/**
 * Number & Transition Utilities — VCE Flow Tracker
 * Snappy, pragmatic updates for professional productivity.
 */
import { formatINR } from './api.js';

const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Snappy number roll (180ms) for immediate feedback without artificial delays.
 */
export function animateNumber(element, endPaise, duration = 180) {
  if (!element) return;

  const currentPaiseAttr = element.getAttribute('data-paise');
  const startPaise = currentPaiseAttr !== null ? parseInt(currentPaiseAttr, 10) : 0;
  element.setAttribute('data-paise', endPaise);

  if (isReducedMotion() || startPaise === endPaise) {
    element.textContent = formatINR(endPaise);
    return;
  }

  const startTime = performance.now();
  const diff = endPaise - startPaise;

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Linear-to-fast ease
    const eased = 1 - Math.pow(1 - progress, 2);

    const currentVal = Math.round(startPaise + diff * eased);
    element.textContent = formatINR(currentVal);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = formatINR(endPaise);
    }
  }

  requestAnimationFrame(step);
}

export function triggerStagger() {
  // Anti-AI: No artificial staggered delay on content
}
