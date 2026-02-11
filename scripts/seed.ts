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
    { name: 'The Weeknd', imageUrl: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=600&q=60' },
    { name: 'Dua Lipa', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=60' },
    { name: 'ODESZA', imageUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=600&q=60' },
    { name: 'Fred again..', imageUrl: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=600&q=60' },
    { name: 'Billie Eilish', imageUrl: 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?auto=format&fit=crop&w=600&q=60' },
  ];

  const artists = await Promise.all(artistsSeed.map((artist) => prisma.artist.create({ data: artist })));
  const artistByName = new Map(artists.map((artist) => [artist.name, artist.id]));

  const albumsSeed = [
    {
      title: 'Dawn FM',
      coverUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=800&q=60',
      year: 2022,
      artistName: 'The Weeknd',
    },
    {
      title: 'Future Nostalgia',
      coverUrl: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=800&q=60',
      year: 2020,
      artistName: 'Dua Lipa',
    },
    {
      title: 'The Last Goodbye',
      coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=60',
      year: 2022,
      artistName: 'ODESZA',
    },
    {
      title: 'Actual Life 3',
      coverUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
      year: 2022,
      artistName: 'Fred again..',
    },
    {
      title: 'Hit Me Hard and Soft',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=60',
      year: 2024,
      artistName: 'Billie Eilish',
    },
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

  const tracksSeed = [
    { title: 'Take My Breath', durationSeconds: 339, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_3479c65d5f.mp3?filename=future-bass-11038.mp3', albumTitle: 'Dawn FM', artistName: 'The Weeknd' },
    { title: 'Out of Time', durationSeconds: 214, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/17/audio_1c260af3ab.mp3?filename=synthwave-ambient-12641.mp3', albumTitle: 'Dawn FM', artistName: 'The Weeknd' },
    { title: 'Less Than Zero', durationSeconds: 233, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/10/audio_63c9dd99df.mp3?filename=upbeat-electronic-11692.mp3', albumTitle: 'Dawn FM', artistName: 'The Weeknd' },
    { title: 'Levitating', durationSeconds: 203, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/15/audio_5eb66cbdc5.mp3?filename=edm-party-12612.mp3', albumTitle: 'Future Nostalgia', artistName: 'Dua Lipa' },
    { title: "Don't Start Now", durationSeconds: 183, audioUrl: 'https://cdn.pixabay.com/download/audio/2021/10/19/audio_5ae5a9af7e.mp3?filename=pop-funk-11254.mp3', albumTitle: 'Future Nostalgia', artistName: 'Dua Lipa' },
    { title: 'Hallucinate', durationSeconds: 226, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/23/audio_43e0cd8d1c.mp3?filename=dance-pop-11088.mp3', albumTitle: 'Future Nostalgia', artistName: 'Dua Lipa' },
    { title: 'Behind The Sun', durationSeconds: 240, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/31/audio_f36d994f31.mp3?filename=chill-electronic-11159.mp3', albumTitle: 'The Last Goodbye', artistName: 'ODESZA' },
    { title: 'Love Letter', durationSeconds: 216, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/02/audio_32f908db8b.mp3?filename=ambient-electronica-12279.mp3', albumTitle: 'The Last Goodbye', artistName: 'ODESZA' },
    { title: 'Delilah (pull me out of this)', durationSeconds: 206, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2f6f85edc1.mp3?filename=deep-house-11040.mp3', albumTitle: 'Actual Life 3', artistName: 'Fred again..' },
    { title: 'Bleu (better with time)', durationSeconds: 251, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4b5312d3fb.mp3?filename=summer-house-11039.mp3', albumTitle: 'Actual Life 3', artistName: 'Fred again..' },
    { title: 'Lunch', durationSeconds: 189, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/26/audio_aea6c299d4.mp3?filename=electro-pop-11463.mp3', albumTitle: 'Hit Me Hard and Soft', artistName: 'Billie Eilish' },
    { title: 'Birds of a Feather', durationSeconds: 195, audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/16/audio_6784be9b87.mp3?filename=dreamy-pop-12367.mp3', albumTitle: 'Hit Me Hard and Soft', artistName: 'Billie Eilish' },
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
      name: "Today's Vibes",
      description: 'Upbeat alt pop and dance to keep the energy high.',
      coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=60',
      tracks: ['Levitating', 'Delilah (pull me out of this)', 'Out of Time', 'Behind The Sun'],
    },
    {
      name: 'Late Night Drive',
      description: 'Moody synths and electronic cuts for neon highways.',
      coverUrl: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=800&q=60',
      tracks: ['Take My Breath', 'Less Than Zero', 'Love Letter', 'Birds of a Feather'],
    },
    {
      name: 'Focus Flow',
      description: 'Instrumental leaning electronica to get into deep work.',
      coverUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60',
      tracks: ['Behind The Sun', 'Bleu (better with time)', 'Hallucinate', "Don't Start Now"],
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
