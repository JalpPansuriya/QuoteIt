-- QUOTEIT v3.0 MIGRATION SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Update quote_items table with missing columns
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS sections INTEGER DEFAULT 2;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS glass TEXT;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS hardware TEXT;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS rubber_color TEXT;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'pending';

-- 2. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    location TEXT,
    total_units INTEGER DEFAULT 0,
    unit_type TEXT DEFAULT 'Flats',
    status TEXT DEFAULT 'Proposal',
    start_date BIGINT,
    end_date BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Project Progress Table
CREATE TABLE IF NOT EXISTS project_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    units_completed INTEGER NOT NULL,
    remarks TEXT,
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Add project_id to other tables for cross-module tracking
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 5. Enable RLS and set policies for Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access their own projects" ON projects;
CREATE POLICY "Users can access their own projects" ON projects USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable RLS and set policies for Project Progress
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access progress of their own projects" ON project_progress;
CREATE POLICY "Users can access progress of their own projects" ON project_progress
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_progress.project_id AND projects.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert progress into their own projects" ON project_progress;
CREATE POLICY "Users can insert progress into their own projects" ON project_progress FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_progress.project_id AND projects.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete progress from their own projects" ON project_progress;
CREATE POLICY "Users can delete progress from their own projects" ON project_progress FOR DELETE
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_progress.project_id AND projects.user_id = auth.uid()));

-- 7. Triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
