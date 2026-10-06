ALTER TABLE practice_rooms DROP CONSTRAINT practice_rooms_game_id_check;
ALTER TABLE practice_rooms ADD CONSTRAINT practice_rooms_game_id_check
 CHECK(game_id IN ('reef-party','abyss-legends','sunken-dynasty','polar-odyssey'));
CREATE INDEX staging_premium_fish_impacts ON staging_rounds((result->>'roomId'),created_at DESC)
 WHERE game_id IN ('sunken-dynasty','polar-odyssey');
ALTER TABLE idempotency_records DROP CONSTRAINT idempotency_records_operation_check;
ALTER TABLE idempotency_records ADD CONSTRAINT idempotency_records_operation_check
 CHECK(operation IN ('MANUAL_ADD','MANUAL_REMOVE','TRANSFER','REDEEM','REVERSAL','ROUND','DAILY_WHEEL','ACCOUNT_CREATE','ACCOUNT_MANAGE','BLACKJACK'));
ALTER TABLE staging_rounds DROP CONSTRAINT staging_rounds_stake_units_check;
ALTER TABLE staging_rounds ADD CONSTRAINT staging_rounds_stake_units_check CHECK (
 (game_id='royal-blackjack' AND profile_id='stage-blackjack-v1' AND stake_units BETWEEN 50 AND 8000 AND mod(stake_units,50)=0)
 OR (game_id<>'royal-blackjack' AND stake_units BETWEEN 25 AND 2000 AND mod(stake_units,25)=0
 AND (profile_id<>'stage-paying30-v1' OR stake_units IN (25,50,75))));
CREATE TABLE blackjack_hands(
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id),
 state jsonb NOT NULL, revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 reserved_units bigint NOT NULL CHECK(reserved_units BETWEEN 0 AND 8000),
 settled boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(settled=(reserved_units=0)));
CREATE UNIQUE INDEX blackjack_one_active ON blackjack_hands(account_id) WHERE NOT settled;
CREATE INDEX blackjack_expiry ON blackjack_hands(expires_at) WHERE NOT settled;
CREATE FUNCTION protect_blackjack_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR OLD.settled THEN RAISE EXCEPTION 'Settled blackjack hands are immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER blackjack_keep_history BEFORE UPDATE OR DELETE ON blackjack_hands FOR EACH ROW EXECUTE FUNCTION protect_blackjack_receipt();
