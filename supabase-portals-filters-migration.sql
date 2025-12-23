-- Add ship date and customer type tracking to portals
-- Run this in Supabase SQL Editor

-- Add ship date column
ALTER TABLE portals ADD COLUMN IF NOT EXISTS ship_date DATE;

-- Add flag to track if portal was created with a new customer
ALTER TABLE portals ADD COLUMN IF NOT EXISTS is_new_customer BOOLEAN DEFAULT FALSE;

-- Update status check to include 'shipped'
ALTER TABLE portals DROP CONSTRAINT IF EXISTS portals_status_check;
ALTER TABLE portals ADD CONSTRAINT portals_status_check 
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'shipped'));

-- Index for ship date sorting
CREATE INDEX IF NOT EXISTS idx_portals_ship_date ON portals(ship_date);

-- Index for new customer filtering
CREATE INDEX IF NOT EXISTS idx_portals_is_new_customer ON portals(is_new_customer);

-- Index for trade show filtering
CREATE INDEX IF NOT EXISTS idx_portals_trade_show ON portals(trade_show_name);
