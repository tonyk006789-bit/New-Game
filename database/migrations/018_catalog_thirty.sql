-- Add two fish worlds and two independently versioned blackjack test profiles.
-- Existing wallets, hands and immutable receipts are not rewritten.
ALTER TABLE practice_rooms DROP CONSTRAINT practice_rooms_game_id_check;
ALTER TABLE practice_rooms ADD CONSTRAINT practice_rooms_game_id_check
 CHECK(game_id IN ('reef-party','abyss-legends','sunken-dynasty','polar-odyssey','corsair-cove','cosmic-tides'));
CREATE INDEX staging_expansion_fish_impacts ON staging_rounds((result->>'roomId'),created_at DESC)
 WHERE game_id IN ('corsair-cove','cosmic-tides');
ALTER TABLE staging_rounds DROP CONSTRAINT staging_rounds_stake_units_check;
ALTER TABLE staging_rounds ADD CONSTRAINT staging_rounds_stake_units_check CHECK (
 (((game_id='royal-blackjack' AND profile_id='stage-blackjack-v1')
 OR (game_id='double-deck-blackjack' AND profile_id='stage-double-deck-v1')
 OR (game_id='european-blackjack' AND profile_id='stage-european-v1'))
 AND stake_units BETWEEN 50 AND 8000 AND mod(stake_units,50)=0)
 OR (game_id NOT IN ('royal-blackjack','double-deck-blackjack','european-blackjack')
 AND stake_units BETWEEN 25 AND 2000 AND mod(stake_units,25)=0
 AND (profile_id<>'stage-paying30-v1' OR stake_units IN (25,50,75))));
