import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    // Attempt to find the user
    // In a real system, we'd generate a secure token, store it in the DB with an expiration, 
    // and send it via SendGrid/SES/etc.
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`[SIMULATION] Password reset email sent securely to: ${user.email}`);
      console.log(`[SIMULATION] Reset Link: https://your-domain.com/reset-password?token=simulated_token_12345`);
    }

    // Always return a generic success message to prevent user enumeration attacks/email harvesting
    return jsonResponse({
      message: 'If an account exists with that email, a password reset link has been sent.',
    }, 200);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
