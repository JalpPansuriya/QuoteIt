import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, Product, Quote, AppSettings, MetaDataValue } from '../types';

interface AppState {
  clients: Client[];
  products: Product[];
  quotes: Quote[];
  settings: AppSettings;
  
  // Actions
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
  updateFeatures: (features: Partial<AppSettings['features']>) => void;
}

const defaultProducts: Product[] = [
  { id: '1', name: 'Premium Sliding Window', material: 'UPVC' as any, glassType: 'Toughened 6mm', baseRate: 350, unit: 'sq ft', createdAt: Date.now() },
  { id: '2', name: 'Standard Casement Window', material: 'Aluminium' as any, glassType: 'Clear 5mm', baseRate: 280, unit: 'sq ft', createdAt: Date.now() },
  { id: '3', name: 'Luxury Tilt & Turn', material: 'Wood' as any, glassType: 'Double Glazed', baseRate: 850, unit: 'sq ft', createdAt: Date.now() },
];

const defaultSettings: AppSettings = {
  materials: [
    { id: '1', name: 'UPVC' },
    { id: '2', name: 'Aluminium' },
    { id: '3', name: 'Wood' },
  ],
  glassTypes: [
    { id: '1', name: 'Clear 5mm' },
    { id: '2', name: 'Toughened 6mm' },
    { id: '3', name: 'Double Glazed' },
    { id: '4', name: 'Frosted' },
  ],
  features: {
    defaultGstEnabled: true,
    defaultGstRate: 18,
    autoGenerateQuoteNumbers: true,
    companyName: 'WINDOVATION',
    companyTagline: 'Premium Window Solutions',
  }
};

const defaultClients: Client[] = [
  { id: '1', name: 'Acme Corp Properties', phone: '+91 9876543210', email: 'purchase@acmecorp.com', address: '123 Business Park, Sector 4, Mumbai', createdAt: Date.now() },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      clients: defaultClients,
      products: defaultProducts,
      quotes: [],
      settings: defaultSettings,

      addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id, updated) => set((state) => ({
        clients: state.clients.map((c) => c.id === id ? { ...c, ...updated } : c)
      })),
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter((c) => c.id !== id)
      })),

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updated) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, ...updated } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id)
      })),

      addQuote: (quote) => set((state) => ({ quotes: [...state.quotes, quote] })),
      updateQuote: (id, updated) => set((state) => ({
        quotes: state.quotes.map((q) => q.id === id ? { ...q, ...updated, updatedAt: Date.now() } : q)
      })),
      deleteQuote: (id) => set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id)
      })),

      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      })),
      addMaterial: (material) => set((state) => ({
        settings: { ...state.settings, materials: [...state.settings.materials, material] }
      })),
      removeMaterial: (id) => set((state) => ({
        settings: { ...state.settings, materials: state.settings.materials.filter((m) => m.id !== id) }
      })),
      addGlassType: (glassType) => set((state) => ({
        settings: { ...state.settings, glassTypes: [...state.settings.glassTypes, glassType] }
      })),
      removeGlassType: (id) => set((state) => ({
        settings: { ...state.settings, glassTypes: state.settings.glassTypes.filter((g) => g.id !== id) }
      })),
      updateFeatures: (features) => set((state) => ({
        settings: { ...state.settings, features: { ...state.settings.features, ...features } }
      })),
    }),
    {
      name: 'winquote-storage',
    }
  )
);
