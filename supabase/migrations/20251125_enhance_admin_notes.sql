ALTER TABLE admin_notes 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

UPDATE admin_notes SET status = 'done' WHERE is_done = true;
