const https = require('https');
const fs = require('fs');

const artistsToFetch = ['Taylor Swift', 'The Weeknd', 'Drake', 'Bad Bunny', 'Billie Eilish', 'Kendrick Lamar', 'Ariana Grande', 'Post Malone'];

function fetchTopSongs(artist) {
  return new Promise((resolve, reject) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=5`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).results);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function generateSeed() {
  let allTracks = [];
  for (const artist of artistsToFetch) {
    console.log(`Fetching ${artist}...`);
    const tracks = await fetchTopSongs(artist);
    allTracks = allTracks.concat(tracks);
  }

  const artistsMap = new Map();
  const albumsMap = new Map();
  const tracksList = [];

  for (const track of allTracks) {
    if (!track.artistName || !track.collectionName || !track.trackName || !track.previewUrl) continue;
    
    if (!artistsMap.has(track.artistName)) {
      artistsMap.set(track.artistName, {
        name: track.artistName,
        imageUrl: track.artworkUrl100.replace('100x100bb', '600x600bb')
      });
    }

    if (!albumsMap.has(track.collectionName)) {
      albumsMap.set(track.collectionName, {
        title: track.collectionName,
        coverUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        year: new Date(track.releaseDate).getFullYear(),
        artistName: track.artistName
      });
    }

    tracksList.push({
      title: track.trackName,
      durationSeconds: Math.round(track.trackTimeMillis / 1000),
      audioUrl: track.previewUrl,
      albumTitle: track.collectionName,
      artistName: track.artistName
    });
  }

  const artistsSeed = Array.from(artistsMap.values());
  const albumsSeed = Array.from(albumsMap.values());
  
  const seedFileContent = `import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type PlaylistSeed = {
  name: string;
  description: string;
  coverUrl: string;
  tracks: string[];
};

async function main() {
  console.log('Resetting tables...');
  await prisma.playlistTrack.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.track.deleteMany();
  await prisma.album.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: 'listener@spotifycc.test',
      name: 'Core Listener',
      passwordHash: bcrypt.hashSync('password123', 10),
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=60',
    },
  });

  const artistsSeed = ${JSON.stringify(artistsSeed, null, 2)};

  const artists = await Promise.all(artistsSeed.map((artist) => prisma.artist.create({ data: artist })));
  const artistByName = new Map(artists.map((artist) => [artist.name, artist.id]));

  const albumsSeed = ${JSON.stringify(albumsSeed, null, 2)};

  const albums = [];
  for (const album of albumsSeed) {
    const artistId = artistByName.get(album.artistName);
    if (!artistId) continue;
    const created = await prisma.album.create({
      data: {
        title: album.title,
        coverUrl: album.coverUrl,
        year: album.year,
        artistId,
      },
    });
    albums.push(created);
  }

  const albumByTitle = new Map(albums.map((album) => [album.title, album.id]));

  const tracksSeed = ${JSON.stringify(tracksList, null, 2)};

  const trackByTitle = new Map<string, number>();
  for (const track of tracksSeed) {
    const artistId = artistByName.get(track.artistName);
    const albumId = albumByTitle.get(track.albumTitle);
    if (!artistId || !albumId) continue;
    const created = await prisma.track.create({
      data: {
        title: track.title,
        durationSeconds: track.durationSeconds,
        audioUrl: track.audioUrl,
        albumId,
        artistId,
      },
    });
    // handle duplicate track titles by keeping the first or storing an array, but Map overrides it. It's fine for simple playlists.
    trackByTitle.set(track.title, created.id);
  }

  const allTrackTitles = tracksSeed.map(t => t.title);

  const playlistsSeed: PlaylistSeed[] = [
    {
      name: "Global Top Hits",
      description: 'The biggest songs in the world right now.',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b5?auto=format&fit=crop&w=800&q=60',
      tracks: allTrackTitles.slice(0, 10),
    },
    {
      name: 'Chill Vibes',
      description: 'Relax and unwind with these top tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=800&q=60',
      tracks: allTrackTitles.slice(10, 20),
    },
    {
      name: 'Party Time',
      description: 'Upbeat and energetic tracks to get the party started.',
      coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=60',
      tracks: allTrackTitles.slice(20, 30),
    },
  ];

  for (const playlist of playlistsSeed) {
    const created = await prisma.playlist.create({
      data: {
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl,
        userId: user.id,
      },
    });

    await prisma.playlistTrack.createMany({
      data: playlist.tracks
        .map((title, index) => {
          const trackId = trackByTitle.get(title);
          if (!trackId) return null;
          return {
            playlistId: created.id,
            trackId,
            order: index + 1,
          };
        })
        .filter(Boolean) as { playlistId: number; trackId: number; order: number }[],
    });
  }

  console.log('Seed data inserted.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  fs.writeFileSync('scripts/seed.ts', seedFileContent);
  console.log('Successfully generated scripts/seed.ts');
}

generateSeed().catch(console.error);
