-- Consolidate RLS Policies Migration
-- Replaces duplicate admin policies with generic function-based policies

-- First, create the generic admin check function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin_or_owner(user_id_to_check uuid DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  -- Check if current user is admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is viewing their own data
  IF user_id_to_check IS NOT NULL AND auth.uid() = user_id_to_check THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop duplicate admin policies and replace with generic ones
-- Note: Only drop policies that follow the "Admins can view" pattern

-- VAT registers
DROP POLICY IF EXISTS "Admins can view VAT registers" ON vat_registers;
CREATE POLICY "Users can view own VAT registers OR admins" ON vat_registers
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
CREATE POLICY "Users can view own audit entries OR admins" ON audit_log
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
CREATE POLICY "Users can view own feedback OR admins" ON feedback
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Invoices
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Users can view own invoices OR admins" ON invoices
  FOR SELECT USING (is_admin_or_owner(user_id));

-- WhatsApp message logs
DROP POLICY IF EXISTS "Admins can view all logs" ON whatsapp_message_logs;
CREATE POLICY "Users can view own WhatsApp logs OR admins" ON whatsapp_message_logs
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Translation projects
DROP POLICY IF EXISTS "Admins can view all projects" ON translation_projects;
CREATE POLICY "Users can view own translation projects OR admins" ON translation_projects
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Message threads
DROP POLICY IF EXISTS "Admins can view all threads" ON message_threads;
CREATE POLICY "Users can view own message threads OR admins" ON message_threads
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Messages
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Users can view own messages OR admins" ON messages
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Email logs
DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
CREATE POLICY "Users can view own email logs OR admins" ON email_logs
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Campaigns
DROP POLICY IF EXISTS "Admins can view all campaigns" ON campaigns;
CREATE POLICY "Users can view own campaigns OR admins" ON campaigns
  FOR SELECT USING (is_admin_or_owner(user_id));

-- Failed login attempts - Fix security issue
DROP POLICY IF EXISTS "Users can view failed login attempts" ON failed_login_attempts;
CREATE POLICY "Only admins can view failed login attempts" ON failed_login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Grant execute permission to all authenticated users
GRANT EXECUTE ON FUNCTION is_admin_or_owner TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION is_admin_or_owner IS 'Generic function to check if user is admin or owner - used for consolidated RLS policies';