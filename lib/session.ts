import { cookies } from 'next/headers';

export const AUTH_COOKIE = 'auth_user';

export function setAuthCookie(res: Response, userId: number) {
  (res as any).cookies?.set?.(AUTH_COOKIE, String(userId), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function clearAuthCookie(res: Response) {
  (res as any).cookies?.set?.(AUTH_COOKIE, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
}

export function getAuthUserIdFromCookies(): number | null {
  const value = cookies().get(AUTH_COOKIE)?.value;
  const id = value ? Number(value) : NaN;
  return Number.isFinite(id) ? id : null;
}
