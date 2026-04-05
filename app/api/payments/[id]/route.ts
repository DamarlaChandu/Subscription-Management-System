import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id } = await params;
    const payment = await Payment.findById(id)
      .populate('invoice')
      .populate('customer', 'name email');

    if (!payment) return errorResponse('Payment not found', 404);
    return jsonResponse({ payment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
