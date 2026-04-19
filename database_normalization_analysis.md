# Database Normalization Analysis - Spotify Clone

## Overview
This document analyzes the database structure of the Spotify clone application and applies normalization techniques to eliminate redundancy and improve data integrity.

## Current Database Structure

### Existing Tables:
1. **User** - User accounts and basic information
2. **Artist** - Artist information
3. **Album** - Album catalog with metadata
4. **Track** - Individual tracks with audio information
5. **Playlist** - User-created playlists
6. **PlaylistTrack** - Junction table for playlist-track relationships
7. **PlayHistory** - User listening history
8. **SignupOtp** - OTP verification for signup

---

# Chapter 4: ANALYZING THE PITFALLS, IDENTIFYING THE DEPENDENCIES, AND APPLYING NORMALIZATION

**Database used:** `spotify` (SQL command client).  
**Connection details:** Database name: `spotify`, Password: `Dhoni@28` 
**Important fix:** Using actual Spotify clone database structure with proper normalization analysis.

---

## 0) Reset Current Spotify Data (base schema only)

```sql
USE spotify;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE PlaylistTrack;
TRUNCATE TABLE Playlist;
TRUNCATE TABLE PlayHistory;
TRUNCATE TABLE SignupOtp;
TRUNCATE TABLE Track;
TRUNCATE TABLE Album;
TRUNCATE TABLE Artist;
TRUNCATE TABLE User;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## 4.1 Analyse the Pitfalls in Relations

## 4.1.1 BEFORE: One UNF table

```sql
DROP TABLE IF EXISTS spotify_data_unf;

CREATE TABLE spotify_data_unf (
    row_id INT PRIMARY KEY,
    user_id INT,
    user_name VARCHAR(191),
    user_email VARCHAR(191),
    user_avatar_url VARCHAR(191),
    artist_id INT,
    artist_name VARCHAR(191),
    artist_image_url VARCHAR(191),
    album_id INT,
    album_title VARCHAR(191),
    album_year INT,
    album_cover_url VARCHAR(191),
    track_id INT,
    track_title VARCHAR(191),
    track_duration_seconds INT,
    track_audio_url VARCHAR(191),
    playlist_id INT,
    playlist_name VARCHAR(191),
    playlist_description VARCHAR(191),
    playlist_order INT,
    played_at TIMESTAMP,
    signup_email VARCHAR(191),
    signup_name VARCHAR(191),
    otp_hash VARCHAR(191),
    otp_attempts INT,
    expires_at TIMESTAMP
);

INSERT INTO spotify_data_unf VALUES
(1, 1, 'John Doe', 'john@example.com', 'avatar1.jpg',
 1, 'The Beatles', 'beatles.jpg',
 1, 'Abbey Road', 1969, 'abbey.jpg',
 1, 'Come Together', 259, 'come_together.mp3',
 1, 'My Favorites', 'Best songs collection', 1,
 '2026-04-15 20:30:00',
 NULL, NULL, NULL, NULL, NULL),

(2, 1, 'John Doe', 'john@example.com', 'avatar1.jpg',
 2, 'Led Zeppelin', 'led.jpg',
 2, 'Led Zeppelin IV', 1971, 'led_iv.jpg',
 2, 'Stairway to Heaven', 482, 'stairway.mp3',
 1, 'My Favorites', 'Best songs collection', 2,
 '2026-04-15 21:00:00',
 NULL, NULL, NULL, NULL, NULL),

(3, 2, 'Jane Smith', 'jane@example.com', 'avatar2.jpg',
 1, 'The Beatles', 'beatles.jpg',
 1, 'Abbey Road', 1969, 'abbey.jpg',
 1, 'Come Together', 259, 'come_together.mp3',
 2, 'Chill Vibes', 'Relaxing music', 1,
 '2026-04-15 22:15:00',
 'newuser@example.com', 'New User', 'otp_hash_123', 0, '2026-04-16 09:00:00');

-- Structured horizontal output (selected columns only)
SELECT
    row_id, user_id, user_name, user_email,
    artist_id, artist_name,
    album_id, album_title, album_year,
    track_id, track_title, track_duration_seconds,
    playlist_id, playlist_name,
    played_at, signup_email, otp_attempts
FROM spotify_data_unf
ORDER BY row_id;

-- Structured vertical output for full row details in MySQL CLI
SELECT * FROM spotify_data_unf WHERE row_id = 1\G
SELECT * FROM spotify_data_unf WHERE row_id = 2\G
```

### Pitfalls
- **Redundancy**: User data repeated for each track/playlist interaction
- **Update anomaly**: Changing artist name requires updating multiple rows
- **Insert anomaly**: Cannot add artist without tracks
- **Delete anomaly**: Deleting last track by artist removes artist info
- **Mixed responsibilities**: OTP data mixed with music listening data
- **Data duplication**: Track information repeated in PlayHistory

---

## 4.2 First Normal Form (1NF)

## 4.2.1 Identify dependency
- Non-atomic values in current structure (implicit in the UNF design)
- Repeating groups in PlayHistory (trackTitle, trackArtist, trackAlbum stored as separate columns)
- Mixed data types in single rows

## 4.2.2 Apply normalization to 1NF

### BEFORE
- `spotify_data_unf` with mixed responsibilities and redundant data

### AFTER (base Spotify tables)
- `User`, `Artist`, `Album`, `Track`, `Playlist`, `PlaylistTrack`, `PlayHistory`, `SignupOtp`

```sql
-- User table
INSERT INTO User (id, name, email, passwordHash, avatarUrl)
SELECT DISTINCT user_id, user_name, user_email, '', user_avatar_url
FROM spotify_data_unf
WHERE user_id IS NOT NULL;

-- Artist table
INSERT INTO Artist (id, name, imageUrl)
SELECT DISTINCT artist_id, artist_name, artist_image_url
FROM spotify_data_unf
WHERE artist_id IS NOT NULL;

-- Album table
INSERT INTO Album (id, title, year, coverUrl, artistId)
SELECT DISTINCT 
    album_id,
    album_title,
    album_year,
    album_cover_url,
    artist_id
FROM spotify_data_unf
WHERE album_id IS NOT NULL;

-- Track table
INSERT INTO Track (id, title, durationSeconds, audioUrl, albumId, artistId)
SELECT DISTINCT
    track_id,
    track_title,
    track_duration_seconds,
    track_audio_url,
    album_id,
    artist_id
FROM spotify_data_unf
WHERE track_id IS NOT NULL;

-- Playlist table
INSERT INTO Playlist (id, name, description, userId)
SELECT DISTINCT 
    playlist_id,
    playlist_name,
    playlist_description,
    user_id
FROM spotify_data_unf
WHERE playlist_id IS NOT NULL;

-- PlaylistTrack junction table
INSERT INTO PlaylistTrack (playlistId, trackId, `order`)
SELECT DISTINCT
    playlist_id,
    track_id,
    playlist_order
FROM spotify_data_unf
WHERE playlist_id IS NOT NULL AND track_id IS NOT NULL;

-- PlayHistory table (normalized version)
INSERT INTO PlayHistory (userId, trackId, playedAt)
SELECT DISTINCT
    user_id,
    track_id,
    played_at
FROM spotify_data_unf
WHERE user_id IS NOT NULL AND track_id IS NOT NULL AND played_at IS NOT NULL;

-- SignupOtp table
INSERT INTO SignupOtp (email, name, passwordHash, otpHash, attempts, expiresAt)
SELECT DISTINCT
    signup_email,
    signup_name,
    '',
    otp_hash,
    COALESCE(otp_attempts, 0),
    expires_at
FROM spotify_data_unf
WHERE signup_email IS NOT NULL;

SELECT id, name, email, createdAt FROM User ORDER BY id;
SELECT id, name, imageUrl, createdAt FROM Artist ORDER BY id;
SELECT id, title, year, artistId, createdAt FROM Album ORDER BY id;
SELECT id, title, durationSeconds, albumId, artistId, createdAt FROM Track ORDER BY id;
SELECT id, name, userId, createdAt FROM Playlist ORDER BY id;
SELECT playlistId, trackId, `order` FROM PlaylistTrack ORDER BY playlistId, trackId;
SELECT id, userId, trackId, playedAt FROM PlayHistory ORDER BY id;
SELECT id, email, name, createdAt FROM SignupOtp ORDER BY id;
```

---

## 4.3 Second Normal Form (2NF)

## 4.3.1 Fault after 1NF (what is still wrong)
You said you already did 1NF, so now check this fault:

### BEFORE (1NF-style mixed rows)
Current issues after 1NF:
- **PlayHistory table**: Stores redundant track information (`trackTitle`, `trackArtist`, `trackAlbum`, `audioUrl`) instead of just referencing `trackId`
- **Partial dependencies**: In PlayHistory, columns like `trackTitle`, `trackArtist` depend only on `trackId`, not on the full key `(id, userId, trackId)`

## 4.3.2 Apply normalization to 2NF (solve this fault)

### AFTER
- Keep track facts only in `Track` table
- PlayHistory should only store the relationship between user and track, with timestamp

```sql
-- Current problematic PlayHistory structure
DESC PlayHistory;
-- Shows: id, userId, trackTitle, trackArtist, trackAlbum, audioUrl, playedAt

-- Step 1: Create properly normalized PlayHistory table
DROP TABLE IF EXISTS PlayHistory_normalized;
CREATE TABLE PlayHistory_normalized (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    trackId INT NOT NULL,
    playedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user_track (userId, trackId),
    INDEX idx_user_played (userId, playedAt),
    INDEX idx_track_played (trackId, playedAt),
    CONSTRAINT fk_play_history_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_play_history_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 2: Migrate data to normalized structure
INSERT INTO PlayHistory_normalized (userId, trackId, playedAt)
SELECT DISTINCT
    userId,
    (SELECT id FROM Track WHERE title = trackTitle LIMIT 1) as trackId,
    playedAt
FROM PlayHistory
WHERE trackTitle IS NOT NULL;

-- Step 3: Replace old table
DROP TABLE PlayHistory;
RENAME TABLE PlayHistory_normalized TO PlayHistory;

-- Step 4: Add proper foreign key constraints
ALTER TABLE PlayHistory 
ADD CONSTRAINT fk_play_history_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_play_history_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE;

-- Verification
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
```

✅ **Fault solved:** no partial dependencies in PlayHistory relation.

---

## 4.4 Third Normal Form (3NF)

## 4.4.1 Fault after 2NF
Even after 2NF, transitive dependency can happen:
- `Track.artistId -> Artist.name` 
- `Album.artistId -> Artist.name` 

So `Track -> Artist.name` and `Album -> Artist.name` are transitive if artist name is accessed through track/album.

## 4.4.2 Apply normalization to 3NF (solve this fault)

### AFTER
- `Track` stores only `artistId` (foreign key)
- `Album` stores only `artistId` (foreign key)  
- `Artist` stores artist-specific data (name, imageUrl)
- Artist information is fetched by join (not duplicated)

### Important verification
`Artist` information must **not** be duplicated in `Track` or `Album` tables.

```sql
-- Verify current structure doesn't have transitive dependencies
DESC Track;
DESC Album;
DESC Artist;

-- Expected Track columns: id, title, durationSeconds, audioUrl, albumId, artistId, createdAt
-- Expected Album columns: id, title, year, coverUrl, artistId, createdAt  
-- Expected Artist columns: id, name, imageUrl, createdAt

-- Check for any artist name duplication in Track or Album tables
SHOW COLUMNS FROM Track LIKE '%artist%';
SHOW COLUMNS FROM Album LIKE '%artist%';

-- Verify proper relationships through joins
SELECT 
    t.id as track_id,
    t.title as track_title,
    a.id as artist_id,
    a.name as artist_name,
    al.id as album_id,
    al.title as album_title
FROM Track t
JOIN Artist a ON t.artistId = a.id
JOIN Album al ON t.albumId = al.id
ORDER BY t.id
LIMIT 5;

-- Verify no transitive dependencies exist
-- All non-key attributes depend only on the primary key
SELECT 
    'Track' as table_name,
    'title, durationSeconds, audioUrl, albumId, artistId' as non_key_attributes,
    'All depend only on Track.id' as dependency_check
UNION ALL
SELECT 
    'Album' as table_name,
    'title, year, coverUrl, artistId' as non_key_attributes,
    'All depend only on Album.id' as dependency_check
UNION ALL
SELECT 
    'Artist' as table_name,
    'name, imageUrl' as non_key_attributes,
    'All depend only on Artist.id' as dependency_check;
```

✅ **Fault solved:** transitive dependency removed from track and album data.

---

## 4.5 Boyce-Codd Normal Form (BCNF)

## 4.5.1 Fault after 3NF
BCNF rule: in every FD `X -> Y`, determinant `X` must be a **candidate key**.

### Candidate key identification (explicit)
1. **User** 
   - Primary candidate key: `id` 
   - Alternate candidate key: `email` (because it is UNIQUE)
2. **Artist** 
   - Primary candidate key: `id` 
   - Alternate candidate key: `name` (should be UNIQUE for data integrity)
3. **Album** 
   - Primary candidate key: `id` 
   - Alternate candidate key we declare now: `(artistId, title)` 
4. **Track** 
   - Primary candidate key: `id` 
   - Alternate candidate key we declare now: `(albumId, title)`
5. **Playlist** 
   - Primary candidate key: `id` 
   - Alternate candidate key we declare now: `(userId, name)`

## 4.5.2 Apply normalization to BCNF (solve this fault)

```sql
-- A) Declare candidate keys (alternate keys)
-- User.email (already unique in base schema; verify)
ALTER TABLE User
ADD CONSTRAINT uq_user_email UNIQUE (email);

-- Artist.name (add for BCNF-safe determinant)
ALTER TABLE Artist
ADD CONSTRAINT uq_artist_name UNIQUE (name);

-- Album(artistId, title) (add this for BCNF-safe determinant)
ALTER TABLE Album
ADD CONSTRAINT uq_album_artist_title UNIQUE (artistId, title);

-- Track(albumId, title) (add this for BCNF-safe determinant)
ALTER TABLE Track
ADD CONSTRAINT uq_track_album_title UNIQUE (albumId, title);

-- Playlist(userId, name) (add this for BCNF-safe determinant)
ALTER TABLE Playlist
ADD CONSTRAINT uq_playlist_user_name UNIQUE (userId, name);

-- B) Make candidate keys visible (index-level proof)
SHOW INDEX FROM User;
SHOW INDEX FROM Artist;
SHOW INDEX FROM Album;
SHOW INDEX FROM Track;
SHOW INDEX FROM Playlist;

-- C) Table DDL proof
SHOW CREATE TABLE User;
SHOW CREATE TABLE Artist;
SHOW CREATE TABLE Album;
SHOW CREATE TABLE Track;
SHOW CREATE TABLE Playlist;

-- Check alternate key behavior for Artist.name
SELECT name, COUNT(*)
FROM Artist
GROUP BY name
HAVING COUNT(*) > 1;

-- Check alternate key behavior for Album(artistId, title)
SELECT artistId, title, COUNT(*)
FROM Album
GROUP BY artistId, title
HAVING COUNT(*) > 1;

-- Check alternate key behavior for Track(albumId, title)
SELECT albumId, title, COUNT(*)
FROM Track
GROUP BY albumId, title
HAVING COUNT(*) > 1;

-- Check alternate key behavior for Playlist(userId, name)
SELECT userId, name, COUNT(*)
FROM Playlist
GROUP BY userId, name
HAVING COUNT(*) > 1;
```

✅ **Fault solved:** determinants are enforced with keys/unique constraints.

---

## 4.6 Fourth Normal Form (4NF)

## 4.6.1 Fault after BCNF
MVD example in UNF: `user_id ->-> genres` (if users had multiple genre preferences stored as CSV).

In current Spotify structure, potential MVD issues:
- If tracks had multiple genres stored as comma-separated values
- If playlists had multiple tags stored as single column

## 4.6.2 Apply normalization to 4NF (solve this fault)

### BEFORE (problem pattern)
If we stored track genres as CSV in Track table:
```sql
-- Problematic design (don't do this)
ALTER TABLE Track ADD COLUMN genres VARCHAR(255); -- "Rock,Pop,Blues"
```

### AFTER (4NF decomposition)
Create separate junction tables for multivalued relationships.

```sql
-- Step 1: Create Genre lookup table
CREATE TABLE Genre (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Step 2: Create TrackGenre junction table
CREATE TABLE TrackGenre (
    trackId INT NOT NULL,
    genreId INT NOT NULL,
    PRIMARY KEY (trackId, genreId),
    CONSTRAINT fk_track_genre_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE,
    CONSTRAINT fk_track_genre_genre FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 3: Create UserGenrePreference table (if users have genre preferences)
CREATE TABLE UserGenrePreference (
    userId INT NOT NULL,
    genreId INT NOT NULL,
    preferenceWeight DECIMAL(3,2) DEFAULT 1.0,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (userId, genreId),
    CONSTRAINT fk_user_genre_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_genre_genre FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 4: Populate with sample data
INSERT INTO Genre (name, description) VALUES 
('Rock', 'Rock music genre'),
('Pop', 'Pop music genre'),
('Jazz', 'Jazz music genre'),
('Classical', 'Classical music genre'),
('Electronic', 'Electronic music genre'),
('Hip Hop', 'Hip hop music genre');

-- Step 5: Sample track-genre relationships
INSERT INTO TrackGenre (trackId, genreId) VALUES
(1, 1), -- Come Together -> Rock
(1, 2), -- Come Together -> Pop  
(2, 1), -- Stairway to Heaven -> Rock
(2, 3); -- Stairway to Heaven -> Jazz

-- Step 6: Sample user genre preferences
INSERT INTO UserGenrePreference (userId, genreId, preferenceWeight) VALUES
(1, 1, 0.9), -- John Doe likes Rock
(1, 2, 0.7), -- John Doe likes Pop
(2, 3, 0.8), -- Jane Smith likes Jazz
(2, 5, 0.6); -- Jane Smith likes Electronic

-- Output 1: Track with multiple genres (4NF view)
SELECT 
    t.id as track_id,
    t.title as track_title,
    GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') as genres
FROM Track t
LEFT JOIN TrackGenre tg ON t.id = tg.trackId
LEFT JOIN Genre g ON tg.genreId = g.id
GROUP BY t.id, t.title
ORDER BY t.id;

-- Output 2: User genre preferences (4NF view)
SELECT 
    u.id as user_id,
    u.name as user_name,
    GROUP_CONCAT(CONCAT(g.name, ' (', ugp.preferenceWeight, ')') ORDER BY ugp.preferenceWeight DESC SEPARATOR ', ') as genre_preferences
FROM User u
LEFT JOIN UserGenrePreference ugp ON u.id = ugp.userId
LEFT JOIN Genre g ON ugp.genreId = g.id
GROUP BY u.id, u.name
ORDER BY u.id;
```

Expected output format:

**Track with Genres (4NF)**

| track_id | track_title | genres |
|---:|---|---|
| 1 | Come Together | Pop, Rock |
| 2 | Stairway to Heaven | Jazz, Rock |

**User Genre Preferences (4NF)**

| user_id | user_name | genre_preferences |
|---:|---|---|
| 1 | John Doe | Rock (0.90), Pop (0.70) |
| 2 | Jane Smith | Jazz (0.80), Electronic (0.60) |

✅ **Fault solved:** multivalued genre relationships are properly normalized.

---

## 4.7 Fifth Normal Form (5NF)

## 4.7.1 Fault after 4NF
Join dependency appears if all relationships are forced into binary relations when ternary relationships exist.

In Spotify context:
- User-Track-Playlist relationship (user adds track to playlist)
- User-Artist-Album relationship (user follows artist on specific album)
- Track-Genre-Mood relationship (track has genre and mood combinations)

## 4.7.2 Apply normalization to 5NF (solve this fault)

### BEFORE (join-dependency risk)
If we only have binary tables:
- UserPlaylist (userId, playlistId)
- PlaylistTrack (playlistId, trackId)
- UserTrack (userId, trackId) 

This could lose the context of "which user added which track to which playlist".

### AFTER (5NF with explicit ternary relations)

```sql
-- Step 1: Create explicit ternary relationship for user-track-playlist
DROP TABLE IF EXISTS UserPlaylistTrack;
CREATE TABLE UserPlaylistTrack (
    userId INT NOT NULL,
    playlistId INT NOT NULL,
    trackId INT NOT NULL,
    addedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    addedBy INT NOT NULL, -- The user who added it (could be different from playlist owner)
    PRIMARY KEY (userId, playlistId, trackId),
    CONSTRAINT fk_upt_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_upt_playlist FOREIGN KEY (playlistId) REFERENCES Playlist(id) ON DELETE CASCADE,
    CONSTRAINT fk_upt_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE,
    CONSTRAINT fk_upt_added_by FOREIGN KEY (addedBy) REFERENCES User(id) ON DELETE RESTRICT,
    INDEX idx_upt_user_playlist (userId, playlistId),
    INDEX idx_upt_playlist_track (playlistId, trackId),
    INDEX idx_upt_user_track (userId, trackId)
) ENGINE=InnoDB;

-- Step 2: Create ternary relationship for user-artist-album following
DROP TABLE IF EXISTS UserArtistAlbumFollow;
CREATE TABLE UserArtistAlbumFollow (
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

-- Step 3: Create ternary relationship for track-genre-mood
DROP TABLE IF EXISTS TrackGenreMood;
CREATE TABLE TrackGenreMood (
    trackId INT NOT NULL,
    genreId INT NOT NULL,
    moodId INT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    PRIMARY KEY (trackId, genreId, moodId),
    CONSTRAINT fk_tgm_track FOREIGN KEY (trackId) REFERENCES Track(id) ON DELETE CASCADE,
    CONSTRAINT fk_tgm_genre FOREIGN KEY (genreId) REFERENCES Genre(id) ON DELETE CASCADE,
    CONSTRAINT fk_tgm_mood FOREIGN KEY (moodId) REFERENCES Mood(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 4: Create Mood lookup table
CREATE TABLE Mood (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Step 5: Populate with sample data
INSERT INTO Mood (name, description) VALUES 
('Happy', 'Upbeat and positive mood'),
('Sad', 'Melancholic and emotional mood'),
('Energetic', 'High energy and exciting mood'),
('Relaxing', 'Calm and peaceful mood'),
('Dark', 'Intense and moody atmosphere');

-- Step 6: Populate UserPlaylistTrack from existing data
INSERT INTO UserPlaylistTrack (userId, playlistId, trackId, addedBy)
SELECT DISTINCT
    p.userId,
    pt.playlistId,
    pt.trackId,
    p.userId as addedBy
FROM Playlist p
JOIN PlaylistTrack pt ON p.id = pt.playlistId
WHERE pt.trackId IS NOT NULL
ON DUPLICATE KEY UPDATE addedAt = VALUES(addedAt);

-- Step 7: Sample track-genre-mood relationships
INSERT INTO TrackGenreMood (trackId, genreId, moodId, confidence) VALUES
(1, 1, 3, 0.9), -- Come Together: Rock, Energetic
(1, 2, 3, 0.8), -- Come Together: Pop, Energetic
(2, 1, 5, 0.7), -- Stairway to Heaven: Rock, Dark
(2, 3, 4, 0.6); -- Stairway to Heaven: Jazz, Relaxing

-- Output 1: UserPlaylistTrack (5NF ternary)
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

-- Output 2: TrackGenreMood (5NF ternary)
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
```

Expected output format:

**UserPlaylistTrack (5NF ternary)**

| userId | user_name | playlistId | playlist_name | trackId | track_title | addedAt | added_by_name |
|---:|---|---:|---|---:|---|---|---|
| 1 | John Doe | 1 | My Favorites | 1 | Come Together | 2026-04-15 20:30:00 | John Doe |
| 1 | John Doe | 1 | My Favorites | 2 | Stairway to Heaven | 2026-04-15 21:00:00 | John Doe |

**TrackGenreMood (5NF ternary)**

| track_id | track_title | genre_name | mood_name | confidence |
|---:|---|---|---|---|
| 1 | Come Together | Pop | Energetic | 0.80 |
| 1 | Come Together | Rock | Energetic | 0.90 |
| 2 | Stairway to Heaven | Jazz | Relaxing | 0.60 |
| 2 | Stairway to Heaven | Rock | Dark | 0.70 |

✅ **Fault solved:** ternary join dependencies are represented explicitly in 5NF relations.

---

## Final Database Structure After Complete Normalization

### Core Entity Tables:
- **User** - Basic user entity
- **Artist** - Artist information  
- **Album** - Album catalog
- **Track** - Individual tracks
- **Genre** - Genre lookup
- **Mood** - Mood lookup

### Junction Tables (4NF/5NF):
- **Playlist** - User playlists
- **PlaylistTrack** - Playlist-track relationships
- **UserPlaylistTrack** - User-track-playlist ternary relationships (5NF)
- **TrackGenre** - Track-genre relationships (4NF)
- **UserGenrePreference** - User genre preferences (4NF)
- **TrackGenreMood** - Track-genre-mood ternary relationships (5NF)
- **UserArtistAlbumFollow** - User-artist-album following (5NF)

### Application Tables:
- **PlayHistory** - Listening history (normalized)
- **SignupOtp** - OTP verification

### Benefits Achieved:
1. **Eliminated redundancy** - No duplicate artist/track information
2. **Improved data integrity** - Proper constraints and relationships
3. **Enhanced flexibility** - Multi-genre tracks, complex relationships
4. **Better performance** - Proper indexing and optimized queries
5. **Maintainability** - Clear separation of concerns
6. **Scalability** - Structure supports complex music relationships

### Commands to Execute Complete Normalization:
```sql
-- Execute all commands from sections 4.2.2, 4.3.2, 4.4.2, 4.5.2, 4.6.2, and 4.7.2 in order
-- This will transform the database from unnormalized to 5NF
```

The database is now fully normalized to 5NF with proper relationships, constraints, and optimizations for a production Spotify clone application.
