import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, planId: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role === 'customer') {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const { id, planId } = await params;
    const { status } = await req.json();

    if (!['Active', 'Paused', 'Closed'].includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, 'recurringPlans._id': planId },
      { $set: { 'recurringPlans.$.status': status } },
      { new: true }
    );

    if (!product) return errorResponse('Product or Plan not found', 404);

    return jsonResponse({ product }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
