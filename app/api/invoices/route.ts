import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
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
    const subscriptionId = searchParams.get('subscription') || '';

    const query: Record<string, unknown> = {};
    if (user.role === 'customer') {
      query.customer = user.userId;
    }
    if (status) query.status = status;
    if (subscriptionId) query.subscription = subscriptionId;

    const invoices = await Invoice.find(query)
      .populate('customer', 'name email')
      .populate('subscription', 'subscriptionId')
      .sort({ createdAt: -1 });

    return jsonResponse({ invoices });
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
    
    // Normalize status to lowercase if present
    if (body.status) body.status = body.status.toLowerCase();

    const invoice = await Invoice.create({ ...body, createdBy: user.userId });
    return jsonResponse({ invoice }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
