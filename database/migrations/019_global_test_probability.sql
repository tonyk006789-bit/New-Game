-- Owner-approved global test policy. No wallet or historical round mutations.
CREATE TABLE test_probability_versions (
 revision bigint PRIMARY KEY CHECK(revision BETWEEN 1 AND 999999999999999),
 paying_percent integer NOT NULL CHECK(paying_percent BETWEEN 5 AND 50),
 actor_id uuid REFERENCES accounts(id),
 request_key text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER test_probability_append_only BEFORE UPDATE OR DELETE ON test_probability_versions
 FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
INSERT INTO test_probability_versions(revision,paying_percent) VALUES(1,20);
CREATE TABLE test_probability_current (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 revision bigint NOT NULL REFERENCES test_probability_versions(revision)
);
INSERT INTO test_probability_current(singleton,revision) VALUES(true,1);
