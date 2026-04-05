import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const invoiceId = searchParams.get('invoice') || '';

    const query: Record<string, unknown> = {};
    if (user.role === 'customer') {
      query.customer = user.userId;
    }
    if (status) query.status = status;
    if (invoiceId) query.invoice = invoiceId;

    const payments = await Payment.find(query)
      .populate('invoice', 'invoiceNumber total')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    return jsonResponse({ payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || !['admin', 'internal'].includes(user.role)) {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { invoice: invoiceId, amount, method, transactionId, notes } = body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return errorResponse('Invoice not found', 404);

    const payment = await Payment.create({
      invoice: invoiceId,
      customer: invoice.customer,
      amount,
      method: method || 'bank_transfer',
      transactionId: transactionId || '',
      status: 'completed',
      notes: notes || '',
      paidAt: new Date(),
      createdBy: user.userId,
    });

    // Update invoice status
    const totalPaid = await Payment.aggregate([
      { $match: { invoice: invoice._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const paidAmount = totalPaid[0]?.total || 0;
    if (paidAmount >= invoice.total) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
      await invoice.save();
    }

    return jsonResponse({ payment }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
