-- Add Ivan (peychev.mill@gmail.com) as admin
-- First, get the user_id from auth.users where email matches
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id for peychev.mill@gmail.com
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'peychev.mill@gmail.com';
  
  -- If user exists, insert admin role (ignore if already exists)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User with email peychev.mill@gmail.com not found. Please sign up first.';
  END IF;
END $$;