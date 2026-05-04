import { NextRequest, NextResponse } from 'next/server';
import { fetchAudiusTrendingTracks } from '../../../lib/audius';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '30');
  const skip = Number(req.nextUrl.searchParams.get('skip') ?? '0');
  const take = Number.isFinite(limit) ? limit : 30;
  const skipVal = Number.isFinite(skip) ? skip : 0;
  
  try {
    // Only use Audius for the initial page load (skip === 0)
    if (skipVal === 0) {
      const feed = await fetchAudiusTrendingTracks(take);
      if (feed.length) {
        return NextResponse.json(feed);
      }
    }

    const tracks = await prisma.track.findMany({
      take,
      skip: skipVal,
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
