export type Material = 'UPVC' | 'Aluminium' | 'Wood';
export type Unit = 'sq ft' | 'unit' | 'running ft';
export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Invoiced' | 'Rejected';

export interface MetaDataValue {
  id: string;
  name: string;
}

export interface AppSettings {
  materials: MetaDataValue[];
  glassTypes: MetaDataValue[];
  features: {
    defaultGstEnabled: boolean;
    defaultGstRate: number;
    autoGenerateQuoteNumbers: boolean;
    companyName: string;
    companyTagline: string;
    companyLogo?: string;
  }
}

export interface Product {
  id: string;
  name: string;
  material: Material;
  glassType: string;
  baseRate: number;
  unit: Unit;
  createdAt: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: number;
}

export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  image?: string;
  width?: number;
  height?: number;
  qty: number;
  unit: Unit;
  rate: number;
  discount: number; // Flat amount or percentage based on quote setting? Let's use amount for line items.
  subtotal: number; // Before line discount
  total: number; // After line discount
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  status: QuoteStatus;
  date: number;
  validUntil: number;
  items: QuoteLineItem[];
  subtotal: number; // sum of all line item totals
  discountType: 'flat' | 'percentage';
  discountValue: number;
  discountAmount: number;
  applyGst: boolean;
  gstRate: number; // usually 18
  gstAmount: number;
  grandTotal: number;
  notes: string;
  terms: string;
  createdAt: number;
  updatedAt: number;
}
