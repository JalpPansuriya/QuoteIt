-- WINQUOTE PRO RELATIONAL SCHEMA

-- 1. Profiles Table (User settings)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    materials JSONB DEFAULT '[]'::jsonb,
    glass_types JSONB DEFAULT '[]'::jsonb,
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
    flyscreen_sash_roller TEXT
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
