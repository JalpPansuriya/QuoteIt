import { getSupabase } from './supabase';
import { Client, Product, Quote, AppSettings } from '../types';

export const supabaseService = {
  saveAll: async (data: { clients: Client[], products: Product[], quotes: Quote[], settings: AppSettings }) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Save Settings (Profile)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        materials: data.settings.materials,
        glass_types: data.settings.glassTypes,
        features: data.settings.features
      });
    if (profileError) throw profileError;

    // 2. Save Clients
    if (data.clients.length > 0) {
      const { error: clientsError } = await supabase
        .from('clients')
        .upsert(data.clients.map(c => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          created_at: new Date(c.createdAt).toISOString()
        })));
      if (clientsError) throw clientsError;
    }

    // 3. Save Products
    if (data.products.length > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .upsert(data.products.map(p => ({
          id: p.id,
          user_id: user.id,
          name: p.name,
          material: p.material,
          glass_type: p.glassType,
          base_rate: p.baseRate,
          unit: p.unit,
          created_at: new Date(p.createdAt).toISOString()
        })));
      if (productsError) throw productsError;
    }

    // 4. Save Quotes & Items
    for (const quote of data.quotes) {
      const { error: quoteError } = await supabase
        .from('quotes')
        .upsert({
          id: quote.id,
          user_id: user.id,
          client_id: quote.clientId,
          quote_number: quote.quoteNumber,
          status: quote.status,
          date: quote.date,
          valid_until: quote.validUntil,
          subtotal: quote.subtotal,
          discount_type: quote.discountType,
          discount_value: quote.discountValue,
          discount_amount: quote.discountAmount,
          apply_gst: quote.applyGst,
          gst_rate: quote.gstRate,
          gst_amount: quote.gstAmount,
          grand_total: quote.grandTotal,
          notes: quote.notes,
          terms: quote.terms,
          created_at: new Date(quote.createdAt).toISOString()
        });
      if (quoteError) throw quoteError;

      // Save Items for this quote
      if (quote.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .upsert(quote.items.map(item => ({
            id: item.id,
            quote_id: quote.id,
            product_id: item.productId,
            name: item.name,
            description: item.description,
            width: item.width,
            height: item.height,
            qty: item.qty,
            unit: item.unit,
            rate: item.rate,
            discount: item.discount,
            subtotal: item.subtotal,
            total: item.total
          })));
        if (itemsError) throw itemsError;
      }
    }

    return true;
  },

  loadAll: async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Load Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    // Load Clients
    const { data: clients } = await supabase.from('clients').select('*').eq('user_id', user.id);
    
    // Load Products
    const { data: products } = await supabase.from('products').select('*').eq('user_id', user.id);
    
    // Load Quotes
    const { data: quotesData } = await supabase.from('quotes').select('*, quote_items(*)').eq('user_id', user.id);

    return {
      settings: {
        materials: profile?.materials || [],
        glassTypes: profile?.glass_types || [],
        features: profile?.features || {}
      },
      clients: clients?.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        createdAt: new Date(c.created_at).getTime()
      })) || [],
      products: products?.map(p => ({
        id: p.id,
        name: p.name,
        material: p.material,
        glassType: p.glass_type,
        baseRate: Number(p.base_rate),
        unit: p.unit,
        createdAt: new Date(p.created_at).getTime()
      })) || [],
      quotes: quotesData?.map(q => ({
        id: q.id,
        clientId: q.client_id,
        quoteNumber: q.quote_number,
        status: q.status,
        date: q.date,
        validUntil: q.valid_until,
        subtotal: Number(q.subtotal),
        discountType: q.discount_type,
        discountValue: Number(q.discount_value),
        discountAmount: Number(q.discount_amount),
        applyGst: q.apply_gst,
        gstRate: q.gst_rate,
        gstAmount: Number(q.gst_amount),
        grandTotal: Number(q.grand_total),
        notes: q.notes,
        terms: q.terms,
        createdAt: new Date(q.created_at).getTime(),
        updatedAt: q.updated_at ? new Date(q.updated_at).getTime() : new Date(q.created_at).getTime(),
        items: q.quote_items.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          name: item.name,
          description: item.description,
          width: Number(item.width),
          height: Number(item.height),
          qty: Number(item.qty),
          unit: item.unit,
          rate: Number(item.rate),
          discount: Number(item.discount),
          subtotal: Number(item.subtotal),
          total: Number(item.total)
        }))
      })) || []
    };
  }
};

