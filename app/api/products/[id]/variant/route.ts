import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role === 'customer') {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const { id } = await params;
    const variantData = await req.json();

    if (!variantData.attribute || !variantData.value) {
      return errorResponse('Attribute and value are required', 400);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $push: { variants: variantData } },
      { new: true, runValidators: true }
    );

    if (!product) return errorResponse('Product not found', 404);

    return jsonResponse({ product }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
