CREATE OR REPLACE FUNCTION check_balanced_transaction() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tx uuid;
BEGIN
 IF TG_TABLE_NAME = 'ledger_transactions' THEN
   tx := NEW.id;
 ELSE
   tx := NEW.transaction_id;
 END IF;
 IF (SELECT count(*) < 2 OR coalesce(sum(units),0) <> 0 FROM ledger_postings WHERE transaction_id=tx) THEN
   RAISE EXCEPTION 'Ledger transaction must have balanced postings';
 END IF;
 RETURN NEW;
END $$;
