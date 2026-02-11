import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const albumId = Number(params.id);
  if (!Number.isFinite(albumId)) {
    return NextResponse.json({ message: 'Invalid album id' }, { status: 400 });
  }
  try {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: true,
        tracks: { orderBy: { id: 'asc' } },
      },
    });

    if (!album) {
      return NextResponse.json({ message: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
