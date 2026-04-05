import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthFromRequest, hashPassword } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || !['admin', 'internal'].includes(user.role)) {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role') || '';
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return jsonResponse({ users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(req);
    if (!authUser || authUser.role !== 'admin') {
      return errorResponse('Only admins can create users', 403);
    }

    await dbConnect();
    const { name, email, password, role, phone, company } = await req.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email and password are required', 400);
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return errorResponse('Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, and a special character.', 400);
    }

    if (role === 'admin') {
      return errorResponse('Cannot create admin users', 403);
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
      role: role || 'customer',
      phone: phone || '',
      company: company || '',
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return jsonResponse({ user: userResponse }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(req);
    if (!authUser || authUser.role !== 'admin') {
      return errorResponse('Only admins can delete users', 403);
    }

    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('id');

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    if (userId === authUser.userId) {
      return errorResponse('You cannot delete yourself', 400);
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
