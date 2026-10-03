-- Preserve legacy usernames; new credential composition is enforced when set by the API.
-- Usernames remain case-insensitive and unique, with only a technical storage/input cap.
ALTER TABLE accounts DROP CONSTRAINT accounts_username_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_username_check
 CHECK (length(username) BETWEEN 1 AND 256 AND username = lower(username));
