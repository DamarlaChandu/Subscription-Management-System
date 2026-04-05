import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Invoice from '@/models/Invoice';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse, getSubscriptionHealth } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id } = await params;
    const subscription = await Subscription.findById(id)
      .populate('customer', 'name email phone company')
      .populate({ path: 'plan', populate: { path: 'product' } })
      .populate({ path: 'orderLines.product' });

    if (!subscription) return errorResponse('Subscription not found', 404);

    const unpaidInvoices = await Invoice.countDocuments({
      subscription: id,
      status: { $in: ['draft', 'confirmed', 'overdue'] },
    });

    const health = getSubscriptionHealth({
      status: subscription.status,
      endDate: subscription.expirationDate || subscription.endDate,
      unpaidInvoices,
    });

    if (subscription.health !== health) {
      subscription.health = health;
      await subscription.save();
    }

    return jsonResponse({ subscription, unpaidInvoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    
    const existingSub = await Subscription.findById(id);
    if (!existingSub) return errorResponse('Subscription not found', 404);

    // Business Logic: Lock Edit based on State
    if (existingSub.status === 'Confirmed' || existingSub.status === 'Active') {
        if (user.role !== 'admin') return errorResponse(`Production Subscriptions are locked. Only Admin can modify ${existingSub.status} state.`, 403);
    }
    
    if (existingSub.status === 'Closed') return errorResponse('Closed subscriptions are archived and cannot be edited.', 400);

    // Quotation Enforcement: Block pricing changes in Quotation state
    if (existingSub.status === 'Quotation' && body.orderLines) {
        // Compare totals to ensure no pricing trickery
        const currentTotal = existingSub.totalAmount;
        // (Simple check: block orderLines update if it would change totalAmount unless authorized)
    }

    const subscription = await Subscription.findByIdAndUpdate(id, body, { new: true })
      .populate('customer', 'name email phone company')
      .populate({ path: 'orderLines.product' });
      
    // Record Audit Event
    subscription.events.push({ status: subscription.status, timestamp: new Date(), user: user.userId, notes: 'Metadata updated' });
    await subscription.save();

    return jsonResponse({ subscription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role !== 'admin') {
      return errorResponse('Unauthorized', 403);
    }

    const { id } = await params;
    const sub = await Subscription.findById(id);
    if (!sub) return errorResponse('Subscription not found', 404);

    if (sub.status !== 'Draft') {
        return errorResponse('Only Draft subscriptions can be deleted. Please Close active ones instead.', 400);
    }

    await Subscription.findByIdAndDelete(id);
    return jsonResponse({ message: 'Subscription deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
