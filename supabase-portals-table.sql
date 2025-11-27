-- Portals table to store customer order portals
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS portals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique link for portal access
  unique_link TEXT UNIQUE NOT NULL,
  
  -- Customer reference (can be linked to customers table or standalone)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Customer info (stored directly for portals with new customers)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Shipping address
  shipping_address_1 TEXT,
  shipping_address_2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'USA',
  
  -- Location reference (if selected from customer locations)
  location_id UUID REFERENCES customer_locations(id) ON DELETE SET NULL,
  location_name TEXT,
  
  -- Trade show info
  trade_show_name TEXT,
  notes TEXT,
  
  -- Portal status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  
  -- Portal URL (for convenience)
  url TEXT
);

-- Index for unique link lookups (primary access method)
CREATE INDEX IF NOT EXISTS idx_portals_unique_link ON portals(unique_link);

-- Index for customer lookups
CREATE INDEX IF NOT EXISTS idx_portals_customer_id ON portals(customer_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_portals_status ON portals(status);

-- Index for date sorting
CREATE INDEX IF NOT EXISTS idx_portals_created_at ON portals(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS portals_updated_at ON portals;
CREATE TRIGGER portals_updated_at
  BEFORE UPDATE ON portals
  FOR EACH ROW
  EXECUTE FUNCTION update_portals_updated_at();

-- Grant permissions
ALTER TABLE portals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations on portals" ON portals
  FOR ALL USING (true) WITH CHECK (true);
