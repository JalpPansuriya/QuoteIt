export type Material = 'UPVC' | 'Aluminium' | 'Wood';
export type Unit = 'sq ft' | 'unit' | 'running ft';
export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Invoiced' | 'Rejected';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Other';
export type AdjustmentType = 'in' | 'out';

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
  version: number;
  parentQuoteId?: string;
  expiryDate?: number;
  approvalNotes?: string;
  convertedToInvoiceId?: string;
  createdAt: number;
  updatedAt: number;
}

// ── Inventory ──

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: number;
  quantityOnHand: number;
  reorderThreshold: number;
  catalogProductId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: number;
}

// ── Billing ──

export interface InvoiceLineItem {
  id: string;
  invoiceId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  quoteId?: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: number;
  dueDate: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  lastPaymentDate?: number;
  notes: string;
  items: InvoiceLineItem[];
  createdAt: number;
  updatedAt: number;
}

// ── Payments ──

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  paymentDate: number;
  notes: string;
  recordedBy: string;
  createdAt: number;
}
