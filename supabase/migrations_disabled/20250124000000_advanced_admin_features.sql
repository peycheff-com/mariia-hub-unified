-- =============================================
-- ADVANCED ADMIN FEATURES MIGRATION
-- Staff Management, Resources, Roles & Permissions
-- =============================================

-- 1. STAFF MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_id UUID REFERENCES public.staff_roles(id),
  skills TEXT[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  hire_date TIMESTAMPTZ,
  termination_date TIMESTAMPTZ,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'freelance')),
  hourly_rate NUMERIC(10,2),
  commission_rate NUMERIC(5,2), -- Percentage
  max_daily_hours INTEGER DEFAULT 8,
  work_days TEXT[] DEFAULT '{1,2,3,4,5}', -- Day of week numbers
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

-- 2. STAFF ROLES TABLE
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  level INTEGER NOT NULL DEFAULT 0, -- Higher number = more privileges
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STAFF AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS public.staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_appointments INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, location_id, day_of_week, start_time, end_time)
);

-- 4. STAFF TIME OFF TABLE
CREATE TABLE IF NOT EXISTS public.staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('vacation', 'sick', 'personal', 'training', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  approved_by UUID REFERENCES public.staff_members(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SERVICE ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  is_primary BOOLEAN DEFAULT false,
  skill_level TEXT CHECK (skill_level IN ('junior', 'senior', 'master', 'expert')),
  commission_override NUMERIC(5,2), -- Service-specific commission
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, staff_id, location_id)
);

-- 6. EQUIPMENT & RESOURCES EXTENSION
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('person', 'room', 'equipment', 'other')),
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id),
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS maintenance_schedule JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'maintenance', 'offline'));

-- 7. BULK OPERATIONS TABLE
CREATE TABLE IF NOT EXISTS public.bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'export', 'update', 'delete')),
  target_type TEXT NOT NULL CHECK (target_type IN ('services', 'bookings', 'staff', 'customers', 'contacts')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  file_url TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  error_details JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CUSTOM REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  query_config JSONB NOT NULL,
  visualization_config JSONB DEFAULT '{}'::jsonb,
  schedule_config JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. REPORT SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.custom_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_method TEXT CHECK (delivery_method IN ('email', 'dashboard', 'webhook')),
  delivery_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_id, user_id, delivery_method)
);

-- 11. Insert default staff roles
INSERT INTO public.staff_roles (name, description, permissions, level, is_system_role) VALUES
  (
    'Super Admin',
    'Full system access with all privileges',
    '{
      "users": ["read", "write", "delete"],
      "staff": ["read", "write", "delete"],
      "services": ["read", "write", "delete"],
      "bookings": ["read", "write", "delete"],
      "analytics": ["read", "write"],
      "settings": ["read", "write"],
      "reports": ["read", "write", "delete"],
      "audit": ["read"]
    }'::jsonb,
    100,
    true
  ),
  (
    'Admin',
    'Administrative access for daily operations',
    '{
      "users": ["read"],
      "staff": ["read", "write"],
      "services": ["read", "write"],
      "bookings": ["read", "write", "delete"],
      "analytics": ["read"],
      "settings": ["read"],
      "reports": ["read", "write"]
    }'::jsonb,
    80,
    true
  ),
  (
    'Manager',
    'Managerial access with reporting capabilities',
    '{
      "staff": ["read"],
      "services": ["read"],
      "bookings": ["read", "write"],
      "analytics": ["read"],
      "reports": ["read", "write"]
    }'::jsonb,
    60,
    true
  ),
  (
    'Staff',
    'Basic staff access for assigned services',
    '{
      "services": ["read"],
      "bookings": ["read", "write"],
      "schedule": ["read", "write"]
    }'::jsonb,
    40,
    true
  ),
  (
    'Viewer',
    'Read-only access for viewing reports',
    '{
      "analytics": ["read"],
      "reports": ["read"]
    }'::jsonb,
    20,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- 12. Update Mariia as Super Admin
INSERT INTO public.staff_members (user_id, first_name, last_name, email, role_id, skills, employment_type, is_active)
SELECT
  au.id,
  'Mariia',
  'Admin',
  au.email,
  sr.id,
  ARRAY['beauty', 'fitness'],
  'full_time',
  true
FROM auth.users au
JOIN public.staff_roles sr ON sr.name = 'Super Admin'
WHERE au.email = 'ivan.devdriver+proxily@gmail.com'
ON CONFLICT (email) DO UPDATE
SET
  role_id = sr.id,
  updated_at = now();

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON public.staff_members(role_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staff_members_skills ON public.staff_members USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_time ON public.staff_availability(staff_id, day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_service_assignments_service ON public.service_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_staff ON public.service_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_date ON public.audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON public.bulk_operations(status, created_at);

-- 14. RLS Policies
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Staff Members: Admins can manage all, staff can view own
CREATE POLICY "Admins can manage all staff"
  ON public.staff_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own profile"
  ON public.staff_members FOR SELECT
  USING (auth.uid() = user_id);

-- Staff Roles: Admins only
CREATE POLICY "Admins can manage staff roles"
  ON public.staff_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Staff Availability: Admins can manage all, staff can manage own
CREATE POLICY "Admins can manage all availability"
  ON public.staff_availability FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage own availability"
  ON public.staff_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.id = staff_id
      AND sm.is_active = true
    )
  );

-- Staff Time Off: Admins can manage all, staff can manage own
CREATE POLICY "Admins can manage all time off"
  ON public.staff_time_off FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage own time off"
  ON public.staff_time_off FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.id = staff_id
    )
  );

-- Service Assignments: Admins only
CREATE POLICY "Admins can manage service assignments"
  ON public.service_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Bulk Operations: Users can view own, admins can manage all
CREATE POLICY "Users can view own bulk operations"
  ON public.bulk_operations FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all bulk operations"
  ON public.bulk_operations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Audit Log: Read-only for admins
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Custom Reports: Creator can manage, admins can manage all
CREATE POLICY "Users can manage own reports"
  ON public.custom_reports FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all reports"
  ON public.custom_reports FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Report Subscriptions: Users can manage own
CREATE POLICY "Users can manage own report subscriptions"
  ON public.report_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- 15. Trigger for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit trigger to critical tables
CREATE TRIGGER audit_staff_members
  AFTER INSERT OR UPDATE OR DELETE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 16. Function to check staff permissions
CREATE OR REPLACE FUNCTION public.has_staff_permission(
  p_user_id UUID,
  p_permission TEXT,
  p_resource_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_permissions JSONB;
  v_role_level INTEGER;
  v_required_level INTEGER;
BEGIN
  -- Get user's role permissions
  SELECT sr.permissions, sr.level
  INTO v_role_permissions, v_role_level
  FROM public.staff_members sm
  JOIN public.staff_roles sr ON sm.role_id = sr.id
  WHERE sm.user_id = p_user_id
    AND sm.is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check specific permission
  IF p_resource_type IS NOT NULL THEN
    IF COALESCE((v_role_permissions->p_resource_type), '[]'::jsonb) @> p_permission::jsonb THEN
      RETURN true;
    END IF;
  ELSE
    -- Check any permission in any resource
    FOR p_resource_type IN SELECT key FROM jsonb_each_text(v_role_permissions)
    LOOP
      IF COALESCE((v_role_permissions->p_resource_type), '[]'::jsonb) @> p_permission::jsonb THEN
        RETURN true;
      END IF;
    END LOOP;
  END IF;

  -- Check role level as fallback
  IF v_role_level >= 80 THEN -- Admin level and above
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 17. Update existing resources to be type 'person'
UPDATE public.resources
SET type = 'person'
WHERE type IS NULL;