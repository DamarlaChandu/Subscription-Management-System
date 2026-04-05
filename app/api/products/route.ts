import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    const query: Record<string, unknown> = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (type) query.type = type;

    const products = await Product.find(query).sort({ createdAt: -1 });
    return jsonResponse({ products });
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
    
    // Normalize type to lowercase if present
    if (body.type) body.type = body.type.toLowerCase();

    const product = await Product.create({ ...body, createdBy: user.userId });
    return jsonResponse({ product }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
