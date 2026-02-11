import { NextRequest, NextResponse } from 'next/server';
import { fetchJamendoTracks } from '../../../lib/jamendo';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '30');
  const take = Number.isFinite(limit) ? limit : 30;
  try {
    // Prefer Jamendo streaming tracks; fall back to local DB if Jamendo unavailable
    const jamendo = await fetchJamendoTracks(take);
    if (jamendo.length) {
      return NextResponse.json(jamendo);
    }

    const tracks = await prisma.track.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: { artist: true, album: true },
    });
    return NextResponse.json(tracks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
