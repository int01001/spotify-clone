import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { hashOtp, isExpired } from '../../../../../lib/otp';
import { setAuthCookie } from '../../../../../lib/session';

export const dynamic = 'force-dynamic';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body as { email?: string; otp?: string };

    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return NextResponse.json({ message: 'OTP must be a 6-digit code.' }, { status: 400 });
    }

    const pendingSignup = await prisma.signupOtp.findUnique({ where: { email: normalizedEmail } });
    if (!pendingSignup) {
      return NextResponse.json({ message: 'No pending signup found for this email.' }, { status: 404 });
    }

    if (isExpired(pendingSignup.expiresAt)) {
      await prisma.signupOtp.delete({ where: { id: pendingSignup.id } });
      return NextResponse.json({ message: 'OTP expired. Please request a new code.' }, { status: 410 });
    }

    if (pendingSignup.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.signupOtp.delete({ where: { id: pendingSignup.id } });
      return NextResponse.json({ message: 'Too many invalid OTP attempts. Request a new code.' }, { status: 429 });
    }

    const incomingOtpHash = hashOtp(normalizedEmail, normalizedOtp);
    if (incomingOtpHash !== pendingSignup.otpHash) {
      await prisma.signupOtp.update({
        where: { id: pendingSignup.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ message: 'Invalid OTP.' }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      await prisma.signupOtp.delete({ where: { id: pendingSignup.id } });
      return NextResponse.json({ message: 'Email already exists.' }, { status: 409 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: pendingSignup.name,
          passwordHash: pendingSignup.passwordHash,
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      await tx.signupOtp.delete({ where: { id: pendingSignup.id } });
      return createdUser;
    });

    const res = NextResponse.json({
      message: 'Signup successful.',
      user,
    });
    setAuthCookie(res, user.id);
    return res;
  } catch (error) {
    console.error('Failed to verify signup OTP:', error);
    return NextResponse.json({ message: 'Unable to verify OTP right now.' }, { status: 500 });
  }
}
