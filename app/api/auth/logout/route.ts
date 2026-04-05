import { jsonResponse } from '@/lib/helpers';

export async function POST() {
  const response = jsonResponse({ message: 'Logged out successfully' });
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
