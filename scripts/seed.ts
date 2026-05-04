import { PrismaClient } from '@prisma/client';
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

  const artistsSeed = [
    { name: 'Taylor Swift', imageUrl: 'https://images.unsplash.com/photo-1516280440502-a160ce39c4a0?auto=format&fit=crop&w=600&q=60' },
    { name: 'The Weeknd', imageUrl: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=600&q=60' },
    { name: 'Drake', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b5?auto=format&fit=crop&w=600&q=60' },
    { name: 'Bad Bunny', imageUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=600&q=60' },
    { name: 'Billie Eilish', imageUrl: 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?auto=format&fit=crop&w=600&q=60' },
    { name: 'Kendrick Lamar', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b5?auto=format&fit=crop&w=600&q=60' },
    { name: 'Ariana Grande', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=60' },
    { name: 'Post Malone', imageUrl: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=600&q=60' },
  ];

  const artists = await Promise.all(artistsSeed.map((artist) => prisma.artist.create({ data: artist })));
  const artistByName = new Map(artists.map((artist) => [artist.name, artist.id]));

  const albumsSeed = [
    { title: "1989 (Taylor's Version)", coverUrl: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=800&q=60', year: 2023, artistName: 'Taylor Swift' },
    { title: 'Midnights', coverUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60', year: 2022, artistName: 'Taylor Swift' },
    { title: 'Starboy', coverUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=800&q=60', year: 2016, artistName: 'The Weeknd' },
    { title: 'Scorpion', coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=60', year: 2018, artistName: 'Drake' },
    { title: 'Un Verano Sin Ti', coverUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=800&q=60', year: 2022, artistName: 'Bad Bunny' },
    { title: 'Hit Me Hard and Soft', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=60', year: 2024, artistName: 'Billie Eilish' },
    { title: 'DAMN.', coverUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60', year: 2017, artistName: 'Kendrick Lamar' },
    { title: 'Thank U, Next', coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=60', year: 2019, artistName: 'Ariana Grande' },
    { title: "Hollywood's Bleeding", coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b5?auto=format&fit=crop&w=800&q=60', year: 2019, artistName: 'Post Malone' },
  ];

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

  const sampleAudio1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const sampleAudio2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
  const sampleAudio3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
  const sampleAudio4 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3';
  const sampleAudio5 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3';

  const tracksSeed = [
    { title: 'Blank Space', durationSeconds: 231, audioUrl: sampleAudio1, albumTitle: "1989 (Taylor's Version)", artistName: 'Taylor Swift' },
    { title: 'Style', durationSeconds: 231, audioUrl: sampleAudio2, albumTitle: "1989 (Taylor's Version)", artistName: 'Taylor Swift' },
    { title: 'Shake It Off', durationSeconds: 219, audioUrl: sampleAudio3, albumTitle: "1989 (Taylor's Version)", artistName: 'Taylor Swift' },
    { title: 'Anti-Hero', durationSeconds: 200, audioUrl: sampleAudio4, albumTitle: 'Midnights', artistName: 'Taylor Swift' },
    { title: 'Karma', durationSeconds: 204, audioUrl: sampleAudio5, albumTitle: 'Midnights', artistName: 'Taylor Swift' },
    
    { title: 'Starboy', durationSeconds: 230, audioUrl: sampleAudio1, albumTitle: 'Starboy', artistName: 'The Weeknd' },
    { title: 'I Feel It Coming', durationSeconds: 228, audioUrl: sampleAudio2, albumTitle: 'Starboy', artistName: 'The Weeknd' },
    { title: 'Die For You', durationSeconds: 260, audioUrl: sampleAudio3, albumTitle: 'Starboy', artistName: 'The Weeknd' },
    
    { title: "God's Plan", durationSeconds: 198, audioUrl: sampleAudio4, albumTitle: 'Scorpion', artistName: 'Drake' },
    { title: 'In My Feelings', durationSeconds: 217, audioUrl: sampleAudio5, albumTitle: 'Scorpion', artistName: 'Drake' },
    { title: 'Nice For What', durationSeconds: 210, audioUrl: sampleAudio1, albumTitle: 'Scorpion', artistName: 'Drake' },

    { title: 'Me Porto Bonito', durationSeconds: 178, audioUrl: sampleAudio2, albumTitle: 'Un Verano Sin Ti', artistName: 'Bad Bunny' },
    { title: 'Tití Me Preguntó', durationSeconds: 243, audioUrl: sampleAudio3, albumTitle: 'Un Verano Sin Ti', artistName: 'Bad Bunny' },
    
    { title: 'Lunch', durationSeconds: 189, audioUrl: sampleAudio4, albumTitle: 'Hit Me Hard and Soft', artistName: 'Billie Eilish' },
    { title: 'Birds of a Feather', durationSeconds: 195, audioUrl: sampleAudio5, albumTitle: 'Hit Me Hard and Soft', artistName: 'Billie Eilish' },

    { title: 'HUMBLE.', durationSeconds: 177, audioUrl: sampleAudio1, albumTitle: 'DAMN.', artistName: 'Kendrick Lamar' },
    { title: 'DNA.', durationSeconds: 185, audioUrl: sampleAudio2, albumTitle: 'DAMN.', artistName: 'Kendrick Lamar' },

    { title: '7 rings', durationSeconds: 178, audioUrl: sampleAudio3, albumTitle: 'Thank U, Next', artistName: 'Ariana Grande' },
    { title: 'thank u, next', durationSeconds: 207, audioUrl: sampleAudio4, albumTitle: 'Thank U, Next', artistName: 'Ariana Grande' },

    { title: 'Circles', durationSeconds: 215, audioUrl: sampleAudio5, albumTitle: "Hollywood's Bleeding", artistName: 'Post Malone' },
    { title: 'Sunflower', durationSeconds: 158, audioUrl: sampleAudio1, albumTitle: "Hollywood's Bleeding", artistName: 'Post Malone' },
  ];

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
    trackByTitle.set(track.title, created.id);
  }

  const playlistsSeed: PlaylistSeed[] = [
    {
      name: "Global Top Hits",
      description: 'The biggest songs in the world right now.',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b5?auto=format&fit=crop&w=800&q=60',
      tracks: ['Anti-Hero', 'Starboy', "God's Plan", 'Me Porto Bonito', 'Lunch', 'HUMBLE.', '7 rings', 'Circles'],
    },
    {
      name: 'Chill Vibes',
      description: 'Relax and unwind with these top tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=800&q=60',
      tracks: ['Blank Space', 'I Feel It Coming', 'In My Feelings', 'Birds of a Feather', 'thank u, next', 'Sunflower'],
    },
    {
      name: 'Party Time',
      description: 'Upbeat and energetic tracks to get the party started.',
      coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=60',
      tracks: ['Shake It Off', 'Karma', 'Tití Me Preguntó', 'DNA.', 'Nice For What', 'Style', 'Die For You'],
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
