-- Create all 4NF and 5NF normalization tables for Spotify clone
-- Run this script to create missing tables from the normalization analysis

-- Step 1: Create Genre lookup table (4NF)
CREATE TABLE IF NOT EXISTS Genre (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Step 2: Create Mood lookup table (5NF)
CREATE TABLE IF NOT EXISTS Mood (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Step 3: Create TrackGenre junction table (4NF)
CREATE TABLE IF NOT EXISTS TrackGenre (
    trackId INT NOT NULL,
    genreId INT NOT NULL,
    PRIMARY KEY (trackId, genreId),
    CONSTRAINT fk_track_genre_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE,
    CONSTRAINT fk_track_genre_genre FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 4: Create UserGenrePreference table (4NF)
CREATE TABLE IF NOT EXISTS UserGenrePreference (
    userId INT NOT NULL,
    genreId INT NOT NULL,
    preferenceWeight DECIMAL(3,2) DEFAULT 1.0,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (userId, genreId),
    CONSTRAINT fk_user_genre_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_genre_genre FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 5: Create UserPlaylistTrack ternary table (5NF)
CREATE TABLE IF NOT EXISTS UserPlaylistTrack (
    userId INT NOT NULL,
    playlistId INT NOT NULL,
    trackId INT NOT NULL,
    addedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    addedBy INT NOT NULL,
    PRIMARY KEY (userId, playlistId, trackId),
    CONSTRAINT fk_upt_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_upt_playlist FOREIGN KEY (playlistId) REFERENCES Playlist(id) ON DELETE CASCADE,
    CONSTRAINT fk_upt_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE,
    CONSTRAINT fk_upt_added_by FOREIGN KEY (addedBy) REFERENCES User(id) ON DELETE RESTRICT,
    INDEX idx_upt_user_playlist (userId, playlistId),
    INDEX idx_upt_playlist_track (playlistId, trackId),
    INDEX idx_upt_user_track (userId, trackId)
) ENGINE=InnoDB;

-- Step 6: Create UserArtistAlbumFollow ternary table (5NF)
CREATE TABLE IF NOT EXISTS UserArtistAlbumFollow (
    userId INT NOT NULL,
    artistId INT NOT NULL,
    albumId INT NOT NULL,
    followedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (userId, artistId, albumId),
    CONSTRAINT fk_uaf_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_uaf_artist FOREIGN KEY (artistId) REFERENCES Artist(id) ON DELETE CASCADE,
    CONSTRAINT fk_uaf_album FOREIGN KEY (albumId) REFERENCES Album(id) ON DELETE CASCADE,
    INDEX idx_uaf_user_artist (userId, artistId),
    INDEX idx_uaf_artist_album (artistId, albumId),
    INDEX idx_uaf_user_album (userId, albumId)
) ENGINE=InnoDB;

-- Step 7: Create TrackGenreMood ternary table (5NF)
CREATE TABLE IF NOT EXISTS TrackGenreMood (
    trackId INT NOT NULL,
    genreId INT NOT NULL,
    moodId INT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    PRIMARY KEY (trackId, genreId, moodId),
    CONSTRAINT fk_tgm_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE,
    CONSTRAINT fk_tgm_genre FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE,
    CONSTRAINT fk_tgm_mood FOREIGN KEY (moodId) REFERENCES Mood(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 8: Populate lookup tables with sample data
INSERT INTO Genre (name, description) VALUES 
('Rock', 'Rock music genre'),
('Pop', 'Pop music genre'),
('Jazz', 'Jazz music genre'),
('Classical', 'Classical music genre'),
('Electronic', 'Electronic music genre'),
('Hip Hop', 'Hip hop music genre')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO Mood (name, description) VALUES 
('Happy', 'Upbeat and positive mood'),
('Sad', 'Melancholic and emotional mood'),
('Energetic', 'High energy and exciting mood'),
('Relaxing', 'Calm and peaceful mood'),
('Dark', 'Intense and moody atmosphere')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Step 9: Populate junction tables with sample data
-- TrackGenre relationships
INSERT INTO TrackGenre (trackId, genreId) VALUES
(1, 1), -- Track 1 -> Rock
(1, 2), -- Track 1 -> Pop  
(2, 1), -- Track 2 -> Rock
(2, 3)  -- Track 2 -> Jazz
ON DUPLICATE KEY UPDATE trackId = VALUES(trackId);

-- UserGenrePreference relationships
INSERT INTO UserGenrePreference (userId, genreId, preferenceWeight) VALUES
(1, 1, 0.9), -- User 1 likes Rock
(1, 2, 0.7), -- User 1 likes Pop
(2, 3, 0.8), -- User 2 likes Jazz
(2, 5, 0.6)  -- User 2 likes Electronic
ON DUPLICATE KEY UPDATE preferenceWeight = VALUES(preferenceWeight);

-- TrackGenreMood relationships (5NF)
INSERT INTO TrackGenreMood (trackId, genreId, moodId, confidence) VALUES
(1, 1, 3, 0.9), -- Track 1: Rock, Energetic
(1, 2, 3, 0.8), -- Track 1: Pop, Energetic
(2, 1, 5, 0.7), -- Track 2: Rock, Dark
(2, 3, 4, 0.6)  -- Track 2: Jazz, Relaxing
ON DUPLICATE KEY UPDATE confidence = VALUES(confidence);

-- UserPlaylistTrack relationships (5NF)
INSERT INTO UserPlaylistTrack (userId, playlistId, trackId, addedBy) VALUES
(1, 1, 1, 1), -- User 1 added Track 1 to Playlist 1
(1, 1, 2, 1)  -- User 1 added Track 2 to Playlist 1
ON DUPLICATE KEY UPDATE addedAt = VALUES(addedAt);

-- Step 10: Verification queries
-- 4NF: Track with multiple genres
SELECT 
    t.id as track_id,
    t.title as track_title,
    GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') as genres
FROM Track t
LEFT JOIN TrackGenre tg ON t.id = tg.trackId
LEFT JOIN Genre g ON tg.genreId = g.id
GROUP BY t.id, t.title
ORDER BY t.id;

-- 4NF: User genre preferences
SELECT 
    u.id as user_id,
    u.name as user_name,
    GROUP_CONCAT(CONCAT(g.name, ' (', ugp.preferenceWeight, ')') ORDER BY ugp.preferenceWeight DESC SEPARATOR ', ') as genre_preferences
FROM User u
LEFT JOIN UserGenrePreference ugp ON u.id = ugp.userId
LEFT JOIN Genre g ON ugp.genreId = g.id
GROUP BY u.id, u.name
ORDER BY u.id;

-- 5NF: TrackGenreMood ternary relationships
SELECT 
    t.id as track_id,
    t.title as track_title,
    g.name as genre_name,
    m.name as mood_name,
    tgm.confidence
FROM TrackGenreMood tgm
JOIN Track t ON tgm.trackId = t.id
JOIN Genre g ON tgm.genreId = g.id
JOIN Mood m ON tgm.moodId = m.id
ORDER BY t.id, g.name, m.name;

-- 5NF: UserPlaylistTrack ternary relationships
SELECT 
    upt.userId,
    u.name as user_name,
    upt.playlistId,
    p.name as playlist_name,
    upt.trackId,
    t.title as track_title,
    upt.addedAt,
    ub.name as added_by_name
FROM UserPlaylistTrack upt
JOIN User u ON upt.userId = u.id
JOIN Playlist p ON upt.playlistId = p.id
JOIN Track t ON upt.trackId = t.id
JOIN User ub ON upt.addedBy = ub.id
ORDER BY upt.addedAt DESC;
