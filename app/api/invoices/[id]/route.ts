import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id } = await params;
    const invoice = await Invoice.findById(id)
      .populate('customer', 'name email phone company address')
      .populate('subscription');

    if (!invoice) return errorResponse('Invoice not found', 404);
    return jsonResponse({ invoice });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || !['admin', 'internal'].includes(user.role)) {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Normalize status to lowercase if present
    if (body.status) body.status = body.status.toLowerCase();

    const invoice = await Invoice.findByIdAndUpdate(id, body, { new: true });
    if (!invoice) return errorResponse('Invoice not found', 404);
    return jsonResponse({ invoice });
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

    await dbConnect();
    const { id } = await params;
    await Invoice.findByIdAndDelete(id);
    return jsonResponse({ message: 'Invoice deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
