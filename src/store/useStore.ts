import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Client, Product, Quote, AppSettings, MetaDataValue } from '../types';
import { supabaseService } from '../lib/supabaseService';

interface AppState {
  user: User | null;
  clients: Client[];
  products: Product[];
  quotes: Quote[];
  settings: AppSettings;
  isLoading: boolean;
  notifications: { id: string; message: string; type: 'success' | 'error' | 'info' | 'delete' }[];
  
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

export const useStore = create<AppState>((set, get) => ({
  user: null,
  clients: [],
  products: [],
  quotes: [],
  settings: initialSettings,
  isLoading: true,
  notifications: [],

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
          settings: cloudData.settings || initialSettings
        });
      }
    } catch (error) {
      console.error('Failed to load cloud data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (message, type = 'success') => {
    const id = uuidv4();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    setTimeout(() => get().removeNotification(id), 3000);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  }
}));

// Helper for UUIDs (since I'm using uuidv4 above)
import { v4 as uuidv4 } from 'uuid';

// Helper for cloud auto-save
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
