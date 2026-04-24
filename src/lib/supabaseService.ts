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
        presets: {
          series: data.settings.series,
          colors: data.settings.colors,
          reinforcements: data.settings.reinforcements,
          frameJoins: data.settings.frameJoins,
          tracks: data.settings.tracks,
          trackRIs: data.settings.trackRIs,
          slidingSashes: data.settings.slidingSashes,
          slidingSashRIs: data.settings.slidingSashRIs,
          flyscreens: data.settings.flyscreens,
          flyscreenSashes: data.settings.flyscreenSashes,
          interlocks: data.settings.interlocks,
          flyMeshTypes: data.settings.flyMeshTypes,
          guideRails: data.settings.guideRails,
          handles: data.settings.handles,
          flyscreenHandles: data.settings.flyscreenHandles,
          slidingSashRollers: data.settings.slidingSashRollers,
          flyscreenSashRollers: data.settings.flyscreenSashRollers
        },
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
          created_at: new Date(p.createdAt).toISOString(),
          series: p.series,
          glass: p.glass,
          reinforcement: p.reinforcement,
          frame_joins: p.frameJoins,
          flyscreen: p.flyscreen,
          color: p.color,
          track: p.track,
          track_ri: p.trackRI,
          sliding_sash: p.slidingSash,
          sliding_sash_ri: p.slidingSashRI,
          flyscreen_sash: p.flyscreenSash,
          interlock: p.interlock,
          fly_mesh_type: p.flyMeshType,
          guide_rail: p.guideRail,
          handle: p.handle,
          flyscreen_handle: p.flyscreenHandle,
          sliding_sash_roller: p.slidingSashRoller,
          flyscreen_sash_roller: p.flyscreenSashRoller,
          default_width: p.defaultWidth,
          default_height: p.defaultHeight
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
            total: item.total,
            series: item.series,
            glass: item.glass,
            reinforcement: item.reinforcement,
            frame_joins: item.frameJoins,
            flyscreen: item.flyscreen,
            color: item.color,
            track: item.track,
            track_ri: item.trackRI,
            sliding_sash: item.slidingSash,
            sliding_sash_ri: item.slidingSashRI,
            flyscreen_sash: item.flyscreenSash,
            interlock: item.interlock,
            fly_mesh_type: item.flyMeshType,
            guide_rail: item.guideRail,
            handle: item.handle,
            flyscreen_handle: item.flyscreenHandle,
            sliding_sash_roller: item.slidingSashRoller,
            flyscreen_sash_roller: item.flyscreenSashRoller
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
        series: profile?.presets?.series || [],
        colors: profile?.presets?.colors || [],
        reinforcements: profile?.presets?.reinforcements || [],
        frameJoins: profile?.presets?.frameJoins || [],
        tracks: profile?.presets?.tracks || [],
        trackRIs: profile?.presets?.trackRIs || [],
        slidingSashes: profile?.presets?.slidingSashes || [],
        slidingSashRIs: profile?.presets?.slidingSashRIs || [],
        flyscreens: profile?.presets?.flyscreens || [],
        flyscreenSashes: profile?.presets?.flyscreenSashes || [],
        interlocks: profile?.presets?.interlocks || [],
        flyMeshTypes: profile?.presets?.flyMeshTypes || [],
        guideRails: profile?.presets?.guideRails || [],
        handles: profile?.presets?.handles || [],
        flyscreenHandles: profile?.presets?.flyscreenHandles || [],
        slidingSashRollers: profile?.presets?.slidingSashRollers || [],
        flyscreenSashRollers: profile?.presets?.flyscreenSashRollers || [],
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
        createdAt: new Date(p.created_at).getTime(),
        series: p.series,
        glass: p.glass,
        reinforcement: p.reinforcement,
        frameJoins: p.frame_joins,
        flyscreen: p.flyscreen,
        color: p.color,
        track: p.track,
        trackRI: p.track_ri,
        slidingSash: p.sliding_sash,
        slidingSashRI: p.sliding_sash_ri,
        flyscreenSash: p.flyscreen_sash,
        interlock: p.interlock,
        flyMeshType: p.fly_mesh_type,
        guideRail: p.guide_rail,
        handle: p.handle,
        flyscreenHandle: p.flyscreen_handle,
        slidingSashRoller: p.sliding_sash_roller,
        flyscreenSashRoller: p.flyscreen_sash_roller,
        defaultWidth: p.default_width ? Number(p.default_width) : undefined,
        defaultHeight: p.default_height ? Number(p.default_height) : undefined
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
          total: Number(item.total),
          series: item.series,
          glass: item.glass,
          reinforcement: item.reinforcement,
          frameJoins: item.frame_joins,
          flyscreen: item.flyscreen,
          color: item.color,
          track: item.track,
          trackRI: item.track_ri,
          slidingSash: item.sliding_sash,
          slidingSashRI: item.sliding_sash_ri,
          flyscreenSash: item.flyscreen_sash,
          interlock: item.interlock,
          flyMeshType: item.fly_mesh_type,
          guideRail: item.guide_rail,
          handle: item.handle,
          flyscreenHandle: item.flyscreen_handle,
          slidingSashRoller: item.sliding_sash_roller,
          flyscreenSashRoller: item.flyscreen_sash_roller
        }))
      })) || []
    };
  },

  deleteQuote: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
  },

  deleteClient: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  deleteProduct: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }
};

