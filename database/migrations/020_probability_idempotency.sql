ALTER TABLE idempotency_records DROP CONSTRAINT idempotency_records_operation_check;
ALTER TABLE idempotency_records ADD CONSTRAINT idempotency_records_operation_check
 CHECK(operation IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','ROUND','REVERSAL','DAILY_WHEEL','REDEEM','ACCOUNT_CREATE','ACCOUNT_MANAGE','BLACKJACK','GAME_PROBABILITY'));
