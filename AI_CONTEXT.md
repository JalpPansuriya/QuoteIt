# AI Context — Quoteit

## Overview
- **Purpose**: A fast, cloud-native quotation builder and management tool designed for bulk window resellers and manufacturers.
- **Stack**: React, Tailwind CSS, Zustand, React Router, Supabase.
- **Status**: Production (Live on Vercel)
- **Version**: 1.7.0
- **Last Updated**: 2026-05-05

---

## File Structure
```
/src
  /components
    /ui        # Reusable base components (Button, Input, Card, Select)
    Layout.tsx # Main app shell with sidebar
  /pages
    Login.tsx        # Dedicated landing for authentication
    Dashboard.tsx    # App overview, stats, recent quotes
    QuotesList.tsx   # All quotes, search, duplicate action
    QuoteBuilder.tsx # Complex line-item builder, calculate totals
    Clients.tsx      # CRM lite for client management
    Catalog.tsx      # Product catalog definition
  /store
    useStore.ts      # Zustand global state with cloud auto-sync
  /lib
    supabase.ts      # Cloud client
    supabaseService.ts # Relational data access
```

## Key Components
| Component | File | Purpose |
|-----------|------|---------|
| QuoteBuilder | `/src/pages/QuoteBuilder.tsx` | Heart of the app. Edits line items, dynamically calculates totals. |
| GlobalStore | `/src/store/useStore.ts` | State management with real-time relational persistence. |
| Login | `/src/pages/Login.tsx` | Secure entry point for authenticated users. |

## Data Flow Notes
- **Relational Cloud**: Data is stored in relational tables (Clients, Products, Quotes) via Supabase.
- **Auth Guard**: Application routes are hidden behind a `ProtectedRoute` requiring valid session.
- **Auto-Save**: Changes persist to the cloud automatically with a 1s debounce.

## Tech Capabilities
- **Native PDF Engine**: Uses `jsPDF` + `AutoTable` to draw PDFs directly, bypassing all HTML-to-Canvas color/memory limitations.
- **Quick CRM**: Quick-add modal for clients directly inside the Quote Builder.
- **Professional Specs**: 18+ technical fields (Series, Track, Sash, Hardware) plus support for unlimited **Custom Specifications** (key-value pairs).
- **Intelligent Schematics**: Procedural SVG-based window drawings with multi-pane support (1-4 sections) and realistic glass glare effects.

## Next Steps
- [ ] Add site visit notes / photo attachment.
- [ ] Implement deeper analytics for quote conversion.
- [ ] Enable specific WhatsApp sending functionality.
- [x] Relational Supabase migration.
- [x] Dedicated Login Page.
