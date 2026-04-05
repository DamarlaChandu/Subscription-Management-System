import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role !== 'admin') {
      return errorResponse('Only admins can perform bulk operations', 403);
    }

    await dbConnect();
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('An array of product IDs must be provided', 400);
    }

    await Product.deleteMany({ _id: { $in: ids } });
    
    return jsonResponse({ message: 'Products successfully deleted' }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
