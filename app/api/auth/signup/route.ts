import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken, JWTPayload } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, phone, company } = await req.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email and password are required', 400);
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return errorResponse('Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, and a special character.', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      phone: phone || '',
      company: company || '',
    });

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role.toLowerCase(),
      name: user.name,
    };

    const token = await generateToken(payload);

    const response = jsonResponse({
      message: 'Account created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role.toLowerCase() },
      token,
    }, 201);

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
