# Quoteit Platform Expansion — PRD

| Field        | Detail            |
|--------------|-------------------|
| **Product**  | Quoteit           |
| **Version**  | 2.0.0             |
| **Status**   | Planning          |
| **Author**   | —                 |
| **Last Updated** | 2026-04-23    |
| **Base Version** | 1.4.0         |

---

## 1. Overview

Quoteit is a fast, cloud-native quotation builder and management tool designed for bulk window resellers and manufacturers. This PRD outlines the expansion of the platform from its current quoting-focused core into a full business operations suite by introducing five new modules:

- 📦 **Inventory**
- 🧾 **Billing**
- 📋 **Quotation** (enhanced from existing)
- 💳 **Payments**
- 📊 **Reports**

---

## 2. Current State (v1.4.0)

### Existing Modules

| Module | Status | Description |
|---|---|---|
| Quote Builder | ✅ Live | Line-item builder with dynamic totals |
| Quotes List | ✅ Live | Search, view, duplicate quotes |
| Clients (CRM Lite) | ✅ Live | Client management |
| Product Catalog | ✅ Live | Product definition |
| Auth / Login | ✅ Live | Supabase-backed protected routes |

### Current Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Zustand, React Router |
| Backend | Supabase (Relational Cloud DB + Auth) |
| PDF | jsPDF + AutoTable |
| State | Zustand with 1s debounce auto-save |

---

## 3. Goals

- Expand Quoteit into a complete business workflow tool
- Keep all modules tightly integrated (quotes → billing → payments → reports)
- Maintain the fast, cloud-native experience of v1.4.0
- Avoid introducing unnecessary third-party dependencies
- Ensure all new data is relational and Supabase-backed

---

## 4. New Modules — Specifications

### 4.1 📦 Inventory Module

**Purpose:** Track raw materials, finished products, and stock levels in real time to support quote accuracy and procurement decisions.

#### Key Features

| Feature | Description |
|---|---|
| Stock List | View all inventory items with current quantity, unit, and reorder threshold |
| Add / Edit Items | Create or update inventory items with SKU, name, unit, cost price |
| Stock Adjustments | Manual stock-in / stock-out with reason logging |
| Low Stock Alerts | Visual alerts when items drop below reorder threshold |
| Link to Catalog | Inventory items map to product catalog entries |
| Audit Log | Every adjustment is timestamped and tied to a user |

#### Data Model

```sql
inventory_items
  id, sku, name, unit, cost_price, quantity_on_hand,
  reorder_threshold, catalog_product_id, created_at, updated_at

inventory_adjustments
  id, inventory_item_id, adjustment_type (in/out),
  quantity, reason, adjusted_by, adjusted_at
```

#### UI Pages

| Route | Description |
|---|---|
| `/inventory` | Stock overview table + low stock highlights |
| `/inventory/new` | Add new item form |
| `/inventory/:id` | Item detail + adjustment history |

---

### 4.2 🧾 Billing Module

**Purpose:** Convert approved quotes into formal invoices and track their lifecycle from draft to paid.

#### Key Features

| Feature | Description |
|---|---|
| Invoice Generation | One-click conversion from an approved quote to an invoice |
| Invoice Editor | Edit line items, taxes, discounts before finalizing |
| Invoice Status | Draft → Sent → Partially Paid → Paid → Overdue |
| PDF Export | Native PDF generation using existing jsPDF engine |
| Client Linking | Invoices are always tied to a client record |
| Due Date & Terms | Set payment terms and due dates per invoice |
| Overdue Tracking | Auto-flag invoices past due date |

#### Data Model

```sql
invoices
  id, quote_id, client_id, invoice_number, status,
  issue_date, due_date, subtotal, tax_amount,
  discount_amount, total, notes, created_at, updated_at

invoice_line_items
  id, invoice_id, product_id, description,
  quantity, unit_price, total
```

#### UI Pages

| Route | Description |
|---|---|
| `/billing` | Invoice list with status filters |
| `/billing/new?quoteId=` | Create invoice from quote |
| `/billing/:id` | Invoice detail, PDF export, status update |

---

### 4.3 📋 Quotation Module (Enhanced)

**Purpose:** Upgrade the existing quotation flow with approval workflows, versioning, and direct conversion to invoices.

#### Enhancements Over v1.4.0

| Feature | Description |
|---|---|
| Quote Status | Draft → Sent → Approved → Rejected → Converted |
| Quote Versioning | Allow revised versions of the same quote (v1, v2…) |
| Convert to Invoice | One-click push to Billing module |
| Expiry Date | Set validity window per quote |
| Approval Notes | Internal notes for review before sending |
| Client Portal Link *(future)* | Shareable link for client to approve/reject |

#### Updated Data Model

```sql
quotes (updated)
  + status, version, parent_quote_id,
    expiry_date, approval_notes, converted_to_invoice_id
```

#### UI Changes

- Status badge on `QuotesList`
- Version history panel in `QuoteBuilder`
- "Convert to Invoice" CTA button on approved quotes

---

### 4.4 💳 Payments Module

**Purpose:** Record and track payments against invoices, support partial payments, and maintain a clear financial trail.

#### Key Features

| Feature | Description |
|---|---|
| Record Payment | Log a payment against any invoice (full or partial) |
| Payment Methods | Cash, Bank Transfer, Card, Cheque, Other |
| Partial Payments | Multiple payments per invoice until fully settled |
| Balance Tracking | Auto-calculate remaining balance per invoice |
| Payment History | Full log per invoice and per client |
| Receipt Generation | PDF receipt via jsPDF engine |
| Reconciliation View | Summary of all payments in a date range |

#### Data Model

```sql
payments
  id, invoice_id, client_id, amount, payment_method,
  reference_number, payment_date, notes,
  recorded_by, created_at

invoices (updated)
  + amount_paid, balance_due, last_payment_date
```

#### UI Pages

| Route | Description |
|---|---|
| `/payments` | All payments with date/client filters |
| `/payments/new?invoiceId=` | Record a payment |
| `/payments/:id` | Payment detail + PDF receipt |

---

### 4.5 📊 Reports Module

**Purpose:** Give business owners actionable financial and operational insights across all modules.

#### Key Reports

| Report | Description |
|---|---|
| Revenue Summary | Total invoiced vs total collected in a period |
| Outstanding Balances | All unpaid / partially paid invoices |
| Quote Conversion Rate | Quotes sent vs approved vs converted |
| Top Clients | Revenue ranked by client |
| Top Products | Most quoted / billed products |
| Inventory Value | Current stock value based on cost price |
| Payment Methods Breakdown | Cash vs Transfer vs Card split |
| Overdue Invoices | Invoices past due date with aging buckets |

#### Features

| Feature | Description |
|---|---|
| Date Range Filter | All reports filterable by custom date range |
| Export to PDF | Download any report as PDF |
| Export to CSV | Raw data export for all reports |
| Dashboard Widgets | Key KPIs surfaced on main Dashboard |

#### UI Pages

| Route | Description |
|---|---|
| `/reports` | Report hub / selector |
| `/reports/revenue` | Revenue Summary |
| `/reports/outstanding` | Outstanding Balances |
| `/reports/quotes` | Quote Conversion |
| `/reports/inventory` | Inventory Value |

---

## 5. Updated File Structure

```
/src
  /components
    /ui              # Reusable base components
    Layout.tsx       # Main app shell with sidebar (updated nav)

  /pages
    Login.tsx
    Dashboard.tsx         # Updated with new KPI widgets
    QuotesList.tsx
    QuoteBuilder.tsx      # + status, versioning, convert action
    Clients.tsx
    Catalog.tsx

    /inventory
      InventoryList.tsx
      InventoryForm.tsx
      InventoryDetail.tsx

    /billing
      InvoiceList.tsx
      InvoiceBuilder.tsx
      InvoiceDetail.tsx

    /payments
      PaymentList.tsx
      PaymentForm.tsx
      PaymentDetail.tsx

    /reports
      ReportHub.tsx
      RevenueReport.tsx
      OutstandingReport.tsx
      QuoteConversionReport.tsx
      InventoryReport.tsx

  /store
    useStore.ts            # Extended for new modules

  /lib
    supabase.ts
    supabaseService.ts     # Extended with new data access methods
```

---

## 6. Updated Navigation (Sidebar)

```
🏠  Dashboard
📋  Quotations
📦  Inventory
🧾  Billing
💳  Payments
📊  Reports
👥  Clients
🛍️  Catalog
```

---

## 7. Supabase Schema — New Tables Summary

```sql
-- Inventory
inventory_items
inventory_adjustments

-- Billing
invoices
invoice_line_items

-- Payments
payments

-- Quotes (updated columns)
ALTER TABLE quotes ADD COLUMN status TEXT;
ALTER TABLE quotes ADD COLUMN version INTEGER;
ALTER TABLE quotes ADD COLUMN parent_quote_id UUID;
ALTER TABLE quotes ADD COLUMN expiry_date DATE;
ALTER TABLE quotes ADD COLUMN approval_notes TEXT;
ALTER TABLE quotes ADD COLUMN converted_to_invoice_id UUID;

-- Invoices (updated columns after payments)
ALTER TABLE invoices ADD COLUMN amount_paid NUMERIC;
ALTER TABLE invoices ADD COLUMN balance_due NUMERIC;
ALTER TABLE invoices ADD COLUMN last_payment_date DATE;
```

---

## 8. Integration Map

```
Catalog ──────────────────────────┐
                                  ▼
Clients ──────► Quotation ──────► Billing ──────► Payments
                    │                                  │
                    ▼                                  ▼
               Inventory                           Reports
                    │                                  ▲
                    └──────────────────────────────────┘
```

---

## 9. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Performance | All list views must load under 1.5s |
| Auth | All new routes protected by existing `ProtectedRoute` |
| Auto-Save | Maintained across Billing and Quotation editors |
| PDF | All PDF outputs use existing jsPDF + AutoTable engine |
| Offline | Not required — cloud-only as per current architecture |
| Mobile | Responsive layouts required for all new pages |
| Multi-user | All records must store `created_by` user reference |

---

## 10. Milestones

| Phase | Modules | Target |
|---|---|---|
| Phase 1 | Quotation (Enhanced) + Billing | Week 1–2 |
| Phase 2 | Payments | Week 3 |
| Phase 3 | Inventory | Week 4 |
| Phase 4 | Reports | Week 5–6 |
| Phase 5 | QA, Polish, Deploy | Week 7 |

---

## 11. Open Questions

- [ ] Should invoices support multi-currency?
- [ ] Do payments need bank reconciliation / bank feed integration?
- [ ] Should the client portal (quote approval link) be in scope for v2.0?
- [ ] Is a mobile app required or is responsive web sufficient?
- [ ] Should inventory trigger auto-deduction when an invoice is created?

---

## 12. Out of Scope (v2.0)

- Mobile native app
- Client-facing portal
- Third-party accounting integrations (Xero, QuickBooks)
- Automated WhatsApp / email sending *(planned for v2.1)*
- Multi-company / multi-tenant support

---

> *This PRD is a living document and will be updated as decisions are made.*
