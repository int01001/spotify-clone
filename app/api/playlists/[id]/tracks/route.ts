import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const playlistId = Number(params.id);
  if (!Number.isFinite(playlistId)) {
    return NextResponse.json({ message: 'Invalid playlist id' }, { status: 400 });
  }

  const { trackId } = (await req.json()) as { trackId?: number };

  if (!trackId) {
    return NextResponse.json({ message: 'trackId is required' }, { status: 400 });
  }

  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return NextResponse.json({ message: 'Playlist not found' }, { status: 404 });
    }

    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: { playlistId, trackId },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Track already in playlist' }, { status: 409 });
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

    return NextResponse.json(added, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
