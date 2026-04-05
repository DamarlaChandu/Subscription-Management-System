import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Otp from '@/models/Otp';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Find matching OTP
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return NextResponse.json({
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error: unknown) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
