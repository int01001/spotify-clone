

## `backend/src/server.ts`

```ts
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

## Home API

The home route loads playlists, albums, artists, and tracks in parallel, then reshapes the data for the frontend dashboard.

```ts
app.get('/api/home', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [playlists, albums, artists, tracks] = await Promise.all([
      prisma.playlist.findMany({
        take: 6,
        include: {
          user: true,
          playlistTracks: {
            take: 3,
            orderBy: { order: 'asc' },
            include: { track: { include: { artist: true, album: true } } },
          },
        },
      }),
      prisma.album.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { artist: true },
      }),
      prisma.artist.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { tracks: true } } },
      }),
      prisma.track.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { artist: true, album: true },
      }),
    ]);

    res.json({
      featuredPlaylists: playlists.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        coverUrl: p.coverUrl,
        owner: { id: p.user.id, name: p.user.name },
        tracks: p.playlistTracks.map((pt) => ({
          id: pt.track.id,
          title: pt.track.title,
          artist: pt.track.artist.name,
          album: pt.track.album.title,
          durationSeconds: pt.track.durationSeconds,
        })),
      })),
      newReleases: albums,
      topArtists: artists.map((a) => ({
        id: a.id,
        name: a.name,
        imageUrl: a.imageUrl,
        trackCount: a._count.tracks,
      })),
      trendingTracks: tracks,
    });
  } catch (err) {
    next(err);
  }
});
```

## Tracks, Artists, And Albums

```ts
app.get('/api/tracks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 30;
    const tracks = await prisma.track.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { artist: true, album: true },
    });
    res.json(tracks);
  } catch (err) {
    next(err);
  }
});

app.get('/api/artists', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const artists = await prisma.artist.findMany({
      orderBy: { name: 'asc' },
      include: { albums: true, _count: { select: { tracks: true } } },
    });
    res.json(artists);
  } catch (err) {
    next(err);
  }
});

app.get('/api/albums/:id/tracks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const album = await prisma.album.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        artist: true,
        tracks: { orderBy: { id: 'asc' } },
      },
    });

    if (!album) return res.status(404).json({ message: 'Album not found' });
    res.json(album);
  } catch (err) {
    next(err);
  }
});
```

## Playlist APIs

```ts
app.get('/api/playlists', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        playlistTracks: {
          orderBy: { order: 'asc' },
          include: { track: { include: { artist: true, album: true } } },
        },
      },
    });

    res.json(playlists.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      coverUrl: p.coverUrl,
      owner: { id: p.user.id, name: p.user.name },
      tracks: p.playlistTracks.map((pt) => ({
        id: pt.track.id,
        title: pt.track.title,
        artist: pt.track.artist.name,
        album: pt.track.album.title,
        durationSeconds: pt.track.durationSeconds,
      })),
    })));
  } catch (err) {
    next(err);
  }
});

app.post('/api/playlists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, coverUrl, userId } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const ownerId =
      userId ??
      (await prisma.user.findFirst({ select: { id: true } }))?.id;

    if (!ownerId) {
      return res.status(400).json({ message: 'No default user available to own the playlist' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description ?? null,
        coverUrl: coverUrl ?? null,
        userId: ownerId,
      },
    });

    res.status(201).json(playlist);
  } catch (err) {
    next(err);
  }
});

app.post('/api/playlists/:id/tracks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = Number(req.params.id);
    const { trackId } = req.body as { trackId?: number };
    if (!trackId) return res.status(400).json({ message: 'trackId is required' });

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const existing = await prisma.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId, trackId } },
    });
    if (existing) return res.status(409).json({ message: 'Track already in playlist' });

    const maxOrder = await prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { order: true },
    });

    const added = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      include: { track: { include: { artist: true, album: true } } },
    });

    res.status(201).json(added);
  } catch (err) {
    next(err);
  }
});
```

## Search API

```ts
app.get('/api/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) ?? '';
    if (!q.trim()) return res.json({ tracks: [], artists: [], albums: [] });

    const [tracks, artists, albums] = await Promise.all([
      prisma.track.findMany({
        where: { title: { contains: q } },
        include: { artist: true, album: true },
        take: 10,
      }),
      prisma.artist.findMany({
        where: { name: { contains: q } },
        take: 10,
      }),
      prisma.album.findMany({
        where: { title: { contains: q } },
        include: { artist: true },
        take: 10,
      }),
    ]);

    res.json({ tracks, artists, albums });
  } catch (err) {
    next(err);
  }
});
```

## Error Handling And Startup

```ts
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

## `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
}

model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  name      String
  avatarUrl String?
  playlists Playlist[]
  createdAt DateTime   @default(now())
}

model Artist {
  id        Int      @id @default(autoincrement())
  name      String
  imageUrl  String?
  albums    Album[]
  tracks    Track[]
  createdAt DateTime @default(now())
}

model Album {
  id        Int      @id @default(autoincrement())
  title     String
  coverUrl  String?
  year      Int?
  artist    Artist   @relation(fields: [artistId], references: [id])
  artistId  Int
  tracks    Track[]
  createdAt DateTime @default(now())

  @@index([artistId])
}

model Track {
  id              Int             @id @default(autoincrement())
  title           String
  durationSeconds Int
  audioUrl        String?
  album           Album           @relation(fields: [albumId], references: [id])
  albumId         Int
  artist          Artist          @relation(fields: [artistId], references: [id])
  artistId        Int
  playlistTracks  PlaylistTrack[]
  createdAt       DateTime        @default(now())

  @@index([albumId])
  @@index([artistId])
}

model Playlist {
  id             Int             @id @default(autoincrement())
  name           String
  description    String?
  coverUrl       String?
  user           User            @relation(fields: [userId], references: [id])
  userId         Int
  playlistTracks PlaylistTrack[]
  createdAt      DateTime        @default(now())

  @@index([userId])
}

model PlaylistTrack {
  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  playlistId Int
  track      Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  trackId    Int
  order      Int      @default(0)

  @@id([playlistId, trackId])
  @@index([trackId])
}
```

## Seed Data Pattern

The seed script clears existing rows, creates one user, creates artists and albums, adds tracks, then creates playlists and connects tracks through `PlaylistTrack`.

```ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
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
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    },
  });

  const artist = await prisma.artist.create({
    data: { name: 'The Weeknd', imageUrl: 'https://images.unsplash.com/photo-example' },
  });

  const album = await prisma.album.create({
    data: {
      title: 'Dawn FM',
      coverUrl: 'https://images.unsplash.com/photo-example',
      year: 2022,
      artistId: artist.id,
    },
  });

  const track = await prisma.track.create({
    data: {
      title: 'Take My Breath',
      durationSeconds: 339,
      audioUrl: 'https://cdn.pixabay.com/audio-example.mp3',
      albumId: album.id,
      artistId: artist.id,
    },
  });

  const playlist = await prisma.playlist.create({
    data: {
      name: "Today's Vibes",
      description: 'Upbeat alt pop and dance to keep the energy high.',
      coverUrl: 'https://images.unsplash.com/photo-example',
      userId: user.id,
    },
  });

  await prisma.playlistTrack.create({
    data: {
      playlistId: playlist.id,
      trackId: track.id,
      order: 1,
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
