-- WINQUOTE PRO RELATIONAL SCHEMA

-- 1. Profiles Table (User settings)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    materials JSONB DEFAULT '[]'::jsonb,
    glass_types JSONB DEFAULT '[]'::jsonb,
    presets JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Products Table (Catalog)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    material TEXT,
    glass_type TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    series TEXT,
    glass TEXT,
    reinforcement TEXT,
    frame_joins TEXT,
    flyscreen TEXT,
    color TEXT,
    track TEXT,
    track_ri TEXT,
    sliding_sash TEXT,
    sliding_sash_ri TEXT,
    flyscreen_sash TEXT,
    interlock TEXT,
    fly_mesh_type TEXT,
    guide_rail TEXT,
    handle TEXT,
    flyscreen_handle TEXT,
    sliding_sash_roller TEXT,
    flyscreen_sash_roller TEXT,
    default_width DECIMAL,
    default_height DECIMAL
);

-- 4. Quotes Table (Header)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    quote_number TEXT NOT NULL,
    status TEXT DEFAULT 'Draft',
    date BIGINT, 
    valid_until BIGINT,
    subtotal DECIMAL DEFAULT 0,
    discount_type TEXT DEFAULT 'flat',
    discount_value DECIMAL DEFAULT 0,
    discount_amount DECIMAL DEFAULT 0,
    apply_gst BOOLEAN DEFAULT TRUE,
    gst_rate INTEGER DEFAULT 18,
    gst_amount DECIMAL DEFAULT 0,
    grand_total DECIMAL DEFAULT 0,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Quote Items Table (Line Items)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    width DECIMAL,
    height DECIMAL,
    qty INTEGER DEFAULT 1,
    unit TEXT,
    rate DECIMAL DEFAULT 0,
    discount DECIMAL DEFAULT 0,
    subtotal DECIMAL DEFAULT 0,
    total DECIMAL DEFAULT 0,
    series TEXT,
    glass TEXT,
    reinforcement TEXT,
    frame_joins TEXT,
    flyscreen TEXT,
    color TEXT,
    track TEXT,
    track_ri TEXT,
    sliding_sash TEXT,
    sliding_sash_ri TEXT,
    flyscreen_sash TEXT,
    interlock TEXT,
    fly_mesh_type TEXT,
    guide_rail TEXT,
    handle TEXT,
    flyscreen_handle TEXT,
    sliding_sash_roller TEXT,
    flyscreen_sash_roller TEXT
);

-- RLS POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can only update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can only insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own clients" ON clients USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own products" ON products USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own quotes" ON quotes USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quotes" ON quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON quotes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access items of their own quotes" ON quote_items 
USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can insert items into their own quotes" ON quote_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can update items in their own quotes" ON quote_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can delete items in their own quotes" ON quote_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()));

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, features)
  VALUES (new.id, '{"defaultGstEnabled": true, "defaultGstRate": 18, "autoGenerateQuoteNumbers": true}'::jsonb)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- QUOTEIT v2.0 EXPANSION — NEW TABLES
-- ============================================================

-- Quotes table updates (versioning + invoice conversion)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS expiry_date BIGINT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID;

-- 6. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'unit',
    cost_price DECIMAL DEFAULT 0,
    quantity_on_hand INTEGER DEFAULT 0,
    reorder_threshold INTEGER DEFAULT 5,
    catalog_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own inventory" ON inventory_items USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Inventory Adjustments Table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    adjusted_by UUID NOT NULL REFERENCES auth.users(id),
    adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access adjustments of their own inventory" ON inventory_adjustments
USING (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = inventory_adjustments.inventory_item_id AND inventory_items.user_id = auth.uid()));
CREATE POLICY "Users can insert adjustments into their own inventory" ON inventory_adjustments FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = inventory_adjustments.inventory_item_id AND inventory_items.user_id = auth.uid()));

-- 8. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status TEXT DEFAULT 'Draft',
    issue_date BIGINT,
    due_date BIGINT,
    subtotal DECIMAL DEFAULT 0,
    tax_amount DECIMAL DEFAULT 0,
    discount_amount DECIMAL DEFAULT 0,
    total DECIMAL DEFAULT 0,
    amount_paid DECIMAL DEFAULT 0,
    balance_due DECIMAL DEFAULT 0,
    last_payment_date BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own invoices" ON invoices USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL DEFAULT 0,
    total DECIMAL DEFAULT 0
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access items of their own invoices" ON invoice_line_items
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert items into their own invoices" ON invoice_line_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update items in their own invoices" ON invoice_line_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete items in their own invoices" ON invoice_line_items FOR DELETE
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount DECIMAL NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    payment_date BIGINT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own payments" ON payments USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON payments FOR DELETE USING (auth.uid() = user_id);
