import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { vceApi, peopleApi, workApi, paymentsApi, expensesApi, rupeesToPaise } from '../../api/client';
import { useToast } from '../../context/ToastContext';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ isOpen, onClose, initialService }) => {
  const [tab, setTab] = useState<'app' | 'payment' | 'expense'>('app');
  const toast = useToast();
  const queryClient = useQueryClient();

  // Load citizens and services for selectors
  const { data: citizens = [] } = useQuery({
    queryKey: ['citizens'],
    queryFn: () => peopleApi.getAll(),
    enabled: isOpen,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: () => vceApi.getServicesCatalog(),
    enabled: isOpen,
  });

  // App form state
  const [citizenId, setCitizenId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [appPaymentMode, setAppPaymentMode] = useState<string>('Cash');

  React.useEffect(() => {
    if (isOpen && initialService && services.length > 0) {
      const match = services.find((s) => s.title.toLowerCase().includes(initialService.toLowerCase()));
      if (match) {
        setServiceId(match.id);
      }
    }
  }, [isOpen, initialService, services]);

  // Payment form state
  const [payCitizenId, setPayCitizenId] = useState<number | ''>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payNotes, setPayNotes] = useState<string>('Direct settlement');

  // Expense form state
  const [expTitle, setExpTitle] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('Center Supplies');
  const [expMethod, setExpMethod] = useState<string>('Cash');

  // Mutations
  const createAppMutation = useMutation({
    mutationFn: async () => {
      const selectedService = services.find((s) => s.id === serviceId);
      if (!selectedService || !citizenId) throw new Error('Please select citizen and service');

      return workApi.create({
        person_id: Number(citizenId),
        title: selectedService.title,
        category: selectedService.category,
        agreed_amount: selectedService.citizen_fee,
        received_amount: appPaymentMode === 'Udhar' ? 0 : selectedService.citizen_fee,
        pending_amount: appPaymentMode === 'Udhar' ? selectedService.citizen_fee : 0,
        status: 'Received',
        portal_name: selectedService.portal,
        portal_cost: selectedService.portal_deduction,
        panchayat_share: selectedService.panchayat_share,
        vce_commission: selectedService.vce_commission,
        payment_mode: appPaymentMode,
      });
    },
    onSuccess: () => {
      toast.success('Service application recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['work'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create application');
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!payCitizenId || !payAmount) throw new Error('Citizen and amount are required');
      return paymentsApi.create({
        person_id: Number(payCitizenId),
        amount: rupeesToPaise(payAmount),
        payment_method: payMethod,
        payment_date: new Date().toISOString().split('T')[0],
        notes: payNotes,
      });
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['citizens'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment');
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!expTitle || !expAmount) throw new Error('Title and amount are required');
      return expensesApi.create({
        title: expTitle,
        amount: rupeesToPaise(expAmount),
        payment_method: expMethod,
        expense_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      toast.success('Expense recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rojmel'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record expense');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'app') createAppMutation.mutate();
    else if (tab === 'payment') createPaymentMutation.mutate();
    else if (tab === 'expense') createExpenseMutation.mutate();
  };

  const isSubmitting =
    createAppMutation.isPending || createPaymentMutation.isPending || createExpenseMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Ledger Entry" size="md">
      {/* Segmented Selector */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('app')}
          style={{
            flex: 1,
            padding: '0.45rem',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: tab === 'app' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: tab === 'app' ? 'var(--accent)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <FileText size={14} />
          <span>New Application</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('payment')}
          style={{
            flex: 1,
            padding: '0.45rem',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: tab === 'payment' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: tab === 'payment' ? 'var(--revenue-light)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <ArrowDownLeft size={14} />
          <span>Receive Cash/UPI</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('expense')}
          style={{
            flex: 1,
            padding: '0.45rem',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: tab === 'expense' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: tab === 'expense' ? 'var(--expense-light)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <ArrowUpRight size={14} />
          <span>Center Expense</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {tab === 'app' && (
          <>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Citizen / Farmer *
              </label>
              <select
                className="form-control"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value ? Number(e.target.value) : '')}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)' }}
              >
                <option value="">Select Citizen...</option>
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.village ? `— ${c.village}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                e-Gram Service / Portal *
              </label>
              <select
                className="form-control"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)' }}
              >
                <option value="">Select Service...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} (₹{(s.citizen_fee / 100).toFixed(0)}) — {s.portal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Payment Mode *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Cash', 'UPI', 'Udhar'].map((mode) => (
                  <label
                    key={mode}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      background: appPaymentMode === mode ? 'var(--accent-bg)' : 'var(--bg-input)',
                      border: `1px solid ${appPaymentMode === mode ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      color: appPaymentMode === mode ? 'var(--accent-light)' : 'var(--text-secondary)',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="appPaymentMode"
                      value={mode}
                      checked={appPaymentMode === mode}
                      onChange={() => setAppPaymentMode(mode)}
                      style={{ display: 'none' }}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'payment' && (
          <>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Citizen *
              </label>
              <select
                className="form-control"
                value={payCitizenId}
                onChange={(e) => setPayCitizenId(e.target.value ? Number(e.target.value) : '')}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)' }}
              >
                <option value="">Select Citizen...</option>
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.total_pending && c.total_pending > 0 ? `[Pending Udhar: ₹${(c.total_pending / 100).toFixed(0)}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Method *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Cash', 'UPI', 'Bank Transfer'].map((mode) => (
                  <label
                    key={mode}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      background: payMethod === mode ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-input)',
                      border: `1px solid ${payMethod === mode ? 'var(--revenue)' : 'var(--border-subtle)'}`,
                      color: payMethod === mode ? 'var(--revenue-light)' : 'var(--text-secondary)',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      value={mode}
                      checked={payMethod === mode}
                      onChange={() => setPayMethod(mode)}
                      style={{ display: 'none' }}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'expense' && (
          <>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Expense Particulars *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. A4 Paper Rim, Toner Refill, Internet"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Payment Method *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Cash', 'UPI'].map((mode) => (
                  <label
                    key={mode}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      background: expMethod === mode ? 'rgba(220, 38, 38, 0.15)' : 'var(--bg-input)',
                      border: `1px solid ${expMethod === mode ? 'var(--expense)' : 'var(--border-subtle)'}`,
                      color: expMethod === mode ? 'var(--expense-light)' : 'var(--text-secondary)',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="expMethod"
                      value={mode}
                      checked={expMethod === mode}
                      onChange={() => setExpMethod(mode)}
                      style={{ display: 'none' }}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem' }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Record Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
