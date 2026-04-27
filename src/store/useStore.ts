import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Client, Product, Quote, AppSettings, MetaDataValue, InventoryItem, InventoryAdjustment, Invoice, Payment } from '../types';
import { supabaseService } from '../lib/supabaseService';

interface AppState {
  user: User | null;
  clients: Client[];
  products: Product[];
  quotes: Quote[];
  inventoryItems: InventoryItem[];
  inventoryAdjustments: InventoryAdjustment[];
  invoices: Invoice[];
  payments: Payment[];
  settings: AppSettings;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAll: (data: Partial<{ clients: Client[], products: Product[], quotes: Quote[], settings: AppSettings }>) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  // Inventory Actions (targeted saves)
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addInventoryAdjustment: (adj: InventoryAdjustment) => void;

  // Invoice Actions (targeted saves)
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Payment Actions (targeted saves)
  addPayment: (payment: Payment) => void;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  addMaterial: (material: MetaDataValue) => void;
  removeMaterial: (id: string) => void;
  addGlassType: (glassType: MetaDataValue) => void;
  removeGlassType: (id: string) => void;
  updateFeatures: (features: Partial<AppSettings['features']>) => void;

  // Data Loading
  loadInitialData: () => Promise<void>;
}

const initialSettings: AppSettings = {
  materials: [],
  glassTypes: [],
  features: {
    defaultGstEnabled: true,
    defaultGstRate: 18,
    autoGenerateQuoteNumbers: true,
    companyName: '',
    companyTagline: '',
  }
};

export const useStore = create<AppState>((set, get) => ({
  user: null,
  clients: [],
  products: [],
  quotes: [],
  inventoryItems: [],
  inventoryAdjustments: [],
  invoices: [],
  payments: [],
  settings: initialSettings,
  isLoading: true,

  setUser: (user) => set({ user }),

  setAll: (data) => set((state) => ({ ...state, ...data })),

  addClient: (client) => {
    set((state) => ({ clients: [...state.clients, client] }));
    autoSave(get());
  },
  updateClient: (id, updated) => {
    set((state) => ({
      clients: state.clients.map((c) => c.id === id ? { ...c, ...updated } : c)
    }));
    autoSave(get());
  },
  deleteClient: (id) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id)
    }));
    autoSave(get());
  },

  addProduct: (product) => {
    set((state) => ({ products: [...state.products, product] }));
    autoSave(get());
  },
  updateProduct: (id, updated) => {
    set((state) => ({
      products: state.products.map((p) => p.id === id ? { ...p, ...updated } : p)
    }));
    autoSave(get());
  },
  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id)
    }));
    autoSave(get());
  },

  addQuote: (quote) => {
    set((state) => ({ quotes: [...state.quotes, quote] }));
    autoSave(get());
  },
  updateQuote: (id, updated) => {
    set((state) => ({
      quotes: state.quotes.map((q) => q.id === id ? { ...q, ...updated, updatedAt: Date.now() } : q)
    }));
    autoSave(get());
  },
  deleteQuote: (id) => {
    set((state) => ({
      quotes: state.quotes.filter((q) => q.id !== id)
    }));
    autoSave(get());
  },

  // ── Inventory (targeted saves) ──

  addInventoryItem: (item) => {
    set((state) => ({ inventoryItems: [...state.inventoryItems, item] }));
    supabaseService.saveInventoryItem(item).catch(console.error);
  },
  updateInventoryItem: (id, updated) => {
    set((state) => ({
      inventoryItems: state.inventoryItems.map((i) => i.id === id ? { ...i, ...updated, updatedAt: Date.now() } : i)
    }));
    const item = get().inventoryItems.find(i => i.id === id);
    if (item) supabaseService.saveInventoryItem(item).catch(console.error);
  },
  deleteInventoryItem: (id) => {
    set((state) => ({
      inventoryItems: state.inventoryItems.filter((i) => i.id !== id),
      inventoryAdjustments: state.inventoryAdjustments.filter((a) => a.inventoryItemId !== id)
    }));
    supabaseService.deleteInventoryItem(id).catch(console.error);
  },
  addInventoryAdjustment: (adj) => {
    set((state) => {
      const items = state.inventoryItems.map(item => {
        if (item.id === adj.inventoryItemId) {
          const newQty = adj.adjustmentType === 'in'
            ? item.quantityOnHand + adj.quantity
            : item.quantityOnHand - adj.quantity;
          return { ...item, quantityOnHand: Math.max(0, newQty), updatedAt: Date.now() };
        }
        return item;
      });
      const updatedItem = items.find(i => i.id === adj.inventoryItemId);
      supabaseService.saveInventoryAdjustment(adj, updatedItem?.quantityOnHand || 0).catch(console.error);
      return {
        inventoryItems: items,
        inventoryAdjustments: [...state.inventoryAdjustments, adj]
      };
    });
  },

  // ── Invoices (targeted saves) ──

  addInvoice: (invoice) => {
    set((state) => ({ invoices: [...state.invoices, invoice] }));
    supabaseService.saveInvoice(invoice).catch(console.error);
  },
  updateInvoice: (id, updated) => {
    set((state) => ({
      invoices: state.invoices.map((inv) => inv.id === id ? { ...inv, ...updated, updatedAt: Date.now() } : inv)
    }));
    const invoice = get().invoices.find(inv => inv.id === id);
    if (invoice) supabaseService.saveInvoice(invoice).catch(console.error);
  },
  deleteInvoice: (id) => {
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
      payments: state.payments.filter((p) => p.invoiceId !== id)
    }));
    supabaseService.deleteInvoice(id).catch(console.error);
  },

  // ── Payments (targeted saves) ──

  addPayment: (payment) => {
    set((state) => {
      // Update the parent invoice
      const invoices = state.invoices.map(inv => {
        if (inv.id === payment.invoiceId) {
          const newAmountPaid = inv.amountPaid + payment.amount;
          const newBalanceDue = inv.total - newAmountPaid;
          const newStatus = newBalanceDue <= 0 ? 'Paid' : 'Partially Paid';
          const updatedInv = {
            ...inv,
            amountPaid: newAmountPaid,
            balanceDue: Math.max(0, newBalanceDue),
            lastPaymentDate: payment.paymentDate,
            status: newStatus as any,
            updatedAt: Date.now()
          };
          supabaseService.saveInvoice(updatedInv).catch(console.error);
          return updatedInv;
        }
        return inv;
      });
      return {
        payments: [...state.payments, payment],
        invoices
      };
    });
    supabaseService.savePayment(payment).catch(console.error);
  },

  updateSettings: (settings) => {
    set((state) => ({
      settings: { ...state.settings, ...settings }
    }));
    autoSave(get());
  },
  addMaterial: (material) => {
    set((state) => ({
      settings: { ...state.settings, materials: [...state.settings.materials, material] }
    }));
    autoSave(get());
  },
  removeMaterial: (id) => {
    set((state) => ({
      settings: { ...state.settings, materials: state.settings.materials.filter((m) => m.id !== id) }
    }));
    autoSave(get());
  },
  addGlassType: (glassType) => {
    set((state) => ({
      settings: { ...state.settings, glassTypes: [...state.settings.glassTypes, glassType] }
    }));
    autoSave(get());
  },
  removeGlassType: (id) => {
    set((state) => ({
      settings: { ...state.settings, glassTypes: state.settings.glassTypes.filter((g) => g.id !== id) }
    }));
    autoSave(get());
  },
  updateFeatures: (features) => {
    set((state) => ({
      settings: { ...state.settings, features: { ...state.settings.features, ...features } }
    }));
    autoSave(get());
  },

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const cloudData = await supabaseService.loadAll();
      if (cloudData) {
        set({ 
          clients: cloudData.clients || [],
          products: cloudData.products || [],
          quotes: cloudData.quotes || [],
          inventoryItems: cloudData.inventoryItems || [],
          inventoryAdjustments: cloudData.inventoryAdjustments || [],
          invoices: cloudData.invoices || [],
          payments: cloudData.payments || [],
          settings: cloudData.settings || initialSettings
        });
      }
    } catch (error) {
      console.error('Failed to load cloud data:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));

// Helper for cloud auto-save (legacy — quotes/clients/products/settings only)
let saveTimeout: any;
const autoSave = (state: AppState) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const { clients, products, quotes, settings } = state;
      await supabaseService.saveAll({ clients, products, quotes, settings });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 1000);
};
