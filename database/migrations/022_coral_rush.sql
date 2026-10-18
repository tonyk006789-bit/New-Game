-- Original seventh fish world. No wallet or historical round changes.
ALTER TABLE practice_rooms DROP CONSTRAINT practice_rooms_game_id_check;
ALTER TABLE practice_rooms ADD CONSTRAINT practice_rooms_game_id_check
 CHECK(game_id IN ('reef-party','abyss-legends','sunken-dynasty','polar-odyssey','corsair-cove','cosmic-tides','coral-rush'));
CREATE INDEX staging_coral_fish_impacts ON staging_rounds((result->>'roomId'),created_at DESC)
 WHERE game_id='coral-rush';
