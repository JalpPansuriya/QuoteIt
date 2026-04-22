# AI Context — WinQuote Pro

## Overview
- **Purpose**: A fast, offline-capable quotation builder and management tool designed for bulk window resellers and manufacturers.
- **Stack**: React, Tailwind CSS, Zustand, React Router.
- **Status**: In Development (V1 ready).
- **Version**: 1.0.0
- **Last Updated**: 2026-04-22

## File Structure
```
/src
  /components
    /ui        # Reusable base components (Button, Input, Card, Select)
    Layout.tsx # Main app shell with sidebar
  /pages
    Dashboard.tsx    # App overview, stats, recent quotes
    QuotesList.tsx   # All quotes, search, duplicate action
    QuoteBuilder.tsx # Complex line-item builder, calculate totals
    Clients.tsx      # CRM lite for client management
    Catalog.tsx      # Product catalog definition
  /store
    useStore.ts      # Zustand global state with persist to localStorage
  /lib
    utils.ts         # className merger, currency formatting, Quote ID gen
```

## Key Components
| Component | File | Purpose |
|-----------|------|---------|
| QuoteBuilder | `/src/pages/QuoteBuilder.tsx` | Heart of the app. Edits line items, dynamically calculates totals, handles taxes and discounts. |
| GlobalStore | `/src/store/useStore.ts` | Keeps all clients, products, and quotes in local storage. |
| Dashboard | `/src/pages/Dashboard.tsx` | Gives user an immediate read on revenue and pending items. |

## Data Flow Notes
- All prices are in INR formatting by default (`formatCurrency` util).
- Quote Total logic: `(width * height * qty * rate) - discount + taxes`. 
- Print: Tailwind's `@media print` utilities (`print:hidden`, `print:block`) are used in `QuoteBuilder.tsx` to turn it into a clean layout for PDF export via browser.

## Next Steps
- [ ] Add site visit notes / photo attachment.
- [ ] Enable specific WhatsApp sending functionality (maybe deep linking `whatsapp://send?text=...`).
- [ ] Supabase integration for cloud-sync instead of pure offline localStorage.
