-- Update approve_deposit to set updated_at and use the exact notification message
CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id uuid, p_admin_id uuid, p_remarks text DEFAULT NULL) RETURNS void AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_status text;
BEGIN
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_status FROM public.deposits WHERE id = p_deposit_id;
  IF v_status <> 'pending' THEN RETURN; END IF;

  UPDATE public.deposits
  SET status = 'approved',
      admin_remarks = p_remarks,
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_deposit_id;

  PERFORM public.adjust_wallet(v_user_id, v_amount, 'deposit', 'Deposit approved', p_deposit_id::text, p_deposit_id);
  PERFORM public.recompute_vip(v_user_id);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Deposit Approved', 'Your deposit has been approved successfully.', 'success');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'public';

-- Update reject_deposit to set updated_at and use the exact notification message
CREATE OR REPLACE FUNCTION public.reject_deposit(p_deposit_id uuid, p_admin_id uuid, p_remarks text DEFAULT NULL) RETURNS void AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_status text;
BEGIN
  SELECT user_id, amount, status INTO v_user_id, v_amount, v_status FROM public.deposits WHERE id = p_deposit_id;
  IF v_status <> 'pending' THEN RETURN; END IF;

  UPDATE public.deposits
  SET status = 'rejected',
      admin_remarks = p_remarks,
      rejection_reason = p_remarks,
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_deposit_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Deposit Rejected', 'Your deposit has been rejected.', 'error');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'public';
