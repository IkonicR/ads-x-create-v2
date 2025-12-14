-- Optimization Migration: Add Indices to Foreign Keys
-- Date: 2025-11-29
-- Purpose: Prevent sequential scans on core tables by indexing foreign keys.

-- 1. Businesses Table (Owner Lookup)
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);

-- 2. Assets Table (Business Lookup)
-- We often filter by business_id AND sort by created_at, so a composite index is best.
CREATE INDEX IF NOT EXISTS idx_assets_business_created ON public.assets(business_id, created_at DESC);

-- 3. Tasks Table (Business Lookup)
CREATE INDEX IF NOT EXISTS idx_tasks_business_id ON public.tasks(business_id);

-- 4. Generation Logs (Business Lookup)
-- Used for the "Logs" tab in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_logs_business_id ON public.generation_logs(business_id);

-- 5. Admin Notes (Status/Priority)
-- Used for filtering in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_admin_notes_status ON public.admin_notes(status);
