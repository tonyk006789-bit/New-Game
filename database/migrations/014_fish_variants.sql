-- Existing tables remain Reef Party. Both variants share the approved tier model.
ALTER TABLE practice_rooms ADD COLUMN game_id text NOT NULL DEFAULT 'reef-party'
 CHECK (game_id IN ('reef-party','abyss-legends'));
CREATE INDEX practice_room_variant ON practice_rooms(branch_id,game_id,expires_at);
-- Room snapshots expose a bounded projection of committed impacts, never wallets.
CREATE INDEX staging_room_impacts ON staging_rounds((result->>'roomId'),created_at DESC)
 WHERE game_id IN ('reef-party','abyss-legends');
