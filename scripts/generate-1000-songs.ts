import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const ADJECTIVES = [
  'Neon', 'Cosmic', 'Midnight', 'Electric', 'Silent', 'Crimson', 'Golden',
  'Lunar', 'Solar', 'Velvet', 'Crystal', 'Shadow', 'Phantom', 'Astral',
  'Mystic', 'Iron', 'Silver', 'Ruby', 'Sapphire', 'Emerald'
];

const NOUNS = [
  'Fox', 'Dreamer', 'Voyager', 'Echo', 'Horizon', 'Wave', 'Storm', 'Pulse',
  'Mirage', 'Rider', 'Nomad', 'Soul', 'Spirit', 'Vanguard', 'Pioneer',
  'Ghost', 'Wolf', 'Lion', 'Eagle', 'Dragon'
];

const ALBUM_TYPES = ['Vibes', 'Dreams', 'Memories', 'Anthems', 'Sessions', 'Chronicles', 'Tale', 'Journey', 'Symphony', 'Odyssey'];

const SOUNDHELIX_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
];

const UNSPLASH_IDS = [
  '1516280440502-a160ce39c4a0', '1513883049090-d0b7439799bf', '1493225457124-a1a2a5f5f4b5',
  '1507878866276-a947ef722fee', '1505682634904-d7c8d95cdc50', '1511671782779-c97d3d27a1d4',
  '1464375117522-1311d6a5b81f', '1464375117522-1311d6a5b81f', '1504384308090-c894fdcc538d',
  '1501612780327-45045538702b', '1511379938547-c1f69419868d', '1470225620780-dba8ba36b745',
  '1500530855697-b586d89ba3ee', '1459749411175-04bf5292ceea', '1485608674996-03f1eb94dc50'
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProceduralName(isAlbum = false) {
  const adj = getRandomItem(ADJECTIVES);
  const noun = getRandomItem(NOUNS);
  if (isAlbum) {
    return `${adj} ${getRandomItem(ALBUM_TYPES)}`;
  }
  return `The ${adj} ${noun}`;
}

function getUnsplashUrl(seed: number) {
  const id = UNSPLASH_IDS[seed % UNSPLASH_IDS.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=60`;
}

async function main() {
  console.log('Generating 1000 procedural songs...');

  // 1. Generate 50 Artists
  const artistData = [];
  for (let i = 0; i < 50; i++) {
    artistData.push({
      name: generateProceduralName() + (i > 10 ? ` ${i}` : ''),
      imageUrl: getUnsplashUrl(i),
    });
  }

  // Insert artists and fetch IDs
  await prisma.artist.createMany({ data: artistData });
  const artists = await prisma.artist.findMany({ orderBy: { id: 'desc' }, take: 50 });

  // 2. Generate 100 Albums
  const albumData = [];
  for (let i = 0; i < 100; i++) {
    const randomArtist = getRandomItem(artists);
    albumData.push({
      title: generateProceduralName(true) + ` Vol ${i + 1}`,
      coverUrl: getUnsplashUrl(i * 3),
      year: 2010 + (i % 14),
      artistId: randomArtist.id,
    });
  }

  await prisma.album.createMany({ data: albumData });
  const albums = await prisma.album.findMany({ orderBy: { id: 'desc' }, take: 100 });

  // 3. Generate 1000 Tracks
  const trackData = [];
  for (let i = 0; i < 1000; i++) {
    const randomAlbum = getRandomItem(albums);
    const title = `${getRandomItem(ADJECTIVES)} ${getRandomItem(NOUNS)} Pt. ${i + 1}`;
    
    trackData.push({
      title,
      durationSeconds: 120 + Math.floor(Math.random() * 180), // 2 to 5 mins
      audioUrl: getRandomItem(SOUNDHELIX_URLS),
      albumId: randomAlbum.id,
      artistId: randomAlbum.artistId, // match album's artist
    });
  }

  // Insert in chunks of 200
  for (let i = 0; i < 1000; i += 200) {
    console.log(`Inserting tracks ${i} to ${i + 200}...`);
    const chunk = trackData.slice(i, i + 200);
    await prisma.track.createMany({ data: chunk });
  }

  console.log('Successfully inserted 1000 procedural tracks!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
