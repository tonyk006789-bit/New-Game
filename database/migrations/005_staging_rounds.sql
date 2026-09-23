-- Experimental results are separate from production approvals and free practice.
CREATE TABLE staging_rounds (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id), game_id text NOT NULL,
 profile_id text NOT NULL, profile_hash text NOT NULL CHECK(length(profile_hash)=64),
 stake_units bigint NOT NULL CHECK(stake_units IN (25,50,75)), award_units bigint NOT NULL CHECK(award_units>=0),
 stake_transaction uuid NOT NULL UNIQUE REFERENCES ledger_transactions(id),
 award_transaction uuid UNIQUE REFERENCES ledger_transactions(id),
 result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((award_units=0)=(award_transaction IS NULL))
);
CREATE INDEX staging_account_history ON staging_rounds(account_id,created_at DESC);
CREATE TRIGGER staging_append_only BEFORE UPDATE OR DELETE ON staging_rounds FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE FUNCTION check_staging_settlement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ledger_transactions t JOIN ledger_postings p ON p.transaction_id=t.id JOIN wallets w ON w.id=p.wallet_id
 WHERE t.id=NEW.stake_transaction AND t.kind='GAME_STAKE' AND t.actor_id=NEW.account_id AND t.target_id=NEW.account_id AND w.account_id=NEW.account_id AND p.units=-NEW.stake_units) THEN
 RAISE EXCEPTION 'Staging stake must match its ledger'; END IF;
 IF NEW.award_units>0 AND NOT EXISTS(SELECT 1 FROM ledger_transactions t JOIN ledger_postings p ON p.transaction_id=t.id JOIN wallets w ON w.id=p.wallet_id
 WHERE t.id=NEW.award_transaction AND t.related_id=NEW.stake_transaction AND t.kind='GAME_PAYOUT' AND t.target_id=NEW.account_id AND w.account_id=NEW.account_id AND p.units=NEW.award_units) THEN
 RAISE EXCEPTION 'Staging award must match its ledger'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER staging_settlement AFTER INSERT ON staging_rounds DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_staging_settlement();
