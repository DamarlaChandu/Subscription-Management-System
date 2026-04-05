import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role === 'customer') {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const { id } = await params;
    const planData = await req.json();

    if (!planData.planName || !planData.billingCycle || planData.price === undefined) {
      return errorResponse('Plan name, billing cycle, and price are required', 400);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $push: { recurringPlans: planData } },
      { new: true, runValidators: true }
    );

    if (!product) return errorResponse('Product not found', 404);

    return jsonResponse({ product }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
