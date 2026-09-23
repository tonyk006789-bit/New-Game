-- Preserve immutable historical rounds; widen only the accepted stake domain.
ALTER TABLE staging_rounds DROP CONSTRAINT staging_rounds_stake_units_check;
ALTER TABLE staging_rounds ADD CONSTRAINT staging_rounds_stake_units_check
  CHECK (stake_units BETWEEN 25 AND 2000 AND mod(stake_units,25)=0
    AND (profile_id <> 'stage-paying30-v1' OR stake_units IN (25,50,75)));
