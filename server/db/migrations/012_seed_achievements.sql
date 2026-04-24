-- Seed initial achievements
INSERT INTO achievements (id, name, description, icon, rarity) VALUES
(1, 'First Vote', 'Cast your first vote for a server', '🗳️', 'common'),
(2, 'Voter', 'Cast 10 votes', '📊', 'common'),
(3, 'Dedicated Voter', 'Cast 50 votes', '🎯', 'uncommon'),
(4, 'Vote Master', 'Cast 100 votes', '👑', 'rare'),
(5, 'Vote Legend', 'Cast 500 votes', '⭐', 'legendary'),
(6, 'First Review', 'Write your first server review', '✍️', 'common'),
(7, 'Critic', 'Write 10 server reviews', '📝', 'uncommon'),
(8, 'Server Owner', 'Own a server on the toplist', '🏆', 'rare'),
(9, 'Popular Server', 'Your server received 100+ votes', '🌟', 'epic'),
(10, 'Early Adopter', 'Joined during the first month', '🚀', 'rare'),
(11, 'Social Butterfly', 'Have 10 friends', '🦋', 'uncommon'),
(12, 'Community Leader', 'Have 50 friends', '👥', 'rare');
