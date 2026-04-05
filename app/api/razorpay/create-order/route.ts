import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/db';
import Plan from '@/models/Plan';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role !== 'customer') {
      return errorResponse('Unauthorized. Only customers can subscribe.', 403);
    }

    const { planId, quantity = 1, extraPrice = 0 } = await req.json();
    if (!planId) return errorResponse('Plan ID is required', 400);

    await dbConnect();
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return errorResponse('Plan not found or inactive', 404);
    }

    // Tax & Math calculation
    const unitPrice = plan.price + Number(extraPrice);
    const subtotal = unitPrice * Number(quantity);
    const taxRate = 10; // 10% tax
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Convert amount to paise (1 Rupee = 100 Paise)
    const amountInPaise = Math.round(totalAmount * 100);

    // Make sure keys are present
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return errorResponse('Razorpay is not configured on the server.', 500);
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.userId,
        planId: planId,
        planName: plan.name,
      }
    };

    const order = await razorpay.orders.create(options);
    
    return jsonResponse({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      totalAmount // For UI display
    });
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return errorResponse(error.message || 'Server error', 500);
  }
}
