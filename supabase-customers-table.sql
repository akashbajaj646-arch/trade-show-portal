-- Customers table to store synced ApparelMagic customers
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ApparelMagic fields
  am_customer_id TEXT UNIQUE,  -- ApparelMagic customer_id
  customer_name TEXT NOT NULL,
  account_number TEXT,
  email TEXT,
  phone TEXT,
  address_1 TEXT,
  address_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  
  -- Additional ApparelMagic fields
  credit_limit TEXT,
  status TEXT,
  category TEXT,
  terms_id TEXT,
  division_id TEXT,
  price_group TEXT,
  notes TEXT,
  is_active TEXT DEFAULT '1',
  
  -- For local-only customers (created in portal, not yet in AM)
  is_local_only BOOLEAN DEFAULT FALSE
);

-- Index for fast name searching
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin(to_tsvector('english', customer_name));

-- Index for ApparelMagic ID lookups
CREATE INDEX IF NOT EXISTS idx_customers_am_id ON customers(am_customer_id);

-- Index for searching by email
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Grant permissions (adjust as needed for your RLS policies)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you may want to restrict this later)
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);
