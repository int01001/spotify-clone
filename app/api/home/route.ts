import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { fetchAudiusTrendingTracks } from '../../../lib/audius';

export async function GET() {
  const audioFeed = await fetchAudiusTrendingTracks(10).catch(() => []);
  let playlists: any[] = [];
  let albums: any[] = [];
  let artists: any[] = [];

  try {
    [playlists, albums, artists] = await Promise.all([
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
    ]);
  } catch (error) {
    console.error('DB unavailable in /api/home, returning fallback payload.', error);
  }

  return NextResponse.json({
    featuredPlaylists: playlists.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      coverUrl: p.coverUrl,
      owner: { id: p.user.id, name: p.user.name },
      tracks: p.playlistTracks.map((pt: any) => ({
        id: pt.track.id,
        title: pt.track.title,
        artist: pt.track.artist.name,
        album: pt.track.album.title,
        durationSeconds: pt.track.durationSeconds,
      })),
    })),
    newReleases: albums,
    topArtists: artists.map((a: any) => ({
      id: a.id,
      name: a.name,
      imageUrl: a.imageUrl,
      trackCount: a._count.tracks,
    })),
    trendingTracks: audioFeed,
  });
}

export const dynamic = 'force-dynamic';
