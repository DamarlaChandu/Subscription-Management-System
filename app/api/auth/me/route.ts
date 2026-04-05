import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(req);
    if (!authUser) {
      return errorResponse('Not authenticated', 401);
    }

    await dbConnect();
    const user = await User.findById(authUser.userId).select('-password');
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const userData = user.toObject();
    if (userData.role) userData.role = userData.role.toLowerCase();

    return jsonResponse({ user: userData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(req);
    if (!authUser) {
      return errorResponse('Not authenticated', 401);
    }

    await dbConnect();
    const body = await req.json();
    const { name, phone, company } = body;

    const user = await User.findByIdAndUpdate(
      authUser.userId,
      { ...(name && { name }), ...(phone !== undefined && { phone }), ...(company !== undefined && { company }) },
      { new: true }
    ).select('-password');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse({ user, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
