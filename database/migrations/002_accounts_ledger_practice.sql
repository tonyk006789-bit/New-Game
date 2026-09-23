-- Persistent identity and balanced accounting. Production math approvals remain empty.
ALTER TABLE accounts ADD COLUMN username text UNIQUE CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,63}$');
ALTER TABLE accounts ADD COLUMN password_hash text;
ALTER TABLE accounts ADD COLUMN totp_secret text;
CREATE TABLE sessions (
 token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id), csrf_token text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 verified_at timestamptz, revoked_at timestamptz
);
CREATE INDEX sessions_account ON sessions(account_id);
CREATE TABLE login_attempts (key_hash text PRIMARY KEY, failures integer NOT NULL DEFAULT 0, window_start timestamptz NOT NULL DEFAULT now());
CREATE TABLE ledger_transactions (
 id uuid PRIMARY KEY, actor_id uuid NOT NULL REFERENCES accounts(id), target_id uuid NOT NULL REFERENCES accounts(id),
 branch_id_at_event uuid NOT NULL REFERENCES branches(id),
 kind text NOT NULL CHECK (kind IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','REVERSAL','GAME_STAKE','GAME_PAYOUT')),
 reason text NOT NULL CHECK (length(reason) BETWEEN 5 AND 500), request_id text NOT NULL,
 related_id uuid UNIQUE REFERENCES ledger_transactions(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ledger_postings (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, transaction_id uuid NOT NULL REFERENCES ledger_transactions(id),
 wallet_id uuid REFERENCES wallets(id), system_account text CHECK (system_account IN ('ISSUANCE','RETIREMENT','GAME_CLEARING')),
 units bigint NOT NULL CHECK (units <> 0), before_units bigint, after_units bigint, wallet_version bigint,
 CHECK ((wallet_id IS NULL) <> (system_account IS NULL)),
 CHECK (wallet_id IS NULL OR (before_units IS NOT NULL AND after_units = before_units + units AND after_units >= 0 AND wallet_version > 0)),
 UNIQUE(transaction_id,wallet_id)
);
CREATE INDEX ledger_wallet ON ledger_postings(wallet_id,id DESC);
CREATE FUNCTION check_balanced_transaction() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tx uuid;
BEGIN
 tx := CASE WHEN TG_TABLE_NAME = 'ledger_transactions' THEN NEW.id ELSE NEW.transaction_id END;
 IF (SELECT count(*) < 2 OR coalesce(sum(units),0) <> 0 FROM ledger_postings WHERE transaction_id=tx) THEN
   RAISE EXCEPTION 'Ledger transaction must have balanced postings';
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER ledger_balanced AFTER INSERT ON ledger_transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_balanced_transaction();
CREATE CONSTRAINT TRIGGER postings_balanced AFTER INSERT ON ledger_postings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_balanced_transaction();
CREATE TRIGGER ledger_append_only BEFORE UPDATE OR DELETE ON ledger_transactions FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER postings_append_only BEFORE UPDATE OR DELETE ON ledger_postings FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER idempotency_append_only BEFORE UPDATE OR DELETE ON idempotency_records FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE FUNCTION reconcile_wallet() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.settled_units <> coalesce((SELECT sum(units) FROM ledger_postings WHERE wallet_id=NEW.id),0) THEN
  RAISE EXCEPTION 'Wallet balance must reconcile with ledger';
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER wallet_reconciles AFTER UPDATE ON wallets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reconcile_wallet();
CREATE TABLE practice_rounds (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id), game_id text NOT NULL,
 request_key text NOT NULL, request_hash text NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(account_id,request_key)
);
CREATE TRIGGER practice_append_only BEFORE UPDATE OR DELETE ON practice_rounds FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
-- Practice has no wallet, stake, paytable, award or conversion into credits.
CREATE TABLE practice_rooms (id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL);
CREATE TABLE practice_seats (
 room_id uuid NOT NULL REFERENCES practice_rooms(id), seat integer NOT NULL CHECK(seat BETWEEN 1 AND 4),
 account_id uuid NOT NULL UNIQUE REFERENCES accounts(id), heartbeat_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(room_id,seat)
);
CREATE TABLE practice_targets (
 room_id uuid NOT NULL REFERENCES practice_rooms(id), target_id integer NOT NULL, captured_by uuid REFERENCES accounts(id),
 captured_at timestamptz, PRIMARY KEY(room_id,target_id)
);
