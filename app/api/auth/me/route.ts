import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthUserIdFromCookies } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getAuthUserIdFromCookies();
  if (!userId) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({ user: user ?? null });
}
