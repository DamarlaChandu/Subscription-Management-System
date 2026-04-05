import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';
import Invoice from '@/models/Invoice';
import { getAuthFromRequest } from '@/lib/auth';
import {
  jsonResponse,
  errorResponse,
  generateSubscriptionNumber,
  calculateNextBillingDate,
  calculateEndDate,
  calculatePriceForDays,
} from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (user.role === 'customer') {
      query.customer = user.userId;
    }
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { subscriptionNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const subscriptions = await Subscription.find(query)
      .populate('customer', 'name email phone company')
      .populate('product')
      .populate('plan')
      .populate({ path: 'orderLines.product' })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with dynamic payment status and real health
    const enriched = await Promise.all(subscriptions.map(async (sub: any) => {
       const invoices = await Invoice.find({ subscription: sub._id });
       const overdue = invoices.filter(i => (i.status === 'draft' || i.status === 'confirmed') && new Date(i.dueDate) < new Date()).length;
       const pending = invoices.filter(i => (i.status === 'draft' || i.status === 'confirmed')).length;
       
       return {
         ...sub,
         paymentStatus: overdue > 0 ? 'Overdue' : pending > 0 ? 'Pending' : 'Paid',
         health: overdue > 0 ? 'high-risk' : pending > 1 ? 'warning' : 'healthy'
       };
    }));

    return jsonResponse({ subscriptions: enriched });
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
    const {
      customer, product, plan: planId, startDate, paymentTerm,
      orderLines, durationDays, subscriptionType = 'Standard',
      billingCycle, customPrice,
    } = body;

    const plan = await Plan.findById(planId);
    const start = new Date(startDate || Date.now());

    // ── Determine Product ──────────────────────────────────────────
    const finalProduct = product || plan?.product || undefined;

    // ── Determine Billing Cycle ────────────────────────────────────
    const finalBillingCycle = billingCycle || plan?.billingCycle || 'monthly';

    // ── Custom day-based duration ──────────────────────────────────
    const customDays = durationDays ? Number(durationDays) : null;
    const expirationDate = calculateEndDate(start, finalBillingCycle, customDays ?? undefined);
    const nextBillingDate = calculateNextBillingDate(start, finalBillingCycle, customDays ?? undefined);

    // ── Price calculation ──────────────────────────────────────────
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalAmount = 0;

    if (orderLines && orderLines.length > 0) {
      orderLines.forEach((line: any) => {
        const itemSub = line.quantity * line.unitPrice;
        const itemDisc = line.discount || 0;
        const itemTax = line.tax || 0;
        line.amount = itemSub - itemDisc + itemTax;
        
        subtotal += itemSub;
        totalDiscount += itemDisc;
        totalTax += itemTax;
        totalAmount += line.amount;
      });
    } else if (plan) {
      subtotal = plan.price;
      totalTax = Math.round(plan.price * 0.18); // Example tax
      totalAmount = subtotal + totalTax;
    }

    const subscription = await Subscription.create({
      subscriptionNumber: generateSubscriptionNumber(),
      customer,
      product: finalProduct,
      plan: planId || undefined,
      subscriptionType,
      status: 'Draft',
      startDate: start,
      expirationDate,
      nextBillingDate,
      billingCycle: finalBillingCycle,
      paymentTerm: paymentTerm || 'NET 30',
      orderLines: orderLines || [],
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount,
      events: [{ status: 'Draft', timestamp: new Date(), user: user.userId, notes: 'Subscription initialized' }],
      createdBy: user.userId,
    });

    const populated = await Subscription.findById(subscription._id)
      .populate('customer', 'name email phone company')
      .populate('product')
      .populate('plan')
      .populate({ path: 'orderLines.product' });

    return jsonResponse({ subscription: populated }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
