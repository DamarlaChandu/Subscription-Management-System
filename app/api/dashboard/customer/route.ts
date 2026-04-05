import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import { getAuthUser } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();

    // Fetch customer's subscriptions
    const subscriptions = await Subscription.find({ customer: user.userId })
      .populate('product', 'name')
      .populate('plan', 'name price billingCycle')
      .sort({ createdAt: -1 });

    // Fetch customer's recent invoices
    const invoices = await Invoice.find({ customer: user.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch customer's recent payments
    const payments = await Payment.find({ customer: user.userId })
      .populate('invoice', 'invoiceNumber')
      .sort({ paidAt: -1 })
      .limit(5);

    // Calculate MRR/Total for this customer (Sum of active subscriptions)
    const activeSubAgg = await Subscription.aggregate([
      { $match: { customer: user.userId, status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const mrr = activeSubAgg[0]?.total || 0;

    return jsonResponse({
      subscriptions,
      invoices,
      payments,
      stats: {
        mrr,
        totalActive: subscriptions.filter(s => s.status === 'Active').length,
        pendingInvoices: invoices.filter(i => i.status !== 'paid').length,
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
