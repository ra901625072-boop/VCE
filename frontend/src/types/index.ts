/**
 * Domain Type Definitions — VCE Pali e-Gram Digital Center & Financial Ledger
 */

export interface User {
  id?: number;
  username: string;
  full_name?: string;
  role?: string;
  operator_id?: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_at?: string;
  expires_in?: number;
  user: User;
}

export interface Citizen {
  id: number;
  name: string;
  phone: string;
  email?: string;
  village?: string;
  faliyu?: string;
  khata_no?: string;
  ration_card_no?: string;
  citizen_type?: string;
  notes?: string;
  tags?: string;
  total_work_count?: number;
  work_count?: number;
  active_work_count?: number;
  total_paid?: number;
  total_received?: number;
  total_agreed?: number;
  total_pending?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  gujarati_title?: string;
  category: string;
  portal: string;
  portal_code?: string;
  citizen_fee: number; // in paise
  portal_deduction: number; // in paise
  panchayat_share: number; // in paise
  vce_commission: number; // in paise
  required_documents?: string[];
  notes?: string;
}

export interface WorkItem {
  id: number;
  person_id: number;
  person_name?: string;
  person_phone?: string;
  person_village?: string;
  title: string;
  description?: string;
  category: string;
  service_category?: string;
  agreed_amount: number; // paise
  received_amount: number; // paise
  pending_amount: number; // paise
  status: 'Received' | 'Processing' | 'Completed' | 'Delivered' | 'Rejected' | string;
  priority?: string;
  token_number?: string;
  token_no?: string;
  ack_no?: string;
  portal_name?: string;
  portal_app_id?: string;
  portal_cost?: number; // paise
  panchayat_share?: number; // paise
  vce_commission?: number; // paise
  payment_mode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Udhar' | string;
  is_mandated_govt_task?: boolean;
  start_date?: string;
  deadline?: string;
  completed_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentItem {
  id: number;
  work_id?: number;
  person_id?: number;
  person_name?: string;
  work_title?: string;
  amount: number; // paise
  payment_date: string;
  payment_time?: string;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Udhar' | string;
  transaction_reference?: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseItem {
  id: number;
  title: string;
  amount: number; // paise
  expense_date: string;
  expense_time?: string;
  category_id?: number;
  category?: string;
  category_name?: string;
  vendor?: string;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | string;
  receipt_ref?: string;
  notes?: string;
  created_at?: string;
}

export interface PortalWallet {
  id: number;
  portal_name: string;
  balance?: number; // paise
  current_balance?: number; // paise
  low_balance_threshold?: number; // paise
  min_alert_balance?: number; // paise
  is_low_balance?: boolean;
  account_identifier?: string;
  last_topup_date?: string;
  last_topup_amount?: number;
  updated_at?: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  portal_name?: string;
  transaction_type: 'topup' | 'debit' | 'refund';
  amount: number; // paise
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface PanchayatProfile {
  gram_panchayat: string;
  taluka: string;
  district: string;
  center_id: string;
  vce_name: string;
  vce_phone: string;
  talati_name?: string;
  sarpanch_name?: string;
  updated_at?: string;
}

export interface RojmelInflow {
  id: string | number;
  source?: string;
  title?: string;
  particulars?: string;
  token_number?: string;
  citizen_name?: string;
  person_name?: string;
  payment_mode?: 'Cash' | 'UPI' | string;
  payment_method?: 'Cash' | 'UPI' | string;
  amount: number; // paise
  created_at?: string;
}

export interface RojmelOutflow {
  id: string | number;
  category?: string;
  title?: string;
  particulars?: string;
  payment_mode?: 'Cash' | 'UPI' | string;
  payment_method?: 'Cash' | 'UPI' | string;
  amount: number; // paise
  created_at?: string;
}

export interface RojmelData {
  target_date: string;
  panchayat_profile?: PanchayatProfile;
  opening_drawer_cash: number; // paise
  opening_bank_balance: number; // paise
  total_aavak: number; // paise
  total_javak: number; // paise
  aavak_cash: number; // paise
  aavak_upi: number; // paise
  javak_cash: number; // paise
  javak_upi: number; // paise
  closing_drawer_cash: number; // paise
  closing_bank_balance: number; // paise
  gross_cash_surplus?: number; // paise
  inflows?: RojmelInflow[];
  outflows?: RojmelOutflow[];
  aavak_entries?: RojmelInflow[];
  javak_entries?: RojmelOutflow[];
  is_day_closed?: boolean;
  closed_at?: string;
  closed_by?: string;
}

export interface DashboardMetrics {
  today_revenue: number; // paise
  today_expenses: number; // paise
  today_profit: number; // paise
  today_citizen_cash: number; // paise
  today_citizen_upi: number; // paise
  total_pending_udhar: number; // paise
  active_applications_count: number;
  period_revenue: number; // paise
  period_expenses: number; // paise
  period_profit: number; // paise
  net_commission_revenue?: number; // paise
  panchayat_share_payable?: number; // paise
  total_panchayat_remitted?: number; // paise
  portal_wallets_balance?: number; // paise
  pending_dept_claims?: number; // paise
}

export interface DashboardData {
  panchayat_profile: PanchayatProfile;
  metrics: DashboardMetrics;
  portal_wallets: PortalWallet[];
  pending_dept_orders: any[];
  todays_work: WorkItem[];
  revenue_vs_expenses_trend: any;
  expenses_by_category: {
    category?: string;
    label?: string;
    amount: number;
    percentage: number;
  }[];
}

export interface ReportRow {
  [key: string]: any;
}

export interface ReportData {
  title: string;
  report_type: string;
  period: string;
  total_amount?: number;
  totals?: any;
  revenue?: number;
  expenses?: number;
  profit?: number;
  columns?: string[];
  rows: ReportRow[];
}
