import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  full_name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  profile_picture: string | null;
  wallet_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_rewards: number;
  vip_level: number;
  account_status: string;
  last_login: string | null;
  preferred_theme: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  payment_method_id: string | null;
  amount: number;
  reference_number: string | null;
  screenshot_url: string | null;
  status: string;
  admin_remarks: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  payment_methods?: { name: string; account_title: string; account_number: string } | null;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: string;
  admin_remarks: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};

export type VipLevel = {
  level: number;
  name: string;
  required_deposit: number;
  required_withdrawal: number;
  benefits: string | null;
  badge_color: string;
  icon: string;
  is_enabled: boolean;
  sort_order: number;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  account_title: string;
  account_number: string;
  qr_code: string | null;
  instructions: string | null;
  is_active: boolean;
  sort_order: number;
};

export type WebsiteSettings = {
  id: number;
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  reward_percentage: number;
  reward_time: string;
  reward_window_hours: number;
  reward_system_enabled: boolean;
  min_withdrawal_deposit: number;
  min_withdrawal_amount: number;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_telegram: string | null;
  contact_email: string | null;
  contact_facebook: string | null;
  contact_instagram: string | null;
  maintenance_mode: boolean;
};

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  user_id: string;
  sender: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
};

export type DailyOtp = {
  id: string;
  otp_code: string;
  reward_date: string;
  reward_time: string;
  expires_at: string;
  is_active: boolean;
};

export type RewardClaim = {
  id: string;
  user_id: string;
  otp_code: string;
  reward_amount: number;
  claim_date: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  scheduled_for: string | null;
  created_at: string;
};
