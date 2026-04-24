-- Add vote tracking parameter
ALTER TABLE votes
  ADD COLUMN tracking_param VARCHAR(255),
  ADD COLUMN referrer VARCHAR(500);

CREATE INDEX idx_votes_tracking ON votes (tracking_param);
