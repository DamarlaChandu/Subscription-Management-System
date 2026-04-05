import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const settings = await Setting.find().sort({ key: 1 });
    return jsonResponse({ settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user || user.role !== 'admin') {
      return errorResponse('Unauthorized', 403);
    }

    await dbConnect();
    const { settings } = await req.json();

    for (const s of settings) {
      await Setting.findOneAndUpdate(
        { key: s.key },
        { ...s, updatedBy: user.userId },
        { upsert: true, new: true }
      );
    }

    const updated = await Setting.find().sort({ key: 1 });
    return jsonResponse({ settings: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
