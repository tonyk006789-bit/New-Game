ALTER TABLE practice_rooms ADD COLUMN branch_id uuid REFERENCES branches(id);
-- Existing unscoped practice rooms expire rather than being reassigned to a branch.
UPDATE practice_rooms SET expires_at=now() WHERE branch_id IS NULL;
CREATE FUNCTION check_posting_projection() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.wallet_id IS NOT NULL AND (SELECT settled_units FROM wallets WHERE id=NEW.wallet_id)
   <> (SELECT sum(units) FROM ledger_postings WHERE wallet_id=NEW.wallet_id) THEN
   RAISE EXCEPTION 'Postings must reconcile with wallet projection';
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER postings_reconcile AFTER INSERT ON ledger_postings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_posting_projection();
