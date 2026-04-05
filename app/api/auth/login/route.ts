import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken, JWTPayload } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    if (!user.isActive) {
      return errorResponse('Account is deactivated', 403);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role.toLowerCase(),
      name: user.name,
    };

    const token = await generateToken(payload);

    const response = jsonResponse({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role.toLowerCase() },
      token,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
