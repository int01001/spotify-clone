import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';
import { setAuthCookie } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name } = body as { email?: string; password?: string; name?: string };

  if (!email || !password || !name) {
    return NextResponse.json({ message: 'Name, email, and password are required.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: 'Email already exists.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const res = NextResponse.json({ user });
  setAuthCookie(res, user.id);
  return res;
}
