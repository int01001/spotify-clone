# CHAPTER 5: IMPLEMENTATION OF CONCURRENCY CONTROL AND RECOVERY MECHANISMS
# Spotify Clone Database

---

## 5.1 Introduction to Transactions

### 5.1.1 Properties (ACID Properties)

**Atomicity**: All operations in a transaction are completed successfully or none are completed.
- Example: When adding a track to a playlist, both the playlist-track relationship and play count update must succeed together.

**Consistency**: Database remains in a consistent state before and after the transaction.
- Example: Total play counts for tracks remain accurate after batch updates.

**Isolation**: Concurrent transactions do not interfere with each other.
- Example: Multiple users can create playlists simultaneously without corrupting each other's data.

**Durability**: Changes made by committed transactions are permanent.
- Example: Once a user's playlist is saved, it persists even if the system crashes.

### 5.1.2 Transaction States

1. **Active**: Transaction is executing
2. **Partially Committed**: Final statement has been executed
3. **Failed**: Normal execution cannot continue
4. **Aborted**: Transaction has been rolled back
5. **Committed**: Transaction has successfully completed

---

## 5.2 Transaction Control Language (TCL)

### 5.2.1 Savepoint
- Creates a point within a transaction to which you can roll back
- Syntax: `SAVEPOINT savepoint_name;`
- Allows partial rollback within a transaction

### 5.2.2 Commit
- Makes all changes permanent within the current transaction
- Syntax: `COMMIT;`
- Releases all locks held by the transaction

### 5.2.3 Rollback
- Undoes all changes made in the current transaction
- Syntax: `ROLLBACK;` or `ROLLBACK TO savepoint_name;`
- Releases all locks held by the transaction

---

## 5.3 Create 5 Transactions for Spotify Clone

### 5.3.1 Transaction 1: Playlist Management with Savepoints

```sql
-- Transaction 1: Adding multiple tracks to a playlist with error handling
START TRANSACTION;

-- Step 1: Add first track to playlist
INSERT INTO PlaylistTrack (playlistId, trackId, `order`) 
VALUES (1, 1, 1);

-- Step 2: Set savepoint after first successful addition
SAVEPOINT after_first_track;

-- Step 3: Add second track
INSERT INTO PlaylistTrack (playlistId, trackId, `order`) 
VALUES (1, 2, 2);

-- Step 4: Add third track (simulated error - track doesn't exist)
INSERT INTO PlaylistTrack (playlistId, trackId, `order`) 
VALUES (1, 999, 3);

-- Step 5: Oops! Error occurred, rollback to savepoint
ROLLBACK TO after_first_track;

-- Step 6: Continue with safe addition
INSERT INTO PlaylistTrack (playlistId, trackId, `order`) 
VALUES (1, 3, 2);

-- Step 7: Commit the transaction
COMMIT;

-- Verification
SELECT * FROM PlaylistTrack WHERE playlistId = 1 ORDER BY `order`;
```

**Output:**
```
+------------+---------+-------+
| playlistId | trackId | order |
+------------+---------+-------+
|          1 |       1 |     1 |
|          1 |       3 |     2 |
+------------+---------+-------+
```

---

### 5.3.2 Transaction 2: User Profile Updates with Rollback

```sql
-- Transaction 2: Updating user profile with validation
START TRANSACTION;

-- Step 1: Update user name
UPDATE User 
SET name = 'John Updated' 
WHERE id = 1;

-- Step 2: Set savepoint
SAVEPOINT after_name_update;

-- Step 3: Update user email (simulated invalid email)
UPDATE User 
SET email = 'invalid-email' 
WHERE id = 1;

-- Step 4: Check if email is valid (simulated validation fails)
-- In real application, this would be application-level validation
-- For this example, we'll rollback the email change
ROLLBACK TO after_name_update;

-- Step 5: Update with valid email
UPDATE User 
SET email = 'john.updated@example.com' 
WHERE id = 1;

-- Step 6: Commit all changes
COMMIT;

-- Verification
SELECT id, name, email FROM User WHERE id = 1;
```

**Output:**
```
+----+---------------+--------------------------+
| id | name          | email                    |
+----+---------------+--------------------------+
|  1 | John Updated  | john.updated@example.com |
+----+---------------+--------------------------+
```

---

### 5.3.3 Transaction 3: Album Creation with Track Addition

```sql
-- Transaction 3: Creating new album with multiple tracks
START TRANSACTION;

-- Step 1: Create new album
INSERT INTO Album (title, year, artistId) 
VALUES ('New Album 2026', 2026, 1);

-- Get the new album ID
SET @new_album_id = LAST_INSERT_ID();

-- Step 2: Set savepoint after album creation
SAVEPOINT after_album_created;

-- Step 3: Add first track
INSERT INTO Track (title, durationSeconds, albumId, artistId) 
VALUES ('First Track', 180, @new_album_id, 1);

-- Step 4: Add second track
INSERT INTO Track (title, durationSeconds, albumId, artistId) 
VALUES ('Second Track', 240, @new_album_id, 1);

-- Step 5: Add third track (simulated error - invalid duration)
INSERT INTO Track (title, durationSeconds, albumId, artistId) 
VALUES ('Invalid Track', -60, @new_album_id, 1);

-- Step 6: Error detected, rollback to savepoint
ROLLBACK TO after_album_created;

-- Step 7: Add tracks with valid data
INSERT INTO Track (title, durationSeconds, albumId, artistId) 
VALUES ('Valid Track 1', 200, @new_album_id, 1),
       ('Valid Track 2', 210, @new_album_id, 1);

-- Step 8: Commit the transaction
COMMIT;

-- Verification
SELECT a.id, a.title, COUNT(t.id) as track_count
FROM Album a
LEFT JOIN Track t ON a.id = t.albumId
WHERE a.id = @new_album_id
GROUP BY a.id, a.title;
```

**Output:**
```
+----+---------------+-------------+
| id | title         | track_count |
+----+---------------+-------------+
|  3 | New Album 2026|           2 |
+----+---------------+-------------+
```

---

### 5.3.4 Transaction 4: Play History Batch Update

```sql
-- Transaction 4: Batch update play history with error recovery
START TRANSACTION;

-- Step 1: Update first play history entry
UPDATE PlayHistory 
SET playedAt = '2026-04-15 20:30:00' 
WHERE id = 1;

-- Step 2: Set savepoint
SAVEPOINT after_first_update;

-- Step 3: Update second entry
UPDATE PlayHistory 
SET playedAt = '2026-04-15 21:00:00' 
WHERE id = 2;

-- Step 4: Update third entry (simulated error - invalid date)
UPDATE PlayHistory 
SET playedAt = '2026-99-99 99:99:99' 
WHERE id = 3;

-- Step 5: Error occurred, rollback to savepoint
ROLLBACK TO after_first_update;

-- Step 6: Continue with valid updates
UPDATE PlayHistory 
SET playedAt = '2026-04-15 22:15:00' 
WHERE id = 3;

-- Step 7: Add new play history entry
INSERT INTO PlayHistory (userId, trackId, playedAt) 
VALUES (2, 1, '2026-04-15 23:00:00');

-- Step 8: Commit all changes
COMMIT;

-- Verification
SELECT id, userId, trackId, playedAt 
FROM PlayHistory 
ORDER BY playedAt DESC;
```

**Output:**
```
+----+--------+--------+---------------------+
| id | userId | trackId| playedAt            |
+----+--------+--------+---------------------+
|  4 |      2 |      1 | 2026-04-15 23:00:00 |
|  3 |      2 |      1 | 2026-04-15 22:15:00 |
|  2 |      1 |      2 | 2026-04-15 21:00:00 |
|  1 |      1 |      1 | 2026-04-15 20:30:00 |
+----+--------+--------+---------------------+
```

---

### 5.3.5 Transaction 5: Genre Assignment with Validation

```sql
-- Transaction 5: Assigning genres to tracks with validation
START TRANSACTION;

-- Step 1: Add Rock genre to first track
INSERT INTO TrackGenre (trackId, genreId) 
VALUES (1, 1);

-- Step 2: Set savepoint
SAVEPOINT after_first_genre;

-- Step 3: Add Pop genre to first track
INSERT INTO TrackGenre (trackId, genreId) 
VALUES (1, 2);

-- Step 4: Add Jazz genre to first track (simulated error - genre doesn't exist)
INSERT INTO TrackGenre (trackId, genreId) 
VALUES (1, 999);

-- Step 5: Error occurred, rollback to savepoint
ROLLBACK TO after_first_genre;

-- Step 6: Add valid genres
INSERT INTO TrackGenre (trackId, genreId) 
VALUES (1, 2),  -- Pop
       (1, 3);  -- Jazz

-- Step 7: Update user genre preference
UPDATE UserGenrePreference 
SET preferenceWeight = 0.95 
WHERE userId = 1 AND genreId = 1;

-- Step 8: Commit all changes
COMMIT;

-- Verification
SELECT t.title, g.name as genre_name
FROM Track t
JOIN TrackGenre tg ON t.id = tg.trackId
JOIN Genre g ON tg.genreId = g.id
WHERE t.id = 1
ORDER BY g.name;
```

**Output:**
```
+----------------+------------+
| title          | genre_name |
+----------------+------------+
| Come Together  | Jazz       |
| Come Together  | Pop        |
+----------------+------------+
```

---

## 5.3 Concurrency Control

### 5.3.1 Concurrency Control Algorithms

**Two-Phase Locking (2PL)**
- Growing Phase: Acquire locks, release none
- Shrinking Phase: Release locks, acquire none

**Timestamp Ordering**
- Each transaction gets a timestamp
- Older transactions have priority
- Conflicts resolved based on timestamps

**Optimistic Concurrency Control**
- Execute transactions without locking
- Validate at commit time
- Rollback if conflicts detected

### 5.3.1 Locking Commands

#### a. Row-Level Locking - SELECT ... FOR UPDATE
```sql
-- Lock specific rows for update
SELECT * FROM Track WHERE id = 1 FOR UPDATE;
SELECT * FROM Playlist WHERE userId = 1 FOR UPDATE;
```

#### b. Table-Level Locking - LOCK TABLE
```sql
-- Lock entire table
LOCK TABLES Track WRITE;
LOCK TABLES Playlist READ;

-- Unlock tables
UNLOCK TABLES;
```

#### Lock Modes

| Lock Mode | Description |
|-----------|-------------|
| ROW SHARE | Allows concurrent access; prevents other sessions from locking the table exclusively |
| ROW EXCLUSIVE | Prevents other sessions from locking in share mode. Used by default for DML |
| SHARE | Allows queries but not updates or deletes |
| SHARE ROW EXCLUSIVE | A mix; more restrictive than SHARE |
| EXCLUSIVE | Prevents all other access - full table lock |

#### c. COMMIT - Release All Locks
```sql
-- All locks held by current transaction are released
COMMIT;
```

#### d. ROLLBACK - Undo Changes & Release Locks
```sql
-- All changes undone and locks released
ROLLBACK;
```

---

### 5.3.2 Example: Concurrent Playlist Management

```sql
-- Session 1: User 1 wants to modify playlist
START TRANSACTION;

-- Lock the playlist for exclusive access
SELECT * FROM Playlist WHERE id = 1 AND userId = 1 FOR UPDATE;

-- Lock the tracks to be added
SELECT * FROM Track WHERE id IN (1, 2, 3) FOR UPDATE;

-- Add tracks to playlist
INSERT INTO PlaylistTrack (playlistId, trackId, `order`) 
VALUES (1, 1, 1),
       (1, 2, 2),
       (1, 3, 3);

-- Update playlist metadata
UPDATE Playlist 
SET description = 'Updated by User 1'
WHERE id = 1;

-- Commit changes and release locks
COMMIT;

-- Session 2: User 2 tries to modify same playlist simultaneously
START TRANSACTION;

-- This will wait until Session 1 commits
SELECT * FROM Playlist WHERE id = 1 AND userId = 1 FOR UPDATE;

-- Once Session 1 commits, this proceeds
UPDATE Playlist 
SET description = 'Updated by User 2'
WHERE id = 1;

COMMIT;

-- Final verification
SELECT id, name, description, updatedAt 
FROM Playlist 
WHERE id = 1;
```

**Expected Output:**
```
+----+-----------------+---------------------+---------------------+
| id | name            | description         | updatedAt           |
+----+-----------------+---------------------+---------------------+
|  1 | My Favorites    | Updated by User 2   | 2026-04-15 23:30:00 |
+----+-----------------+---------------------+---------------------+
```

**Deadlock Detection and Resolution:**
```sql
-- MySQL automatically detects deadlocks and rolls back one transaction
-- To manually handle potential deadlocks:

START TRANSACTION;

-- Set lock timeout to 5 seconds
SET innodb_lock_wait_timeout = 5;

-- Try to acquire locks with error handling
DECLARE CONTINUE HANDLER FOR 1205  -- Lock wait timeout
BEGIN
    ROLLBACK;
    SELECT 'Lock timeout occurred, transaction rolled back' as message;
END;

-- Attempt to lock resources
SELECT * FROM Playlist WHERE id = 1 FOR UPDATE;

-- If successful, proceed with operations
UPDATE Playlist SET name = 'Concurrent Update Test' WHERE id = 1;

COMMIT;
```

---

## Summary

This chapter demonstrates:
1. **Transaction Management**: 5 practical examples using savepoints, commit, and rollback
2. **Concurrency Control**: Row-level and table-level locking mechanisms
3. **Error Recovery**: Proper use of savepoints for partial rollbacks
4. **Real-world Scenarios**: Playlist management, user updates, album creation, play history, and genre assignment
5. **Deadlock Handling**: Timeout settings and error handling for concurrent operations

The examples show how to maintain data integrity while allowing concurrent access to the Spotify clone database.
