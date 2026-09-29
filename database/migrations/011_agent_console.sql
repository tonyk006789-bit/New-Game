-- Owner approval, 2026-09-29: agents may collect available credits from their
-- own players. This is a balanced transfer, never issuance or cash redemption.
ALTER TABLE ledger_transactions DROP CONSTRAINT ledger_transactions_kind_check;
ALTER TABLE ledger_transactions ADD CONSTRAINT ledger_transactions_kind_check
 CHECK (kind IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','REDEEM','REVERSAL','GAME_STAKE','GAME_PAYOUT','DAILY_WHEEL'));
ALTER TABLE idempotency_records DROP CONSTRAINT idempotency_records_operation_check;
ALTER TABLE idempotency_records ADD CONSTRAINT idempotency_records_operation_check
 CHECK (operation IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','REDEEM','REVERSAL','ROUND','DAILY_WHEEL','ACCOUNT_CREATE','ACCOUNT_MANAGE'));
CREATE INDEX accounts_branch_created ON accounts(branch_id,created_at DESC,id);
CREATE INDEX ledger_branch_created ON ledger_transactions(branch_id_at_event,created_at DESC,id);
CREATE INDEX audit_actor_login ON audit_events(actor_id,created_at DESC) WHERE event_type='LOGIN';
