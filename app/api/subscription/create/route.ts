import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Plan from '@/models/Plan';
import Subscription from '@/models/Subscription';
import { getAuthFromRequest } from '@/lib/auth';
import { 
  jsonResponse, 
  errorResponse, 
  generateSubscriptionNumber, 
  calculateNextBillingDate, 
  calculateEndDate 
} from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized Request Protocol', 401);

    await dbConnect();
    const body = await req.json();
    const { productId, planId, quantity = 1 } = body;

    if (!planId || quantity < 1) {
      return errorResponse('Invalid subscription parameters.', 400);
    }

    const verifiedPlan = await Plan.findById(planId);
    if (!verifiedPlan) {
      return errorResponse('Requested plan does not exist in registry.', 404);
    }

    // 1. ISOLATED ZERO-TRUST CALCULATION
    const subtotal = verifiedPlan.price * quantity;
    
    // 2. QUANTITY DISCOUNT RULES
    let discountPercentage = 0;
    if (quantity === 2) {
      discountPercentage = 0.10; // 10% Discount for 2 units
    } else if (quantity >= 3) {
      discountPercentage = 0.20; // 20% Discount for 3+ units
    }
    
    const totalDiscount = subtotal * discountPercentage;
    const finalTotal = subtotal - totalDiscount;

    const start = new Date();
    const billingCycle = verifiedPlan.billingCycle || 'monthly';
    const expirationDate = calculateEndDate(start, billingCycle);
    const nextBillingDate = calculateNextBillingDate(start, billingCycle);

    const orderLines = [{
      product: verifiedPlan._id,
      quantity,
      unitPrice: verifiedPlan.price,
      description: `Target Configuration: ${verifiedPlan.name} x${quantity}`,
      amount: verifiedPlan.price * quantity
    }];

    // 3. SECURE RECORD CREATION
    const subscription = await Subscription.create({
      subscriptionNumber: generateSubscriptionNumber(),
      customer: user.userId,
      subscriptionType: 'Standard',
      status: 'Confirmed',
      startDate: start,
      expirationDate,
      nextBillingDate,
      billingCycle,
      paymentTerm: 'NET 30',
      orderLines,
      subtotal,
      totalDiscount,
      totalTax: 0, // Ignoring tax for clean calculation presentation
      totalAmount: finalTotal,
      tier: discountPercentage > 0 ? 'Optimized' : 'Standard',
      events: [{ 
        status: 'Confirmed', 
        timestamp: new Date(), 
        user: user.userId, 
        notes: `Secure checkout verified by Quantity Engine. Volume Discount: ${discountPercentage * 100}%` 
      }],
      createdBy: user.userId,
    });

    return jsonResponse({ 
      subscriptionId: subscription._id,
      total: finalTotal,
      message: 'Checkout securely validated and synchronized.' 
    }, 201);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout Engine Failure';
    return errorResponse(message, 500);
  }
}
