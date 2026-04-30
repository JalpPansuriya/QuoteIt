import { getSupabase } from './supabase';
import { Client, Product, Quote, AppSettings, InventoryItem, InventoryAdjustment, Invoice, Payment, Project, ProjectProgress } from '../types';

export const supabaseService = {
  // ── Legacy bulk save (quotes editor auto-save) ──
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
          version: quote.version || 1,
          parent_quote_id: quote.parentQuoteId || null,
          expiry_date: quote.expiryDate || null,
          approval_notes: quote.approvalNotes || null,
          converted_to_invoice_id: quote.convertedToInvoiceId || null,
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

  // ── Targeted saves for new modules ──

  saveInventoryItem: async (item: InventoryItem) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { error } = await supabase.from('inventory_items').upsert({
      id: item.id,
      user_id: user.id,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      cost_price: item.costPrice,
      quantity_on_hand: item.quantityOnHand,
      reorder_threshold: item.reorderThreshold,
      catalog_product_id: item.catalogProductId || null,
    });
    if (error) throw error;
    return true;
  },

  deleteInventoryItem: async (id: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
  },

  saveInventoryAdjustment: async (adj: InventoryAdjustment, newQty: number) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { error: adjError } = await supabase.from('inventory_adjustments').upsert({
      id: adj.id,
      inventory_item_id: adj.inventoryItemId,
      adjustment_type: adj.adjustmentType,
      quantity: adj.quantity,
      reason: adj.reason,
      adjusted_by: user.id,
    });
    if (adjError) throw adjError;

    // Update item quantity
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ quantity_on_hand: newQty })
      .eq('id', adj.inventoryItemId);
    if (updateError) throw updateError;

    return true;
  },

  saveInvoice: async (invoice: Invoice) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { error: invError } = await supabase.from('invoices').upsert({
      id: invoice.id,
      user_id: user.id,
      quote_id: invoice.quoteId || null,
      client_id: invoice.clientId,
      invoice_number: invoice.invoiceNumber,
      status: invoice.status,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      subtotal: invoice.subtotal,
      tax_amount: invoice.taxAmount,
      discount_amount: invoice.discountAmount,
      total: invoice.total,
      amount_paid: invoice.amountPaid,
      balance_due: invoice.balanceDue,
      last_payment_date: invoice.lastPaymentDate || null,
      notes: invoice.notes,
    });
    if (invError) throw invError;

    // Upsert line items
    if (invoice.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_line_items')
        .upsert(invoice.items.map(item => ({
          id: item.id,
          invoice_id: invoice.id,
          product_id: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
        })));
      if (itemsError) throw itemsError;
    }

    return true;
  },

  deleteInvoice: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  savePayment: async (payment: Payment) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { error } = await supabase.from('payments').insert({
      id: payment.id,
      user_id: user.id,
      invoice_id: payment.invoiceId,
      client_id: payment.clientId,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber || null,
      payment_date: payment.paymentDate,
      notes: payment.notes,
      recorded_by: user.id,
    });
    if (error) throw error;
    return true;
  },

  // ── Load all data ──
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

    // Load Inventory
    const { data: inventoryData } = await supabase.from('inventory_items').select('*, inventory_adjustments(*)').eq('user_id', user.id);

    // Load Invoices
    const { data: invoicesData } = await supabase.from('invoices').select('*, invoice_line_items(*)').eq('user_id', user.id);

    // Load Payments
    const { data: paymentsData } = await supabase.from('payments').select('*').eq('user_id', user.id);

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
        version: q.version || 1,
        parentQuoteId: q.parent_quote_id || undefined,
        expiryDate: q.expiry_date || undefined,
        approvalNotes: q.approval_notes || undefined,
        convertedToInvoiceId: q.converted_to_invoice_id || undefined,
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
      })) || [],
      inventoryItems: inventoryData?.map(i => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        unit: i.unit,
        costPrice: Number(i.cost_price),
        quantityOnHand: Number(i.quantity_on_hand),
        reorderThreshold: Number(i.reorder_threshold),
        catalogProductId: i.catalog_product_id || undefined,
        createdAt: new Date(i.created_at).getTime(),
        updatedAt: new Date(i.updated_at).getTime(),
        adjustments: i.inventory_adjustments?.map((a: any) => ({
          id: a.id,
          inventoryItemId: a.inventory_item_id,
          adjustmentType: a.adjustment_type,
          quantity: Number(a.quantity),
          reason: a.reason || '',
          adjustedBy: a.adjusted_by,
          adjustedAt: new Date(a.adjusted_at).getTime(),
        })) || []
      })) || [],
      inventoryAdjustments: inventoryData?.flatMap(i =>
        (i.inventory_adjustments || []).map((a: any) => ({
          id: a.id,
          inventoryItemId: a.inventory_item_id,
          adjustmentType: a.adjustment_type,
          quantity: Number(a.quantity),
          reason: a.reason || '',
          adjustedBy: a.adjusted_by,
          adjustedAt: new Date(a.adjusted_at).getTime(),
        }))
      ) || [],
      invoices: invoicesData?.map(inv => ({
        id: inv.id,
        quoteId: inv.quote_id || undefined,
        projectId: inv.project_id || undefined,
        clientId: inv.client_id,
        invoiceNumber: inv.invoice_number,
        status: inv.status,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        subtotal: Number(inv.subtotal),
        taxAmount: Number(inv.tax_amount),
        discountAmount: Number(inv.discount_amount),
        total: Number(inv.total),
        amountPaid: Number(inv.amount_paid),
        balanceDue: Number(inv.balance_due),
        lastPaymentDate: inv.last_payment_date || undefined,
        notes: inv.notes || '',
        invoiceType: inv.invoice_type || 'Final',
        items: (inv.invoice_line_items || []).map((item: any) => ({
          id: item.id,
          invoiceId: item.invoice_id,
          productId: item.product_id || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          total: Number(item.total),
        })),
        createdAt: new Date(inv.created_at).getTime(),
        updatedAt: inv.updated_at ? new Date(inv.updated_at).getTime() : new Date(inv.created_at).getTime(),
      })) || [],
      payments: paymentsData?.map(p => ({
        id: p.id,
        invoiceId: p.invoice_id,
        clientId: p.client_id,
        amount: Number(p.amount),
        paymentMethod: p.payment_method,
        referenceNumber: p.reference_number || undefined,
        paymentDate: p.payment_date,
        notes: p.notes || '',
        recordedBy: p.recorded_by,
        createdAt: new Date(p.created_at).getTime(),
      })) || [],
      projects: [] as any[],
      projectProgress: [] as any[],
      role: profile?.role || 'admin',
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
  },

  deletePayment: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  },

  deleteInventoryAdjustment: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('inventory_adjustments').delete().eq('id', id);
    if (error) throw error;
  },

  saveProject: async (project: Project) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { error } = await supabase.from('projects').upsert({
      id: project.id,
      user_id: user.id,
      client_id: project.clientId,
      name: project.name,
      location: project.location || null,
      total_units: project.totalUnits,
      unit_type: project.unitType,
      status: project.status,
      start_date: project.startDate ? new Date(project.startDate).toISOString() : null,
      end_date: project.endDate ? new Date(project.endDate).toISOString() : null,
      created_at: new Date(project.createdAt).toISOString(),
      updated_at: new Date(project.updatedAt).toISOString(),
    });
    if (error) throw error;
  },

  deleteProject: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  saveProjectProgress: async (progress: ProjectProgress) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { error } = await supabase.from('project_progress').upsert({
      id: progress.id,
      project_id: progress.projectId,
      units_completed: progress.unitsCompleted,
      remarks: progress.remarks || null,
      recorded_by: progress.recordedBy,
      recorded_at: new Date(progress.recordedAt).toISOString(),
      created_at: new Date(progress.createdAt).toISOString(),
    });
    if (error) throw error;
  },

  deleteProjectProgress: async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('project_progress').delete().eq('id', id);
    if (error) throw error;
  }
};
