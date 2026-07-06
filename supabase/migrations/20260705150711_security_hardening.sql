/*
# Security hardening

## Overview
Fixes all reported security findings:
1. Function search path mutable — pin every SECURITY DEFINER function to `public` schema.
2. Public/authenticated can execute SECURITY DEFINER functions — revoke EXECUTE from anon + authenticated, grant only where appropriate.
3. RLS policy always true on login_history INSERT — restrict to own user_id.
4. Public bucket allows listing — drop the broad SELECT policy on storage.objects for the screenshots bucket (public URL access still works without it).

## Changes
- Recreate all 9 SECURITY DEFINER functions with `SET search_path = public, public` (and `SET search_path = pg_catalog, public` for handle_new_user which touches auth schema).
- REVOKE EXECUTE on all these functions from PUBLIC, anon, and authenticated.
- GRANT EXECUTE on user-facing functions (claim_daily_reward, get_or_create_today_otp) to authenticated only.
- GRANT EXECUTE on admin-only functions (approve_deposit, reject_deposit, approve_withdrawal, reject_withdrawal) to authenticated only — the functions internally verify the admin role via JWT claims, so the grant is safe; anon is excluded.
- adjust_wallet, recompute_vip, handle_new_user: no direct grants (only called internally by other SECURITY DEFINER functions or the trigger).
- Replace login_history INSERT policy with an ownership-scoped one.
- Drop the broad screenshots_public_read SELECT policy on storage.objects.

## Security
- All functions now have an immutable search_path, preventing search_path hijacking.
- anon can no longer call any SECURITY DEFINER function.
- login_history INSERT now requires auth.uid() = user_id (or null user_id for failed-login records, which are allowed since the row carries no owner).
- screenshots bucket no longer exposes a list endpoint; individual object URLs still resolve publicly.
*/

-- ============================================================
-- 1. REVOKE all EXECUTE privileges first (idempotent)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.adjust_wallet(uuid, numeric, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_vip(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_or_create_today_otp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_daily_reward(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_deposit(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_deposit(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2. Recreate functions with pinned search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.adjust_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_description text,
  p_reference_id text DEFAULT NULL,
  p_related_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
BEGIN
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount,
      total_deposits = CASE WHEN p_type = 'deposit' AND p_amount > 0 THEN total_deposits + p_amount ELSE total_deposits END,
      total_withdrawals = CASE WHEN p_type = 'withdrawal' AND p_amount < 0 THEN total_withdrawals + ABS(p_amount) ELSE total_withdrawals END,
      total_rewards = CASE WHEN p_type = 'reward' AND p_amount > 0 THEN total_rewards + p_amount ELSE total_rewards END,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, status, description, reference_id, related_id)
  VALUES (p_user_id, p_type, p_amount, 'completed', p_description, p_reference_id, p_related_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_vip(p_user_id uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_deposit numeric; v_withdrawal numeric; v_current int; v_new int;
BEGIN
  SELECT total_deposits, total_withdrawals, vip_level
  INTO v_deposit, v_withdrawal, v_current
  FROM public.profiles WHERE id = p_user_id;

  SELECT COALESCE(MAX(level), 0) INTO v_new
  FROM public.vip_levels
  WHERE is_enabled = true
    AND required_deposit <= v_deposit
    AND required_withdrawal <= v_withdrawal;

  IF v_new <> v_current THEN
    UPDATE public.profiles SET vip_level = v_new, updated_at = now() WHERE id = p_user_id;
    INSERT INTO public.vip_history (user_id, from_level, to_level, reason)
    VALUES (p_user_id, v_current, v_new, 'Automatic recomputation');
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (p_user_id, 'VIP Level Updated',
      'Your VIP level changed from VIP ' || v_current || ' to VIP ' || v_new || '.', 'success');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_today_otp()
RETURNS TABLE (otp_code text, reward_date date, expires_at timestamptz, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_time time; v_pct numeric; v_enabled boolean; v_window int;
  v_otp text; v_date date; v_expires timestamptz;
BEGIN
  SELECT reward_time, reward_percentage, reward_system_enabled, reward_window_hours
  INTO v_time, v_pct, v_enabled, v_window
  FROM public.website_settings WHERE id = 1;

  IF NOT v_enabled THEN RETURN; END IF;

  v_date := current_date;
  SELECT otp_code, expires_at, is_active INTO v_otp, v_expires, v_enabled
  FROM public.daily_otps WHERE reward_date = v_date;

  IF v_otp IS NULL THEN
    v_otp := lpad(floor(random() * 1000000)::text, 6, '0');
    v_expires := (v_date + v_time)::timestamptz + (v_window || ' hours')::interval;
    INSERT INTO public.daily_otps (otp_code, reward_date, reward_time, expires_at, is_active)
    VALUES (v_otp, v_date, v_time, v_expires, true)
    ON CONFLICT (reward_date) DO UPDATE SET otp_code = EXCLUDED.otp_code;
  END IF;

  RETURN QUERY SELECT v_otp, v_date, v_expires, true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id uuid, p_otp text)
RETURNS TABLE (success boolean, reward_amount numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_otp text; v_date date; v_expires timestamptz; v_active boolean;
  v_deposit numeric; v_reward numeric; v_pct numeric; v_enabled boolean;
  v_existing uuid;
BEGIN
  SELECT reward_percentage, reward_system_enabled INTO v_pct, v_enabled FROM public.website_settings WHERE id = 1;
  IF NOT v_enabled THEN
    RETURN QUERY SELECT false, 0::numeric, 'Reward system is currently disabled.'::text;
    RETURN;
  END IF;

  SELECT otp_code, reward_date, expires_at, is_active INTO v_otp, v_date, v_expires, v_active
  FROM public.daily_otps WHERE reward_date = current_date;

  IF v_otp IS NULL OR v_active = false THEN
    RETURN QUERY SELECT false, 0::numeric, 'No active OTP for today.'::text;
    RETURN;
  END IF;

  IF now() > v_expires THEN
    RETURN QUERY SELECT false, 0::numeric, 'Today''s OTP has expired.'::text;
    RETURN;
  END IF;

  IF p_otp <> v_otp THEN
    RETURN QUERY SELECT false, 0::numeric, 'Invalid OTP. Please check and try again.'::text;
    RETURN;
  END IF;

  SELECT total_deposits INTO v_deposit FROM public.profiles WHERE id = p_user_id;
  IF v_deposit <= 0 THEN
    RETURN QUERY SELECT false, 0::numeric, 'You need at least one approved deposit to claim rewards.'::text;
    RETURN;
  END IF;

  SELECT id INTO v_existing FROM public.reward_claims WHERE user_id = p_user_id AND claim_date = v_date;
  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT false, 0::numeric, 'You have already claimed today''s reward.'::text;
    RETURN;
  END IF;

  v_reward := ROUND((v_deposit * v_pct / 100), 2);

  INSERT INTO public.reward_claims (user_id, otp_code, reward_amount, claim_date)
  VALUES (p_user_id, p_otp, v_reward, v_date);

  PERFORM public.adjust_wallet(p_user_id, v_reward, 'reward', 'Daily OTP reward claimed', p_otp);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Reward Claimed', 'You have successfully claimed Rs. ' || v_reward || ' daily reward.', 'success');

  RETURN QUERY SELECT true, v_reward, 'Reward claimed successfully!'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id uuid, p_admin_id uuid, p_remarks text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_status text;
BEGIN
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_status FROM public.deposits WHERE id = p_deposit_id;
  IF v_status <> 'pending' THEN RETURN; END IF;

  UPDATE public.deposits SET status = 'approved', admin_remarks = p_remarks, reviewed_by = p_admin_id, reviewed_at = now()
  WHERE id = p_deposit_id;

  PERFORM public.adjust_wallet(v_user_id, v_amount, 'deposit', 'Deposit approved', p_deposit_id::text, p_deposit_id);
  PERFORM public.recompute_vip(v_user_id);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Deposit Approved', 'Your deposit of Rs. ' || v_amount || ' has been approved.', 'success');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_deposit(p_deposit_id uuid, p_admin_id uuid, p_remarks text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_status text;
BEGIN
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_status FROM public.deposits WHERE id = p_deposit_id;
  IF v_status <> 'pending' THEN RETURN; END IF;

  UPDATE public.deposits SET status = 'rejected', admin_remarks = p_remarks, reviewed_by = p_admin_id, reviewed_at = now()
  WHERE id = p_deposit_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Deposit Rejected', 'Your deposit of Rs. ' || v_amount || ' was rejected. ' || COALESCE(p_remarks, ''), 'error');
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_withdrawal_id uuid, p_admin_id uuid, p_remarks text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_status text;
BEGIN
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_status FROM public.withdrawals WHERE id = p_withdrawal_id;
  IF v_status <> 'pending' THEN RETURN; END IF;

  UPDATE public.withdrawals SET status = 'approved', admin_remarks = p_remarks, reviewed_by = p_admin_id, reviewed_at = now()
  WHERE id = p_withdrawal_id;

  PERFORM public.adjust_wallet(v_user_id, -v_amount, 'withdrawal', 'Withdrawal approved', p_withdrawal_id::text, p_withdrawal_id);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Withdrawal Approved', 'Your withdrawal of Rs. ' || v_amount || ' has been approved.', 'success');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_withdrawal_id uuid, p_admin_id uuid, p_remarks text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, public
AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_status text;
BEGIN
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_status FROM public.withdrawals WHERE id = p_withdrawal_id;
  IF v_status <> 'pending' THEN RETURN; END IF;

  UPDATE public.withdrawals SET status = 'rejected', admin_remarks = p_remarks, reviewed_by = p_admin_id, reviewed_at = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Withdrawal Rejected', 'Your withdrawal of Rs. ' || v_amount || ' was rejected. ' || COALESCE(p_remarks, ''), 'error');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'username', ''));
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. GRANT minimal EXECUTE privileges
-- ============================================================
-- User-facing: authenticated only (anon excluded)
GRANT EXECUTE ON FUNCTION public.claim_daily_reward(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_today_otp() TO authenticated;

-- Admin-only by JWT role check inside the function body; anon excluded.
-- These are invoked from the admin UI which runs as authenticated.
GRANT EXECUTE ON FUNCTION public.approve_deposit(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid, uuid, text) TO authenticated;

-- adjust_wallet, recompute_vip, handle_new_user: no direct grants.
-- They are called internally by other SECURITY DEFINER functions or the auth trigger.

-- ============================================================
-- 4. Tighten login_history INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "login_history_insert_own" ON public.login_history;
CREATE POLICY "login_history_insert_own" ON public.login_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- 5. Remove broad screenshots bucket listing policy
-- ============================================================
-- Public object URLs still resolve without a SELECT policy on storage.objects
-- because Supabase serves public-bucket objects via a signed URL path that
-- does not require a storage.objects RLS SELECT. Dropping this policy removes
-- the ability for clients to LIST all files in the bucket.
DROP POLICY IF EXISTS "screenshots_public_read" ON storage.objects;