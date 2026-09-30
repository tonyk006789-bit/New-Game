-- Presentation identifiers and security metadata; no wallet or ledger mutations.
ALTER TABLE accounts ADD COLUMN public_id bigint GENERATED ALWAYS AS IDENTITY (START WITH 100001) UNIQUE;
ALTER TABLE accounts ADD COLUMN registered_ip text;
ALTER TABLE accounts ADD COLUMN device_review_enabled boolean NOT NULL DEFAULT false;
CREATE TABLE operator_devices (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id), secret_hash text NOT NULL,
 user_agent text NOT NULL, first_ip text, last_ip text,
 first_seen timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now(),
 login_count bigint NOT NULL DEFAULT 1,
 status text NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED')),
 can_review boolean NOT NULL DEFAULT false,
 UNIQUE(account_id,secret_hash), CHECK(NOT can_review OR status='APPROVED')
);
ALTER TABLE sessions ADD COLUMN device_id uuid REFERENCES operator_devices(id);
CREATE INDEX operator_devices_account ON operator_devices(account_id,last_seen DESC);
CREATE TABLE operator_api_keys (
 account_id uuid PRIMARY KEY REFERENCES accounts(id), key_hash text NOT NULL UNIQUE,
 prefix text NOT NULL, allowed_ips inet[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);

ALTER TABLE ledger_transactions ADD COLUMN origin_ip text;
