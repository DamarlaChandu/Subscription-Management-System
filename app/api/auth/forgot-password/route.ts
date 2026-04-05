import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase().trim() });

    // Save new OTP (expires in 5 minutes)
    await Otp.create({
      email: email.toLowerCase().trim(),
      otp: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send OTP via email
    const emailSent = await sendOtpEmail(email.toLowerCase().trim(), otpCode, user.name);

    return NextResponse.json({
      message: emailSent
        ? 'OTP sent successfully to your email!'
        : 'OTP generated! Check the demo code below.',
      emailSent,
      email: email.toLowerCase().trim(),
      // Only include OTP in response if email wasn't sent (demo fallback)
      ...(!emailSent && { otp: otpCode }),
    });
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
