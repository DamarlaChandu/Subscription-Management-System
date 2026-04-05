import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id);
    if (!product) return errorResponse('Product not found', 404);
    return jsonResponse({ product });
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
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) return errorResponse('Product not found', 404);
    return jsonResponse({ product });
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
    await Product.findByIdAndDelete(id);
    return jsonResponse({ message: 'Product deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
