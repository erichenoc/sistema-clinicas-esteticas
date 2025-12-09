-- Migration: Add RLS policies for clinics and branches tables
-- These tables had RLS enabled but no policies, blocking all access

-- =============================================
-- CLINICS TABLE POLICIES
-- =============================================

-- Allow authenticated users to view clinics they belong to
CREATE POLICY "Users can view their clinic"
ON clinics FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR
  -- Allow viewing the default clinic for new users
  id = '00000000-0000-0000-0000-000000000001'
);

-- Allow authenticated users to update their clinic
CREATE POLICY "Users can update their clinic"
ON clinics FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR id = '00000000-0000-0000-0000-000000000001'
)
WITH CHECK (
  id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR id = '00000000-0000-0000-0000-000000000001'
);

-- Allow inserting the default clinic (for first-time setup)
CREATE POLICY "Allow inserting default clinic"
ON clinics FOR INSERT
TO authenticated
WITH CHECK (
  id = '00000000-0000-0000-0000-000000000001'
  OR
  id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
);

-- =============================================
-- BRANCHES TABLE POLICIES
-- =============================================

-- Allow authenticated users to view branches of their clinic
CREATE POLICY "Users can view their clinic branches"
ON branches FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR clinic_id = '00000000-0000-0000-0000-000000000001'
);

-- Allow authenticated users to manage branches of their clinic
CREATE POLICY "Users can insert branches"
ON branches FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR clinic_id = '00000000-0000-0000-0000-000000000001'
);

CREATE POLICY "Users can update their clinic branches"
ON branches FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR clinic_id = '00000000-0000-0000-0000-000000000001'
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR clinic_id = '00000000-0000-0000-0000-000000000001'
);

CREATE POLICY "Users can delete their clinic branches"
ON branches FOR DELETE
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE users.id = auth.uid()
  )
  OR clinic_id = '00000000-0000-0000-0000-000000000001'
);
