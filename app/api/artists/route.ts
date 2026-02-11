import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const artists = await prisma.artist.findMany({
      orderBy: { name: 'asc' },
      include: { albums: true, _count: { select: { tracks: true } } },
    });
    return NextResponse.json(artists);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
