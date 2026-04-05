import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse, generateSubscriptionNumber, calculateEndDate, calculateNextBillingDate } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const body = await req.json();
    const { planId, quantity = 1, extraPrice = 0, method = 'upi' } = body;

    const plan = await Plan.findById(planId);
    if (!plan) return errorResponse('Plan not found', 404);

    const subscriptionNumber = generateSubscriptionNumber();
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, plan.billingCycle);

    const unitPrice = plan.price + Number(extraPrice);
    const subtotal = unitPrice * Number(quantity);
    const totalTax = subtotal * 0.18;
    const totalAmount = subtotal + totalTax;

    const subscription = await Subscription.create({
      subscriptionNumber,
      customer: user.userId,
      plan: planId,
      product: plan.product || undefined,
      status: 'Quotation', // For Customer Initialized, but not yet verified
      startDate,
      expirationDate: endDate,
      nextBillingDate: endDate,
      billingCycle: plan.billingCycle,
      orderLines: [{
        product: plan.product || plan._id,
        quantity: Number(quantity),
        unitPrice: unitPrice,
        discount: 0,
        tax: unitPrice * 0.18,
        amount: unitPrice * 1.18 * Number(quantity)
      }],
      subtotal,
      totalDiscount: 0,
      totalTax,
      totalAmount,
      createdBy: user.userId,
      events: [{ 
        status: 'Quotation', 
        timestamp: new Date(), 
        notes: `Customer initiated via ${method}. Awaiting verification.` 
      }]
    });

    return jsonResponse({ 
      message: 'Subscription initialized successfully! Please wait for verification.',
      subscriptionId: subscription._id
    }, 201);

  } catch (error: any) {
    console.error('Subscription Initialization Error:', error);
    return errorResponse(error.message || 'Server error', 500);
  }
}
