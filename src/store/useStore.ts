import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Client, Product, Quote, AppSettings, MetaDataValue, InventoryItem, InventoryAdjustment, Invoice, Payment, Project, ProjectProgress, UserRole, Notification } from '../types';
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
  projects: Project[];
  projectProgress: ProjectProgress[];
  settings: AppSettings;
  role: UserRole | null;
  isLoading: boolean;
  notifications: { id: string; message: string; type: 'success' | 'error' | 'info' | 'delete' }[];
  alerts: Notification[];
  
  // Actions
  setUser: (user: User | null) => void;
  setAll: (data: Partial<{ 
    clients: Client[], 
    products: Product[], 
    quotes: Quote[], 
    settings: AppSettings,
    projects: Project[],
    projectProgress: ProjectProgress[],
    invoices: Invoice[],
    payments: Payment[],
    inventoryItems: InventoryItem[]
  }>) => void;
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
  deleteInventoryAdjustment: (id: string) => void;

  // Invoice Actions (targeted saves)
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  addPayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;

  // Project Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectProgress: (progress: ProjectProgress) => void;
  deleteProjectProgress: (id: string) => void;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  addMaterial: (material: MetaDataValue) => void;
  removeMaterial: (id: string) => void;
  addGlassType: (glassType: MetaDataValue) => void;
  removeGlassType: (id: string) => void;
  
  // Generic Presets
  addPreset: (key: keyof Omit<AppSettings, 'features'>, value: MetaDataValue) => void;
  removePreset: (key: keyof Omit<AppSettings, 'features'>, id: string) => void;

  updateFeatures: (features: Partial<AppSettings['features']>) => void;

  // Data Loading
  loadInitialData: () => Promise<void>;

  // Notification Actions
  addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'delete') => void;
  removeNotification: (id: string) => void;

  // Persistent Alert Actions
  addAlert: (alert: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  checkHealth: () => void;
}

const initialSettings: AppSettings = {
  materials: [],
  glassTypes: [],
  series: [],
  colors: [],
  reinforcements: [],
  frameJoins: [],
  tracks: [],
  trackRIs: [],
  slidingSashes: [],
  slidingSashRIs: [],
  flyscreens: [],
  flyscreenSashes: [],
  interlocks: [],
  flyMeshTypes: [],
  guideRails: [],
  handles: [],
  flyscreenHandles: [],
  slidingSashRollers: [],
  flyscreenSashRollers: [],
  features: {
    defaultGstEnabled: true,
    defaultGstRate: 18,
    autoGenerateQuoteNumbers: true,
    companyName: '',
    companyTagline: '',
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  user: null,
  clients: [],
  products: [],
  quotes: [],
  inventoryItems: [],
  inventoryAdjustments: [],
  invoices: [],
  payments: [],
  projects: [],
  projectProgress: [],
  settings: initialSettings,
  role: null,
  isLoading: true,
  notifications: [],
  alerts: [],

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
    supabaseService.deleteClient(id).catch(console.error);
    get().addNotification('Client deleted', 'delete');
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
    supabaseService.deleteProduct(id).catch(console.error);
    get().addNotification('Product deleted', 'delete');
  },

  addQuote: (quote) => {
    set((state) => ({ quotes: [...state.quotes, quote] }));
    autoSave(get());
  },
  updateQuote: (id, updated) => {
    const existing = get().quotes.find(q => q.id === id);
    if (existing && (existing.status === 'Approved' || existing.status === 'Invoiced')) {
      const keys = Object.keys(updated);
      // Only allow status updates or approval_notes updates on approved quotes
      const allowedKeys = ['status', 'approvalNotes', 'convertedToInvoiceId', 'projectId'];
      const isTryingToEditData = keys.some(k => !allowedKeys.includes(k));
      
      if (isTryingToEditData) {
        console.warn("Quote is locked. Edit denied.");
        return;
      }
    }

    set((state) => ({
      quotes: state.quotes.map((q) => q.id === id ? { ...q, ...updated, updatedAt: Date.now() } : q)
    }));
    autoSave(get());
  },
  deleteQuote: (id) => {
    set((state) => ({
      quotes: state.quotes.filter((q) => q.id !== id)
    }));
    supabaseService.deleteQuote(id).catch(console.error);
    get().addNotification('Quotation deleted', 'delete');
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
  deleteInventoryAdjustment: (id) => {
    set((state) => {
      const adj = state.inventoryAdjustments.find(a => a.id === id);
      if (!adj) return state;
      const items = state.inventoryItems.map(item => {
        if (item.id === adj.inventoryItemId) {
          // Reverse the adjustment
          const newQty = adj.adjustmentType === 'in'
            ? item.quantityOnHand - adj.quantity
            : item.quantityOnHand + adj.quantity;
          return { ...item, quantityOnHand: Math.max(0, newQty), updatedAt: Date.now() };
        }
        return item;
      });
      const updatedItem = items.find(i => i.id === adj.inventoryItemId);
      if (updatedItem) supabaseService.saveInventoryItem(updatedItem).catch(console.error);
      supabaseService.deleteInventoryAdjustment(id).catch(console.error);
      return {
        inventoryItems: items,
        inventoryAdjustments: state.inventoryAdjustments.filter(a => a.id !== id)
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
    set((state) => {
      const paymentsToDelete = state.payments.filter((p) => p.invoiceId === id);
      paymentsToDelete.forEach(p => supabaseService.deletePayment(p.id).catch(console.error));
      
      return {
        invoices: state.invoices.filter((inv) => inv.id !== id),
        payments: state.payments.filter((p) => p.invoiceId !== id)
      };
    });
    supabaseService.deleteInvoice(id).catch(console.error);
  },

  // ── Payments (targeted saves) ──

  addPayment: (payment) => {
    set((state) => {
      const invoice = state.invoices.find(inv => inv.id === payment.invoiceId);
      const enhancedPayment = {
        ...payment,
        projectId: invoice?.projectId || payment.projectId
      };

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

      supabaseService.savePayment(enhancedPayment).catch(console.error);

      return {
        payments: [...state.payments, enhancedPayment],
        invoices
      };
    });
  },

  deletePayment: (id) => {
    set((state) => {
      const payment = state.payments.find(p => p.id === id);
      if (!payment) return state;

      const invoices = state.invoices.map(inv => {
        if (inv.id === payment.invoiceId) {
          const newAmountPaid = Math.max(0, inv.amountPaid - payment.amount);
          const newBalanceDue = inv.total - newAmountPaid;
          const newStatus = newBalanceDue <= 0 ? 'Paid' : (newAmountPaid > 0 ? 'Partially Paid' : 'Sent');
          const updatedInv = {
            ...inv,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus as any,
            updatedAt: Date.now()
          };
          supabaseService.saveInvoice(updatedInv).catch(console.error);
          return updatedInv;
        }
        return inv;
      });

      supabaseService.deletePayment(id).catch(console.error);

      return {
        payments: state.payments.filter(p => p.id !== id),
        invoices
      };
    });
  },

  // ── Projects & Site Tracking ──

  addProject: (project) => {
    set((state) => ({ projects: [...state.projects, project] }));
    supabaseService.saveProject(project).catch(console.error);
  },
  updateProject: (id, updated) => {
    set((state) => ({
      projects: state.projects.map((p) => p.id === id ? { ...p, ...updated, updatedAt: Date.now() } : p)
    }));
    const project = get().projects.find(p => p.id === id);
    if (project) supabaseService.saveProject(project).catch(console.error);
  },
  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      projectProgress: state.projectProgress.filter((a) => a.projectId !== id)
    }));
    supabaseService.deleteProject(id).catch(console.error);
  },
  addProjectProgress: (progress) => {
    set((state) => ({ projectProgress: [...state.projectProgress, progress] }));
    supabaseService.saveProjectProgress(progress).catch(console.error);
  },
  deleteProjectProgress: (id) => {
    set((state) => ({ projectProgress: state.projectProgress.filter(p => p.id !== id) }));
    supabaseService.deleteProjectProgress(id).catch(console.error);
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
  addPreset: (key, value) => {
    set((state) => ({
      settings: { 
        ...state.settings, 
        [key]: [...((state.settings[key] as MetaDataValue[]) || []), value] 
      }
    }));
    autoSave(get());
  },
  removePreset: (key, id) => {
    set((state) => ({
      settings: { 
        ...state.settings, 
        [key]: ((state.settings[key] as MetaDataValue[]) || []).filter((item) => item.id !== id) 
      }
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
          projects: cloudData.projects || [],
          projectProgress: cloudData.projectProgress || [],
          settings: {
            ...initialSettings,
            ...(cloudData.settings || {}),
            features: {
              ...initialSettings.features,
              ...(cloudData.settings?.features || {})
            }
          },
          role: (cloudData.role as UserRole) || 'admin'
        });
      }
    } catch (error) {
      console.error('Failed to load cloud data:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  addNotification: (message, type = 'success') => {
    const id = (Math.random() * 1000000).toString();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    setTimeout(() => get().removeNotification(id), 3000);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },
  
  addAlert: (alert) => {
    const id = uuidv4();
    set((state) => ({
      alerts: [{ ...alert, id, timestamp: Date.now(), read: false }, ...state.alerts].slice(0, 50)
    }));
    get().addNotification(alert.message, alert.type === 'error' ? 'error' : (alert.type === 'warning' ? 'error' : 'info'));
  },
  markAlertAsRead: (id) => {
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a)
    }));
  },
  clearAllAlerts: () => set({ alerts: [] }),
  checkHealth: () => {
    const state = get();
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    // 1. Low Inventory
    state.inventoryItems.forEach(item => {
      if (item.quantityOnHand <= item.reorderThreshold) {
        const message = `Low stock: ${item.name} (${item.quantityOnHand} ${item.unit} remaining)`;
        const exists = state.alerts.some(a => a.message === message && !a.read);
        if (!exists) {
          state.addAlert({ type: 'warning', message, link: '/inventory' });
        }
      }
    });

    // 2. Overdue Invoices
    state.invoices.forEach(inv => {
      if (inv.status !== 'Paid' && inv.dueDate < (now - threeDaysMs)) {
        const message = `Overdue: Invoice ${inv.invoiceNumber} is 3+ days late.`;
        const exists = state.alerts.some(a => a.message === message && !a.read);
        if (!exists) {
          state.addAlert({ type: 'error' as any, message, link: '/billing' });
        }
      }
    });

    // 3. Quotes Pending Production
    state.quotes.forEach(quote => {
      if (quote.status === 'Approved' && !quote.convertedToInvoiceId) {
        // Check if any item is not yet manufacturing
        const pendingItems = quote.items?.filter(i => i.productionStatus === 'pending') || [];
        if (pendingItems.length > 0) {
          const message = `Pending: Quote ${quote.quoteNumber} needs production start.`;
          const exists = state.alerts.some(a => a.message === message && !a.read);
          if (!exists) {
            state.addAlert({ type: 'info', message, link: '/production' });
          }
        }
      }
    });
  }
}),
{
  name: 'quoteit-app-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    clients: state.clients,
    products: state.products,
    quotes: state.quotes,
    inventoryItems: state.inventoryItems,
    inventoryAdjustments: state.inventoryAdjustments,
    invoices: state.invoices,
    payments: state.payments,
    projects: state.projects,
    projectProgress: state.projectProgress,
    settings: state.settings,
    role: state.role,
    user: state.user,
    alerts: state.alerts
  }),
  onRehydrateStorage: () => (state) => {
    if (state) {
      state.isLoading = false;
    }
  },
}
));

// Robust hydration hook for components
export function useHydration() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const unsubFinishHydration = useStore.persist.onFinishHydration(() => setHydrated(true));
    
    setHydrated(useStore.persist.hasHydrated());

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}

// Helper for cloud auto-save (legacy — quotes/clients/products/settings only)
let saveTimeout: any;
const autoSave = (state: AppState) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const { clients, products, quotes, settings } = state;
      await supabaseService.saveAll({ clients, products, quotes, settings });
      state.addNotification('Updated', 'success');
    } catch (error) {
      console.error('Auto-save failed:', error);
      state.addNotification('Update failed', 'error');
    }
  }, 1000);
};
