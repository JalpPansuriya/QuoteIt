-- ADD INVOICE TYPE COLUMN
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'Partial' CHECK (invoice_type IN ('Partial', 'Final'));

-- UPDATE RLS (already covered by user_id policy usually, but ensure consistency)
COMMENT ON COLUMN invoices.invoice_type IS 'Partial: Adds to balance due calculation. Final: Summary only, ignored in balance due.';
