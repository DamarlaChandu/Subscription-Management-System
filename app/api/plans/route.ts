import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Plan from '@/models/Plan';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const cycle = searchParams.get('cycle') || '';
    const productId = searchParams.get('productId') || '';

    const query: Record<string, any> = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (cycle) query.billingCycle = cycle;
    if (productId) {
       const isObjId = mongoose.Types.ObjectId.isValid(productId);
       query.$or = [
          ...(isObjId ? [{ product: new mongoose.Types.ObjectId(productId) }] : []),
          { productId: productId } // Fallback for manual legacy strings
       ];
    }

    const plans = await Plan.find(query).populate('product', 'name type').sort({ createdAt: -1 });
    return jsonResponse({ plans });
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
    
    // Normalize billingCycle to lowercase if present
    if (body.billingCycle) body.billingCycle = body.billingCycle.toLowerCase();

    const plan = await Plan.create({ ...body, createdBy: user.userId });
    return jsonResponse({ plan }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
