import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
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

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, coverUrl, userId } = body as {
    name?: string;
    description?: string;
    coverUrl?: string;
    userId?: number;
  };

  if (!name) {
    return NextResponse.json({ message: 'Name is required' }, { status: 400 });
  }

  try {
    const ownerId =
      userId ??
      (
        await prisma.user.findFirst({
          select: { id: true },
        })
      )?.id;

    if (!ownerId) {
      return NextResponse.json({ message: 'No default user available to own the playlist' }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description ?? null,
        coverUrl: coverUrl ?? null,
        userId: ownerId,
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
