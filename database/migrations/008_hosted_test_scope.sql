-- Empty outside explicitly provisioned hosted tests. Never enables production math.
CREATE TABLE hosted_test_environment (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  site_id text NOT NULL UNIQUE CHECK (site_id ~ '^[a-fA-F0-9-]{36}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
