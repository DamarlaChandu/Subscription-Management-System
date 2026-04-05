import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, variantId: string }> }) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role === 'customer') {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const { id, variantId } = await params;

    const product = await Product.findByIdAndUpdate(
      id,
      { $pull: { variants: { _id: variantId } } },
      { new: true }
    );

    if (!product) return errorResponse('Product not found', 404);

    return jsonResponse({ message: 'Variant removed', product }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
