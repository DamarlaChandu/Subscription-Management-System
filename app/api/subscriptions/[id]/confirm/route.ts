import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role === 'customer') return errorResponse('Forbidden', 403);

    await dbConnect();
    const { id } = await params;
    const subscription = await Subscription.findById(id);

    if (!subscription) return errorResponse('Subscription not found', 404);
    if (subscription.status !== 'Quotation') return errorResponse('Can only confirm a Quotation', 400);

    subscription.status = 'Confirmed';
    await subscription.save();

    return jsonResponse({ message: 'Subscription Confirmed', subscription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
