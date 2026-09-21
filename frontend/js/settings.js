/**
 * Settings & Panchayat Profile Controller — VCE Pali e-Gram
 */
import { api, vceApi } from './api.js';
import { notify } from '../components/notification.js';

async function loadAllSettings() {
  await Promise.all([
    loadPanchayatProfile(),
    loadWorkCategories(),
    loadExpenseCategories(),
    loadPaymentMethods(),
    loadWorkStatuses()
  ]);
}

async function loadPanchayatProfile() {
  try {
    const prof = await vceApi.getProfile();
    if (!prof) return;
    document.getElementById('input-prof-gp').value = prof.gram_panchayat || '';
    document.getElementById('input-prof-center-id').value = prof.center_id || '';
    document.getElementById('input-prof-taluka').value = prof.taluka || '';
    document.getElementById('input-prof-district').value = prof.district || '';
    document.getElementById('input-prof-vce-name').value = prof.vce_name || '';
    document.getElementById('input-prof-vce-phone').value = prof.vce_phone || '';
    document.getElementById('input-prof-talati').value = prof.talati_name || '';
  } catch (err) {
    console.error('Failed to load panchayat profile:', err);
  }
}

async function loadWorkCategories() {
  const list = document.getElementById('wcat-list');
  try {
    const cats = await api.get('/settings/work-categories');
    list.innerHTML = cats.map(c => `
      <li style="display:flex; justify-content:space-between; align-items:center; padding:0.55rem 0.85rem; background:var(--bg-input); border-radius:var(--radius-sm); border:1px solid var(--border-subtle); transition:background-color var(--duration-fast);">
        <span style="font-weight:500; font-size:0.875rem; color:var(--text-main);">${c.name} ${c.is_default ? '<span style="color:var(--text-dim); font-size:0.7rem; margin-left:0.35rem;">(Default)</span>' : ''}</span>
        ${!c.is_default ? `<button class="btn btn-outline btn-sm btn-del-wcat" data-id="${c.id}" style="padding:0.2rem 0.5rem; color:var(--expense); font-size:0.75rem;" title="Delete category">✕</button>` : ''}
      </li>
    `).join('');

    document.querySelectorAll('.btn-del-wcat').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this category?')) return;
        await api.delete(`/settings/work-categories/${btn.dataset.id}`);
        notify.success('Work category removed');
        loadWorkCategories();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadExpenseCategories() {
  const list = document.getElementById('ecat-list');
  try {
    const cats = await api.get('/settings/expense-categories');
    list.innerHTML = cats.map(c => `
      <li style="display:flex; justify-content:space-between; align-items:center; padding:0.55rem 0.85rem; background:var(--bg-input); border-radius:var(--radius-sm); border:1px solid var(--border-subtle); transition:background-color var(--duration-fast);">
        <span style="font-weight:500; font-size:0.875rem; color:var(--text-main);">${c.name} ${c.is_default ? '<span style="color:var(--text-dim); font-size:0.7rem; margin-left:0.35rem;">(Default)</span>' : ''}</span>
        ${!c.is_default ? `<button class="btn btn-outline btn-sm btn-del-ecat" data-id="${c.id}" style="padding:0.2rem 0.5rem; color:var(--expense); font-size:0.75rem;" title="Delete category">✕</button>` : ''}
      </li>
    `).join('');

    document.querySelectorAll('.btn-del-ecat').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this category?')) return;
        await api.delete(`/settings/expense-categories/${btn.dataset.id}`);
        notify.success('Expense category removed');
        loadExpenseCategories();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadPaymentMethods() {
  const list = document.getElementById('method-list');
  try {
    const methods = await api.get('/settings/payment-methods');
    list.innerHTML = methods.map(m => `
      <li style="display:flex; justify-content:space-between; align-items:center; padding:0.55rem 0.85rem; background:var(--bg-input); border-radius:var(--radius-sm); border:1px solid var(--border-subtle); transition:background-color var(--duration-fast);">
        <span style="font-weight:500; font-size:0.875rem; color:var(--text-main);">${m.name} ${m.is_system ? '<span style="color:var(--text-dim); font-size:0.7rem; margin-left:0.35rem;">(System)</span>' : ''}</span>
        ${!m.is_system ? `<button class="btn btn-outline btn-sm btn-del-method" data-id="${m.id}" style="padding:0.2rem 0.5rem; color:var(--expense); font-size:0.75rem;" title="Delete method">✕</button>` : ''}
      </li>
    `).join('');

    document.querySelectorAll('.btn-del-method').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this payment method?')) return;
        await api.delete(`/settings/payment-methods/${btn.dataset.id}`);
        notify.success('Payment method removed');
        loadPaymentMethods();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadWorkStatuses() {
  const list = document.getElementById('status-list');
  try {
    const statuses = await api.get('/settings/work-statuses');
    list.innerHTML = statuses.map(s => `
      <li style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.85rem; background:var(--bg-input); border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
        <span class="badge badge-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${s.name}</span>
        <span style="font-size:0.75rem; color:var(--text-dim); font-family:var(--font-mono);">Sequence: ${s.sort_order}</span>
      </li>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllSettings();

  // Panchayat Profile Form submit
  document.getElementById('form-panchayat-profile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      gram_panchayat: document.getElementById('input-prof-gp').value.trim(),
      center_id: document.getElementById('input-prof-center-id').value.trim(),
      taluka: document.getElementById('input-prof-taluka').value.trim(),
      district: document.getElementById('input-prof-district').value.trim(),
      vce_name: document.getElementById('input-prof-vce-name').value.trim(),
      vce_phone: document.getElementById('input-prof-vce-phone').value.trim(),
      talati_name: document.getElementById('input-prof-talati').value.trim()
    };
    try {
      await vceApi.updateProfile(payload);
      notify.success('Gram Panchayat center profile updated successfully!');
    } catch (err) {
      notify.error('Failed to update profile: ' + err.message);
    }
  });

  document.getElementById('form-add-wcat')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('wcat-name');
    const name = input.value.trim();
    if (!name) return;
    try {
      await api.post('/settings/work-categories', { name });
      notify.success(`Added service category: ${name}`);
      input.value = '';
      loadWorkCategories();
    } catch (err) {
      notify.error(err.message);
    }
  });

  document.getElementById('form-add-ecat')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('ecat-name');
    const name = input.value.trim();
    if (!name) return;
    try {
      await api.post('/settings/expense-categories', { name });
      notify.success(`Added expense category: ${name}`);
      input.value = '';
      loadExpenseCategories();
    } catch (err) {
      notify.error(err.message);
    }
  });

  document.getElementById('form-add-method')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('method-name');
    const name = input.value.trim();
    if (!name) return;
    try {
      await api.post('/settings/payment-methods', { name });
      notify.success(`Added payment method: ${name}`);
      input.value = '';
      loadPaymentMethods();
    } catch (err) {
      notify.error(err.message);
    }
  });

  // Theme selector syncing
  function syncThemeRadios() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const radio = document.querySelector(`input[name="vce-theme-radio"][value="${cur}"]`);
    if (radio) radio.checked = true;
  }

  syncThemeRadios();

  document.querySelectorAll('input[name="vce-theme-radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (window.ThemeManager) {
        window.ThemeManager.setTheme(selected);
      } else {
        document.documentElement.setAttribute('data-theme', selected);
        localStorage.setItem('vce_theme', selected);
      }
      notify.success(selected === 'light' ? 'Light Mode enabled' : 'Dark Mode enabled');
    });
  });

  window.addEventListener('vce:theme-change', () => {
    syncThemeRadios();
  });

  // Remove APK distribution card if running inside Android native app
  const isNative = typeof window.AndroidBridge !== 'undefined' ||
                   navigator.userAgent.includes('VCE-Android-Native') ||
                   window.location.search.includes('native=true') ||
                   document.documentElement.classList.contains('is-native-app');
  if (isNative) {
    document.documentElement.classList.add('is-native-app');
    document.getElementById('card-apk-distribution')?.remove();
    document.querySelectorAll('.apk-download-option, [href*="/download/apk"], [download*=".apk"]').forEach(el => el.remove());
  }
});
