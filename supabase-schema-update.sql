-- Add missing columns to portal_items table
ALTER TABLE portal_items
ADD COLUMN IF NOT EXISTS attr_2 TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing records to have empty strings instead of NULL
UPDATE portal_items SET attr_2 = '' WHERE attr_2 IS NULL;
UPDATE portal_items SET size = '' WHERE size IS NULL;
