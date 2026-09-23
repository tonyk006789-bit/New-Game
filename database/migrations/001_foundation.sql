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
