-- Account removal preserves every wallet and ledger entry.
ALTER TABLE accounts ADD COLUMN archived_at timestamptz;
CREATE INDEX accounts_archived ON accounts(branch_id) WHERE archived_at IS NOT NULL;
