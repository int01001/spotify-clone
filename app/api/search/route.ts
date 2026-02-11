import { NextRequest, NextResponse } from 'next/server';
import { fetchJamendoTracks } from '../../../lib/jamendo';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json({ tracks: [], artists: [], albums: [] });
  }

  try {
    const jamendo = await fetchJamendoTracks(30, q);

    const [artists, albums, localTracks] = await Promise.all([
      prisma.artist.findMany({
        where: { name: { contains: q } },
        take: 10,
      }),
      prisma.album.findMany({
        where: { title: { contains: q } },
        include: { artist: true },
        take: 10,
      }),
      prisma.track.findMany({
        where: { title: { contains: q } },
        include: { artist: true, album: true },
        take: 10,
      }),
    ]);

    const tracks = jamendo.length ? jamendo : localTracks;

    return NextResponse.json({ tracks, artists, albums });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
