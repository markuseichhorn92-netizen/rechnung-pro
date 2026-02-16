-- Rechnung Pro - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT '',
  owner_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT 'Deutschland',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  tax_id TEXT DEFAULT '', -- Steuernummer
  vat_id TEXT DEFAULT '', -- USt-IdNr.
  bank_name TEXT DEFAULT '',
  iban TEXT DEFAULT '',
  bic TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  invoice_prefix TEXT DEFAULT 'RE-',
  next_invoice_number INTEGER DEFAULT 1,
  quote_prefix TEXT DEFAULT 'AN-',
  next_quote_number INTEGER DEFAULT 1,
  default_payment_terms INTEGER DEFAULT 14,
  default_tax_rate DECIMAL(5,2) DEFAULT 19.00,
  footer_text TEXT DEFAULT '',
  is_small_business BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT 'Deutschland',
  tax_id TEXT DEFAULT '', -- USt-IdNr. des Kunden
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  unit TEXT DEFAULT 'Stück',
  price DECIMAL(12,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  category TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  delivery_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) DEFAULT 0.00,
  notes TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12,3) DEFAULT 1.000,
  unit TEXT DEFAULT 'Stück',
  unit_price DECIMAL(12,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  total DECIMAL(12,2) DEFAULT 0.00,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  issue_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) DEFAULT 0.00,
  notes TEXT DEFAULT '',
  converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Items Table
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12,3) DEFAULT 1.000,
  unit TEXT DEFAULT 'Stück',
  unit_price DECIMAL(12,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  total DECIMAL(12,2) DEFAULT 0.00,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders (Mahnungen) Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 3), -- 0=Erinnerung, 1-3=Mahnung
  sent_date DATE DEFAULT CURRENT_DATE,
  fee DECIMAL(12,2) DEFAULT 0.00,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_reminders_invoice ON reminders(invoice_id);

-- Insert default company settings if not exists
INSERT INTO company_settings (id, company_name, invoice_prefix, quote_prefix)
SELECT uuid_generate_v4(), 'Meine Firma', 'RE-', 'AN-'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- Enable Row Level Security (RLS) - for future auth
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for now)
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for invoice_items" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Allow all for quotes" ON quotes FOR ALL USING (true);
CREATE POLICY "Allow all for quote_items" ON quote_items FOR ALL USING (true);
CREATE POLICY "Allow all for reminders" ON reminders FOR ALL USING (true);
CREATE POLICY "Allow all for company_settings" ON company_settings FOR ALL USING (true);

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for logos
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'logos');
