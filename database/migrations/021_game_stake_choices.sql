-- Owner-approved 0.10/0.20 choices for 15 test games. Preserve historic rows.
ALTER TABLE staging_rounds DROP CONSTRAINT staging_rounds_stake_units_check;
ALTER TABLE staging_rounds ADD CONSTRAINT staging_rounds_stake_units_check CHECK (
 (((game_id='royal-blackjack' AND profile_id='stage-blackjack-v1')
 OR (game_id='double-deck-blackjack' AND profile_id='stage-double-deck-v1')
 OR (game_id='european-blackjack' AND profile_id='stage-european-v1'))
 AND stake_units BETWEEN 50 AND 8000 AND mod(stake_units,50)=0)
 OR (game_id NOT IN ('royal-blackjack','double-deck-blackjack','european-blackjack')
 AND stake_units BETWEEN 25 AND 2000 AND mod(stake_units,25)=0
 AND (profile_id<>'stage-paying30-v1' OR stake_units IN (25,50,75)))
 OR (stake_units IN (10,20) AND profile_id LIKE '%-stakes-v32'
 AND game_id IN ('neon-sevens','ruby-rush','disco-diamonds','outlaw-sevens','temple-lights',
 'jade-fortune','celestial-wilds','ember-relics','clockwork-vault',
 'orchard-numbers','meteor-keno','bamboo-keno','reef-party','polar-odyssey','cosmic-tides')));
