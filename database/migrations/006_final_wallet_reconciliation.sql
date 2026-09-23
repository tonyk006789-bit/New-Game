-- A stake and award may update the same wallet twice in one atomic transaction.
-- Deferred checks must compare its final projection, not an intermediate NEW row.
CREATE OR REPLACE FUNCTION reconcile_wallet() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (SELECT settled_units FROM wallets WHERE id=NEW.id) <> coalesce((SELECT sum(units) FROM ledger_postings WHERE wallet_id=NEW.id),0) THEN
  RAISE EXCEPTION 'Wallet balance must reconcile with ledger';
 END IF;
 RETURN NEW;
END $$;
