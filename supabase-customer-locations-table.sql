-- Customer Locations table to store multiple shipping addresses per customer
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customer_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Link to customer
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  am_customer_id TEXT,  -- ApparelMagic customer_id for reference
  
  -- ApparelMagic location fields
  am_location_id TEXT UNIQUE,  -- ApparelMagic ship_to_id
  location_name TEXT,  -- The name/label for this address
  address_1 TEXT,
  address_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  phone TEXT,
  email TEXT,
  store_number TEXT,
  dc_reference TEXT,
  department_number TEXT,
  is_main_location BOOLEAN DEFAULT FALSE
);

-- Index for fast lookups by customer
CREATE INDEX IF NOT EXISTS idx_customer_locations_customer_id ON customer_locations(customer_id);

-- Index for ApparelMagic customer ID lookups
CREATE INDEX IF NOT EXISTS idx_customer_locations_am_customer_id ON customer_locations(am_customer_id);

-- Index for ApparelMagic location ID
CREATE INDEX IF NOT EXISTS idx_customer_locations_am_location_id ON customer_locations(am_location_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_locations_updated_at ON customer_locations;
CREATE TRIGGER customer_locations_updated_at
  BEFORE UPDATE ON customer_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_locations_updated_at();

-- Grant permissions
ALTER TABLE customer_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on customer_locations" ON customer_locations
  FOR ALL USING (true) WITH CHECK (true);
