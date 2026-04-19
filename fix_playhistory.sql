-- Fix PlayHistory table after normalization error
-- Run these commands in order to recreate the normalized PlayHistory table

-- Step 1: Check if PlayHistory_normalized exists and drop it if needed
DROP TABLE IF EXISTS PlayHistory_normalized;

-- Step 2: Create properly normalized PlayHistory table
CREATE TABLE PlayHistory_normalized (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    trackId INT NOT NULL,
    playedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user_track (userId, trackId),
    INDEX idx_user_played (userId, playedAt),
    INDEX idx_track_played (trackId, playedAt)
) ENGINE=InnoDB;

-- Step 3: Add foreign key constraints
ALTER TABLE PlayHistory_normalized 
ADD CONSTRAINT fk_play_history_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_play_history_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE;

-- Step 4: If you have existing PlayHistory data, migrate it (skip if no data exists)
-- Uncomment and run only if you need to migrate from backup data
/*
INSERT INTO PlayHistory_normalized (userId, trackId, playedAt)
SELECT DISTINCT
    userId,
    (SELECT id FROM Track WHERE title = trackTitle LIMIT 1) as trackId,
    playedAt
FROM PlayHistory_backup
WHERE trackTitle IS NOT NULL;
*/

-- Step 5: Rename to final table name
RENAME TABLE PlayHistory_normalized TO PlayHistory;

-- Step 6: Verify the table structure
DESC PlayHistory;

-- Step 7: Test with sample data (optional)
INSERT INTO PlayHistory (userId, trackId, playedAt) VALUES
(1, 1, '2026-04-15 20:30:00'),
(1, 2, '2026-04-15 21:00:00'),
(2, 1, '2026-04-15 22:15:00');

-- Step 8: Verification query
SELECT 
    ph.id,
    u.name as user_name,
    t.title as track_title,
    a.name as artist_name,
    ph.playedAt
FROM PlayHistory ph
JOIN User u ON ph.userId = u.id
JOIN Track t ON ph.trackId = t.id
JOIN Artist a ON t.artistId = a.id
ORDER BY ph.playedAt DESC;
