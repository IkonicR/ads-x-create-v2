-- ============================================================================
-- FIX BUSINESS_MEMBERS RLS RECURSION
-- Replaces recursive policies with proper ownership-based checks
-- Production-ready: Accounts for owners + team members (admin/editor/viewer)
-- ============================================================================

-- 1. DROP ALL EXISTING POLICIES (exhaustive list to catch any variations)
DROP POLICY IF EXISTS "Users can view memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users can insert memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users can update memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users can delete memberships" ON public.business_members;
DROP POLICY IF EXISTS "view_own_membership" ON public.business_members;
DROP POLICY IF EXISTS "insert_membership" ON public.business_members;
DROP POLICY IF EXISTS "update_membership" ON public.business_members;
DROP POLICY IF EXISTS "delete_membership" ON public.business_members;
DROP POLICY IF EXISTS "select_own_or_owned_memberships" ON public.business_members;
DROP POLICY IF EXISTS "insert_for_owned_businesses" ON public.business_members;
DROP POLICY IF EXISTS "update_for_owned_businesses" ON public.business_members;
DROP POLICY IF EXISTS "delete_for_owned_businesses" ON public.business_members;

-- 2. ENSURE RLS IS ENABLED
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- 3. CREATE NEW NON-RECURSIVE POLICIES

-- SELECT Policy:
-- - Users can see their OWN membership record (needed for getBusinesses)
-- - Owners can see ALL members of their businesses (needed for Team Management)
-- Key: Checks businesses.owner_id, NOT business_members (avoids recursion)
CREATE POLICY "select_own_or_owned_memberships"
    ON public.business_members
    FOR SELECT
    USING (
        user_id = auth.uid()  -- Team member sees their own record
        OR
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())  -- Owner sees all
    );

-- INSERT Policy:
-- - Only business owners can insert memberships
-- - This includes creating their own owner record when creating a business
-- Key: Checks businesses.owner_id DIRECTLY (not business_members)
CREATE POLICY "insert_for_owned_businesses"
    ON public.business_members
    FOR INSERT
    WITH CHECK (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

-- UPDATE Policy:
-- - Only owners can update membership records (e.g., change roles)
-- - Team members cannot update their own role
CREATE POLICY "update_for_owned_businesses"
    ON public.business_members
    FOR UPDATE
    USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

-- DELETE Policy:
-- - Owners can remove team members from their business
-- - Owners cannot delete their own record (prevents orphaned businesses)
CREATE POLICY "delete_for_owned_businesses"
    ON public.business_members
    FOR DELETE
    USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
        AND user_id != auth.uid()  -- Safety: Cannot delete self
    );

-- 4. GRANT ACCESS TO AUTHENTICATED USERS
GRANT ALL ON public.business_members TO authenticated;

-- 5. DOCUMENTATION
COMMENT ON TABLE public.business_members IS 'Maps users to businesses with roles (owner/admin/editor/viewer). RLS fixed 2026-01-29 to avoid infinite recursion by checking businesses.owner_id instead of self-referencing.';
