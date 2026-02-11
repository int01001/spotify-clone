import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
    const albumId = Number(req.params.id);
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: true,
        tracks: { orderBy: { id: 'asc' } },
      },
    });

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json(album);
  } catch (err) {
    next(err);
  }
});

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

    const serialized = playlists.map((p) => ({
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
    }));

    res.json(serialized);
  } catch (err) {
    next(err);
  }
});

app.post('/api/playlists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, coverUrl, userId } = req.body as {
      name?: string;
      description?: string;
      coverUrl?: string;
      userId?: number;
    };

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const ownerId =
      userId ??
      (
        await prisma.user.findFirst({
          select: { id: true },
        })
      )?.id;

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

    if (!trackId) {
      return res.status(400).json({ message: 'trackId is required' });
    }

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: { playlistId, trackId },
      },
    });

    if (existing) {
      return res.status(409).json({ message: 'Track already in playlist' });
    }

    const order =
      ((await prisma.playlistTrack.aggregate({
        where: { playlistId },
        _max: { order: true },
      }))._max.order ?? 0) + 1;

    const added = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        order,
      },
      include: { track: { include: { artist: true, album: true } } },
    });

    res.status(201).json(added);
  } catch (err) {
    next(err);
  }
});

app.get('/api/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) ?? '';
    if (!q.trim()) {
      return res.json({ tracks: [], artists: [], albums: [] });
    }

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
