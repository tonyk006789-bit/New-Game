-- Source: database/migrations/009_daily_wheel.sql
-- Owner-approved daily wheel, separate from game payouts and manual adjustments.
ALTER TABLE ledger_transactions DROP CONSTRAINT ledger_transactions_kind_check;
ALTER TABLE ledger_transactions ADD CONSTRAINT ledger_transactions_kind_check CHECK (kind IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','REVERSAL','GAME_STAKE','GAME_PAYOUT','DAILY_WHEEL'));
CREATE TABLE daily_wheel_spins (
 id uuid PRIMARY KEY,
 account_id uuid NOT NULL REFERENCES accounts(id),
 profile_id text NOT NULL CHECK (profile_id='daily-wheel-v1'),
 award_units bigint NOT NULL CHECK (award_units IN (0,5,10,15,25,75,150,300,500)),
 award_transaction uuid UNIQUE REFERENCES ledger_transactions(id),
 result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((award_units=0)=(award_transaction IS NULL))
);
CREATE INDEX daily_wheel_account ON daily_wheel_spins(account_id,created_at DESC);
CREATE TRIGGER daily_wheel_append_only BEFORE UPDATE OR DELETE ON daily_wheel_spins FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE FUNCTION check_daily_wheel_settlement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.award_units>0 AND NOT EXISTS (
  SELECT 1 FROM ledger_transactions t JOIN ledger_postings p ON p.transaction_id=t.id JOIN wallets w ON w.id=p.wallet_id
  WHERE t.id=NEW.award_transaction AND t.kind='DAILY_WHEEL' AND t.actor_id=NEW.account_id AND t.target_id=NEW.account_id AND w.account_id=NEW.account_id AND p.units=NEW.award_units
 ) THEN RAISE EXCEPTION 'Daily wheel award must match its ledger'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER daily_wheel_settlement AFTER INSERT ON daily_wheel_spins DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_daily_wheel_settlement();

-- Source: database/migrations/010_daily_wheel_idempotency.sql
ALTER TABLE idempotency_records DROP CONSTRAINT idempotency_records_operation_check;
ALTER TABLE idempotency_records ADD CONSTRAINT idempotency_records_operation_check
 CHECK (operation IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','REVERSAL','ROUND','DAILY_WHEEL'));
