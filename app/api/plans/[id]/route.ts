import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Plan from '@/models/Plan';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id } = await params;
    const plan = await Plan.findById(id).populate('product');
    if (!plan) return errorResponse('Plan not found', 404);
    return jsonResponse({ plan });
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
    const plan = await Plan.findByIdAndUpdate(id, body, { new: true });
    if (!plan) return errorResponse('Plan not found', 404);
    return jsonResponse({ plan });
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
    await Plan.findByIdAndDelete(id);
    return jsonResponse({ message: 'Plan deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
