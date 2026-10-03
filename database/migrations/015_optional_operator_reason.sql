-- Owner request, 3 October 2026: remove operator reason inputs and leave new notes empty.
-- Preserve every existing ledger row, including its original reason and request hash.
ALTER TABLE ledger_transactions DROP CONSTRAINT ledger_transactions_reason_check;
ALTER TABLE ledger_transactions ADD CONSTRAINT ledger_transactions_reason_check
  CHECK (length(reason) = 0 OR length(reason) BETWEEN 5 AND 500);
