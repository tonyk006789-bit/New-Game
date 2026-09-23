-- Initial hosted schema. Source migrations are preserved verbatim below.

-- Source: database/migrations/001_foundation.sql
-- S0 domain foundations only. No credit mutation service is delivered by this schema.
CREATE TYPE account_role AS ENUM ('MAIN_ADMIN', 'SUB_DISTRIBUTOR', 'AGENT', 'PLAYER');
CREATE TABLE branches (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES branches(id),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  CHECK (id IS DISTINCT FROM parent_id)
);
CREATE TABLE branch_ancestors (
  branch_id uuid NOT NULL REFERENCES branches(id),
  ancestor_id uuid NOT NULL REFERENCES branches(id),
  depth integer NOT NULL CHECK (depth >= 0),
  PRIMARY KEY (branch_id, ancestor_id),
  CHECK ((depth = 0) = (branch_id = ancestor_id))
);
CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES branches(id),
  role account_role NOT NULL,
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 100),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_initial_main_admin ON accounts(role) WHERE role = 'MAIN_ADMIN';
CREATE TABLE wallets (
  id uuid PRIMARY KEY,
  account_id uuid UNIQUE NOT NULL REFERENCES accounts(id),
  settled_units bigint NOT NULL DEFAULT 0 CHECK (settled_units >= 0),
  reserved_units bigint NOT NULL DEFAULT 0 CHECK (reserved_units >= 0 AND reserved_units <= settled_units),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION enforce_zero_wallet_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.settled_units <> 0 OR NEW.reserved_units <> 0 OR NEW.version <> 0 THEN
    RAISE EXCEPTION 'New non-system wallets must start at zero';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wallet_zero_start BEFORE INSERT ON wallets FOR EACH ROW EXECUTE FUNCTION enforce_zero_wallet_insert();
CREATE TABLE idempotency_records (
  actor_id uuid NOT NULL REFERENCES accounts(id),
  operation text NOT NULL CHECK (operation IN ('MANUAL_ADD', 'MANUAL_REMOVE', 'TRANSFER', 'ROUND', 'REVERSAL')),
  request_key text NOT NULL CHECK (length(request_key) BETWEEN 8 AND 128),
  request_hash text NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  response jsonb NOT NULL,
  committed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id, operation, request_key)
);
CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES accounts(id),
  branch_id_at_event uuid NOT NULL REFERENCES branches(id),
  event_type text NOT NULL,
  request_id uuid NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'History is immutable; append an authorized correction'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TABLE game_profiles (
  id text PRIMARY KEY,
  game_id text NOT NULL CHECK (game_id IN ('temple-lights', 'orchard-numbers', 'reef-party')),
  version text NOT NULL,
  math_hash text NOT NULL CHECK (math_hash ~ '^[a-f0-9]{64}$'),
  definition jsonb NOT NULL,
  approval_ref text NOT NULL CHECK (length(approval_ref) > 0),
  approved_at timestamptz NOT NULL,
  UNIQUE(game_id, version)
);
CREATE TRIGGER profiles_append_only BEFORE UPDATE OR DELETE ON game_profiles FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
-- Approval table is intentionally empty; neither sample math nor fixtures populate it.


-- Source: database/migrations/002_accounts_ledger_practice.sql
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


-- Source: database/migrations/003_room_scope_and_projection.sql
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


-- Source: database/migrations/004_balance_trigger_record_fix.sql
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


-- Source: database/migrations/005_staging_rounds.sql
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


-- Source: database/migrations/006_final_wallet_reconciliation.sql
-- A stake and award may update the same wallet twice in one atomic transaction.
-- Deferred checks must compare its final projection, not an intermediate NEW row.
CREATE OR REPLACE FUNCTION reconcile_wallet() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (SELECT settled_units FROM wallets WHERE id=NEW.id) <> coalesce((SELECT sum(units) FROM ledger_postings WHERE wallet_id=NEW.id),0) THEN
  RAISE EXCEPTION 'Wallet balance must reconcile with ledger';
 END IF;
 RETURN NEW;
END $$;


-- Source: database/migrations/007_incremental_stakes.sql
-- Preserve immutable historical rounds; widen only the accepted stake domain.
ALTER TABLE staging_rounds DROP CONSTRAINT staging_rounds_stake_units_check;
ALTER TABLE staging_rounds ADD CONSTRAINT staging_rounds_stake_units_check
  CHECK (stake_units BETWEEN 25 AND 2000 AND mod(stake_units,25)=0
    AND (profile_id <> 'stage-paying30-v1' OR stake_units IN (25,50,75)));


-- Source: database/migrations/008_hosted_test_scope.sql
-- Empty outside explicitly provisioned hosted tests. Never enables production math.
CREATE TABLE hosted_test_environment (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  site_id text NOT NULL UNIQUE CHECK (site_id ~ '^[a-fA-F0-9-]{36}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

