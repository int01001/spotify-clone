'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SignupStep = 'details' | 'otp';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<SignupStep>('details');
  const [pendingEmail, setPendingEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      const nextEmail = String(data.email || email).trim().toLowerCase();
      setPendingEmail(nextEmail);
      setStep('otp');
      setOtp('');
      setMessage(`OTP sent to ${nextEmail}. Enter it below to finish signup.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail || email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');

      setMessage(`Welcome, ${data.user.name}. Redirecting to your home page...`);
      setTimeout(() => router.push('/'), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    setMessage(null);
    setResending(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      setMessage(`A new OTP has been sent to ${pendingEmail || email}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 space-y-6">
        <div>
          <p className="text-sm text-white/50 mb-1">Join the vibe</p>
          <h1 className="text-2xl font-semibold">
            {step === 'details' ? 'Create your account' : 'Verify your email'}
          </h1>
          {step === 'otp' ? (
            <p className="text-sm text-white/60 mt-2">We sent a one-time code to {pendingEmail || email}.</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

        {step === 'details' ? (
          <form className="space-y-4" onSubmit={requestOtp}>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Password</label>
              <input
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none"
                placeholder="********"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 text-black font-semibold py-3 hover:shadow-glow-green transition disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Sign up'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verifyOtp}>
            <div className="space-y-2">
              <label className="text-sm text-white/70">OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm tracking-[0.35em] outline-none"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 text-black font-semibold py-3 hover:shadow-glow-green transition disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              disabled={resending || loading}
              onClick={resendOtp}
              className="w-full rounded-xl border border-white/20 text-white/90 font-semibold py-3 hover:border-emerald-400/60 transition disabled:opacity-60"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setOtp('');
                setMessage(null);
                setError(null);
              }}
              className="w-full text-sm text-white/70 hover:text-white"
            >
              Edit signup details
            </button>
          </form>
        )}

        <p className="text-sm text-white/60">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
