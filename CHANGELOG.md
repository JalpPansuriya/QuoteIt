# Changelog

Format: [YYYY-MM-DD] | [vX.X.X] | [Type: Added/Fixed/Changed/Removed]

---

## [1.0.0] — 2026-04-22

### Added
- Project initialized
- Global state structure built out via Zustand with `persist`.
- UI Library created (Button, Input, Card, Select).
- Views built: Dashboard, QuotesList, QuoteBuilder, Clients, Catalog.
- Core logic: Line item calculations logic taking dimensions, units (sq ft vs linear), quantity, rate, and discount into account.
- Print-friendly layout on Quote Builder.

### Technical Notes
- Built as local-first PWA architecture initially via `localStorage` to satisfy requirement for fast, offline resilience for window resellers who may be on-site without internet.
