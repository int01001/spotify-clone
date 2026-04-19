import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';
import { createOtpCode, createOtpExpiry, getOtpExpiryMinutes, hashOtp } from '../../../../lib/otp';
import { describeMailerError, sendSignupOtpEmail } from '../../../../lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body as { email?: string; password?: string; name?: string };

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Name, email, and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return NextResponse.json({ message: 'Name cannot be empty.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ message: 'Email already exists.' }, { status: 409 });
    }

    await prisma.signupOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const otpCode = createOtpCode();
    const expiresAt = createOtpExpiry();
    const expiresInMinutes = getOtpExpiryMinutes();
    const passwordHash = hashPassword(password);

    await prisma.signupOtp.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: trimmedName,
        passwordHash,
        otpHash: hashOtp(normalizedEmail, otpCode),
        expiresAt,
      },
      update: {
        name: trimmedName,
        passwordHash,
        otpHash: hashOtp(normalizedEmail, otpCode),
        attempts: 0,
        expiresAt,
      },
    });

    await sendSignupOtpEmail({
      toEmail: normalizedEmail,
      name: trimmedName,
      otpCode,
      expiryMinutes: expiresInMinutes,
    });

    return NextResponse.json({
      message: 'OTP sent to your email address.',
      email: normalizedEmail,
      expiresInMinutes,
    });
  } catch (error) {
    console.error('Failed to start signup OTP flow:', error);
    return NextResponse.json({ message: describeMailerError(error) }, { status: 500 });
  }
}
