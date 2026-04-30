-- HARD LOCK PROTECTION
-- Prevents updates to quotes and quote items once they are 'Invoiced'

-- 1. Function to check if a quote is invoiced
CREATE OR REPLACE FUNCTION check_quote_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- For quote_items, we need to check the parent quote's status
    IF TG_TABLE_NAME = 'quote_items' THEN
        IF EXISTS (
            SELECT 1 FROM quotes 
            WHERE id = OLD.quote_id 
            AND status = 'Invoiced'
        ) THEN
            RAISE EXCEPTION 'This quotation is invoiced and locked. Changes are not permitted.';
        END IF;
    -- For quotes directly
    ELSIF TG_TABLE_NAME = 'quotes' THEN
        IF OLD.status = 'Invoiced' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.subtotal IS DISTINCT FROM OLD.subtotal) THEN
             -- Allow status change if it's reverting (though we might not want to allow that from SQL)
             -- But for now, let's block everything if status is Invoiced
             RAISE EXCEPTION 'This quotation is invoiced and locked. Changes are not permitted.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Triggers
DROP TRIGGER IF EXISTS tr_lock_quote_items ON quote_items;
CREATE TRIGGER tr_lock_quote_items
BEFORE UPDATE OR DELETE ON quote_items
FOR EACH ROW EXECUTE PROCEDURE check_quote_lock();

DROP TRIGGER IF EXISTS tr_lock_quotes ON quotes;
CREATE TRIGGER tr_lock_quotes
BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE PROCEDURE check_quote_lock();
