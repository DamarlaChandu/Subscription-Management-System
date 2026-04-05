import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(req);
    if (!authUser) {
      return errorResponse('Not authenticated', 401);
    }

    await dbConnect();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400);
    }

    const user = await User.findById(authUser.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse('Current password is incorrect', 400);
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return jsonResponse({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
