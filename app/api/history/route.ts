import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuthUserIdFromCookies } from '../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getAuthUserIdFromCookies();
  if (!userId) return NextResponse.json({ history: [] });

  const history = await prisma.playHistory.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  const userId = getAuthUserIdFromCookies();
  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const { trackTitle, trackArtist, trackAlbum, audioUrl } = body as {
    trackTitle?: string;
    trackArtist?: string;
    trackAlbum?: string;
    audioUrl?: string;
  };

  if (!trackTitle || !trackArtist) {
    return NextResponse.json({ message: 'Missing track data' }, { status: 400 });
  }

  const entry = await prisma.playHistory.create({
    data: {
      userId,
      trackTitle,
      trackArtist,
      trackAlbum: trackAlbum ?? null,
      audioUrl: audioUrl ?? null,
    },
  });

  return NextResponse.json({ entry });
}
