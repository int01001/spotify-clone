import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { fetchJamendoTracks } from '../../../lib/jamendo';

export async function GET() {
  try {
    const [playlists, albums, artists, jamendoTracks] = await Promise.all([
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
      fetchJamendoTracks(10),
    ]);

    return NextResponse.json({
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
      trendingTracks: jamendoTracks,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
