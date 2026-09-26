import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vceApi, settingsApi, formatINR, rupeesToPaise } from '../api/client';
import { PanchayatProfile, PortalWallet } from '../types';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Queries
  const { data: profile } = useQuery<PanchayatProfile>({
    queryKey: ['vce-profile'],
    queryFn: () => vceApi.getProfile(),
  });

  const { data: wallets = [] } = useQuery<PortalWallet[]>({
    queryKey: ['portal-wallets'],
    queryFn: () => vceApi.getWallets(),
  });

  const { data: workCategories = [] } = useQuery({
    queryKey: ['settings-work-categories'],
    queryFn: () => settingsApi.getWorkCategories(),
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['settings-expense-categories'],
    queryFn: () => settingsApi.getExpenseCategories(),
  });

  // Profile Form
  const [profData, setProfData] = useState({
    gram_panchayat: '',
    center_id: '',
    taluka: '',
    district: '',
    vce_name: '',
    vce_phone: '',
    talati_name: '',
  });

  useEffect(() => {
    if (profile) {
      setProfData({
        gram_panchayat: profile.gram_panchayat || '',
        center_id: profile.center_id || '',
        taluka: profile.taluka || '',
        district: profile.district || '',
        vce_name: profile.vce_name || '',
        vce_phone: profile.vce_phone || '',
        talati_name: profile.talati_name || '',
      });
    }
  }, [profile]);

  // Wallet Modal
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBal, setNewWalletBal] = useState('');
  const [newWalletMin, setNewWalletMin] = useState('500');

  // Topup Wallet State
  const [topupWallet, setTopupWallet] = useState<PortalWallet | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('UPI');
  const [topupRef, setTopupRef] = useState('');

  // Categories
  const [newWCat, setNewWCat] = useState('');
  const [newECat, setNewECat] = useState('');

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return vceApi.updateProfile(profData);
    },
    onSuccess: () => {
      toast.success('Panchayat Center Profile saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['vce-profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile');
    },
  });

  const addWalletMutation = useMutation({
    mutationFn: async () => {
      if (!newWalletName.trim()) throw new Error('Portal name required');
      return vceApi.createWallet({
        portal_name: newWalletName.trim(),
        current_balance: rupeesToPaise(newWalletBal || '0'),
        min_alert_balance: rupeesToPaise(newWalletMin || '500'),
      });
    },
    onSuccess: () => {
      toast.success('Portal wallet configured successfully!');
      queryClient.invalidateQueries({ queryKey: ['portal-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddWalletOpen(false);
      setNewWalletName('');
      setNewWalletBal('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add wallet');
    },
  });

  const topupMutation = useMutation({
    mutationFn: async () => {
      if (!topupWallet || !topupAmount) throw new Error('Wallet and amount required');
      return vceApi.topupWallet(topupWallet.id, {
        amount: rupeesToPaise(topupAmount),
        payment_method: topupMethod,
        reference_no: topupRef,
      });
    },
    onSuccess: () => {
      toast.success('Portal wallet recharged!');
      queryClient.invalidateQueries({ queryKey: ['portal-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      setTopupWallet(null);
      setTopupAmount('');
      setTopupRef('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Top-up failed');
    },
  });

  const addWCatMutation = useMutation({
    mutationFn: async () => {
      if (!newWCat.trim()) throw new Error('Category name required');
      return settingsApi.createWorkCategory({ name: newWCat.trim() });
    },
    onSuccess: () => {
      toast.success('Service category added');
      queryClient.invalidateQueries({ queryKey: ['settings-work-categories'] });
      setNewWCat('');
    },
  });

  const deleteWCatMutation = useMutation({
    mutationFn: async (id: number) => settingsApi.deleteWorkCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['settings-work-categories'] });
    },
  });

  const addECatMutation = useMutation({
    mutationFn: async () => {
      if (!newECat.trim()) throw new Error('Category name required');
      return settingsApi.createExpenseCategory({ name: newECat.trim() });
    },
    onSuccess: () => {
      toast.success('Expense category added');
      queryClient.invalidateQueries({ queryKey: ['settings-expense-categories'] });
      setNewECat('');
    },
  });

  const deleteECatMutation = useMutation({
    mutationFn: async (id: number) => settingsApi.deleteExpenseCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['settings-expense-categories'] });
    },
  });

  return (
    <>
      {/* Gram Panchayat Center Profile Card */}
      <div className="card" style={{ marginBottom: '1.65rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏛️</span>
            <h2 className="card-title">Gram Panchayat Center Profile (ગ્રામ પંચાયત પ્રોફાઇલ)</h2>
          </div>
        </div>
        <div className="card-body">
          <form
            id="form-panchayat-profile"
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate();
            }}
          >
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Gram Panchayat Name *</label>
                <input
                  type="text"
                  id="input-prof-gp"
                  className="form-control"
                  placeholder="e.g. Pali Gram Panchayat"
                  value={profData.gram_panchayat}
                  onChange={(e) => setProfData({ ...profData, gram_panchayat: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">e-Gram Center Code / ID *</label>
                <input
                  type="text"
                  id="input-prof-center-id"
                  className="form-control font-tabular"
                  placeholder="e.g. EGRAM-GJ-0142"
                  value={profData.center_id}
                  onChange={(e) => setProfData({ ...profData, center_id: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Taluka *</label>
                <input
                  type="text"
                  id="input-prof-taluka"
                  className="form-control"
                  value={profData.taluka}
                  onChange={(e) => setProfData({ ...profData, taluka: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">District *</label>
                <input
                  type="text"
                  id="input-prof-district"
                  className="form-control"
                  value={profData.district}
                  onChange={(e) => setProfData({ ...profData, district: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">VCE Full Name *</label>
                <input
                  type="text"
                  id="input-prof-vce-name"
                  className="form-control"
                  value={profData.vce_name}
                  onChange={(e) => setProfData({ ...profData, vce_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">VCE Mobile Number *</label>
                <input
                  type="tel"
                  id="input-prof-vce-phone"
                  className="form-control font-tabular"
                  value={profData.vce_phone}
                  onChange={(e) => setProfData({ ...profData, vce_phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Talati-cum-Mantri Name</label>
                <input
                  type="text"
                  id="input-prof-talati"
                  className="form-control"
                  value={profData.talati_name}
                  onChange={(e) => setProfData({ ...profData, talati_name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.15rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontWeight: 700 }}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Center Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Appearance & Theme Card */}
      <div className="card" style={{ marginBottom: '1.65rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎨</span>
            <h2 className="card-title">Display &amp; Theme Preferences</h2>
          </div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.15rem' }}>
            Choose light or dark mode for your VCE workspace. Both modes provide high-contrast WCAG AAA compliance.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.15rem' }}>
            <label
              className="theme-choice-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.95rem 1.35rem',
                border: `2px solid ${theme === 'light' ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: 'var(--bg-surface-elevated)',
                minWidth: '220px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <input
                type="radio"
                name="vce-theme-radio"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>☀️ Daytime Light Mode</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Optimized for daylight clarity in Gram Panchayat
                </div>
              </div>
            </label>
            <label
              className="theme-choice-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.95rem 1.35rem',
                border: `2px solid ${theme === 'dark' ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: 'var(--bg-surface-elevated)',
                minWidth: '220px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <input
                type="radio"
                name="vce-theme-radio"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>🌙 Modern Dark Mode</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Comfortable for extended ledger tallies
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Android Mobile App & APK Distribution Card */}
      <div className="card apk-download-option" id="card-apk-distribution" style={{ marginBottom: '1.65rem' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📱</span>
            <h2 className="card-title">Android Mobile App &amp; APK Distribution (મોબાઇલ એપ્લિકેશન)</h2>
          </div>
          <span
            className="badge badge-success"
            style={{
              background: 'rgba(5,150,105,0.15)',
              color: 'var(--revenue)',
              border: '1px solid rgba(5,150,105,0.3)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            Latest v1.1.0
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
                VCE Pali — e-Gram Official Companion
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
                Dedicated Android workstation app connecting directly to this backend server. Features full Rojmel Daybook, Citizen directory, 1-click WhatsApp payment reminders, and PDF voucher downloads.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span>
                  <strong>Package:</strong> <code>com.vcegujarat.app</code>
                </span>
                <span>&bull;</span>
                <span>
                  <strong>APK Size:</strong> 15.3 MB
                </span>
                <span>&bull;</span>
                <span>
                  <strong>Download Route:</strong> <a href="/download/apk" style={{ color: 'var(--accent-light)' }}>/download/apk</a>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'flex-end' }}>
              <a
                href="/download/apk"
                download="VCE_Pali.apk"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  padding: '0.6rem 1.25rem',
                  textDecoration: 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Latest APK</span>
              </a>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Updated automatically via build_apk.bat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Portal Wallets & Service Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.65rem' }}>
        {/* Portal Wallets Management */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Portal Wallets &amp; Floats</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setIsAddWalletOpen(true)} type="button">
              + Add Portal
            </button>
          </div>
          <div className="card-body">
            {wallets.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No portal wallets configured</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {wallets.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{w.portal_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Min Alert: {formatINR(w.min_alert_balance || w.low_balance_threshold)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="font-tabular" style={{ fontWeight: 700, color: w.is_low_balance ? 'var(--expense)' : 'var(--revenue)' }}>
                        {formatINR(w.current_balance || w.balance)}
                      </span>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setTopupWallet(w);
                        }}
                        type="button"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Top-up
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Service Categories */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Work &amp; Service Categories</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="New service category..."
                value={newWCat}
                onChange={(e) => setNewWCat(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={() => addWCatMutation.mutate()} type="button">
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {workCategories.map((c: any) => (
                <span key={c.id} className="badge badge-waiting" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{c.name}</span>
                  <button
                    onClick={() => deleteWCatMutation.mutate(c.id)}
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Portal Wallet Modal */}
      {isAddWalletOpen && (
        <div className="modal-backdrop open" onClick={() => setIsAddWalletOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Configure Portal Wallet Float</h3>
              <button className="modal-close" onClick={() => setIsAddWalletOpen(false)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addWalletMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Portal Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. AnyRoR 7/12, Digital Gujarat, CSC"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Balance (₹)</label>
                  <input
                    type="number"
                    className="form-control font-tabular"
                    placeholder="e.g. 1500"
                    value={newWalletBal}
                    onChange={(e) => setNewWalletBal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Balance Alert Threshold (₹)</label>
                  <input
                    type="number"
                    className="form-control font-tabular"
                    value={newWalletMin}
                    onChange={(e) => setNewWalletMin(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddWalletOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }} disabled={addWalletMutation.isPending}>
                  {addWalletMutation.isPending ? 'Saving...' : 'Add Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topup Float Modal */}
      {topupWallet && (
        <div className="modal-backdrop open" onClick={() => setTopupWallet(null)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Top-up {topupWallet.portal_name}</h3>
              <button className="modal-close" onClick={() => setTopupWallet(null)} aria-label="Close" type="button">
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                topupMutation.mutate();
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Recharge Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control font-tabular"
                    placeholder="e.g. 500"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={topupMethod} onChange={(e) => setTopupMethod(e.target.value)}>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Bank Transfer">Bank Transfer / NetBanking</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Reference / UTR No.</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. UPI Ref No."
                    value={topupRef}
                    onChange={(e) => setTopupRef(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setTopupWallet(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }} disabled={topupMutation.isPending}>
                  {topupMutation.isPending ? 'Confirming...' : 'Confirm Top-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default SettingsPage;
