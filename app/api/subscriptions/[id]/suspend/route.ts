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
    if (subscription.status !== 'Active') return errorResponse('Only Active subscriptions can be suspended', 400);

    subscription.status = 'Suspended';
    await subscription.save();

    return jsonResponse({ message: 'Subscription Suspended', subscription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
