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

// 1. ISOLATED ZERO-TRUST CALCULATION ENGINE
function calculateSubscriptionTotal(plans: any[]) {
  const subtotal = plans.reduce((sum, p) => sum + (p.price || 0), 0);
  const count = plans.length;
  
  // 2. AUTOMATIC DISCOUNT RULES
  let discountPercentage = 0;
  if (count === 2) {
    discountPercentage = 0.10; // 10% Discount for 2 plans
  } else if (count >= 3) {
    discountPercentage = 0.20; // 20% Discount for 3+ plans
  }
  
  const discountAmount = subtotal * discountPercentage;
  const finalTotal = subtotal - discountAmount;
  
  return {
    subtotal,
    discountPercentage,
    discountAmount,
    finalTotal
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized Request Protocol', 401);

    await dbConnect();
    const body = await req.json();
    const { planIds, paymentMethod = 'Standard' } = body;

    // EDGE CASE: Empty selection
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return errorResponse('Zero plans selected.', 400);
    }

    // EDGE CASE: Prevent Duplicates Automatically via Set
    const uniquePlanIds = Array.from(new Set(planIds));

    // 3. ZERO-TRUST DB VERIFICATION (Don't trust frontend values)
    const verifiedPlans = await Plan.find({ _id: { $in: uniquePlanIds } });
    
    if (verifiedPlans.length !== uniquePlanIds.length) {
      return errorResponse('Invalid or corrupted plan identifiers detected.', 400);
    }

    // 4. BACKEND RECALCULATION
    const calculatedPricing = calculateSubscriptionTotal(verifiedPlans);

    const start = new Date();
    const billingCycle = 'monthly';
    const expirationDate = calculateEndDate(start, billingCycle);
    const nextBillingDate = calculateNextBillingDate(start, billingCycle);

    // Map plans to order lines natively
    const orderLines = verifiedPlans.map(p => ({
      product: p._id, // For tracking
      quantity: 1,
      unitPrice: p.price,
      description: `Automated Checkout: ${p.name}`,
      amount: p.price
    }));

    // 5. SECURE RECORD CREATION
    const subscription = await Subscription.create({
      subscriptionNumber: generateSubscriptionNumber(),
      customer: user.userId,
      subscriptionType: 'Custom',
      status: 'Confirmed',
      startDate: start,
      expirationDate,
      nextBillingDate,
      billingCycle,
      paymentTerm: 'NET 30',
      orderLines,
      subtotal: calculatedPricing.subtotal,
      totalDiscount: calculatedPricing.discountAmount,
      totalTax: Math.round(calculatedPricing.subtotal * 0.18), // 18% standard tax
      totalAmount: calculatedPricing.finalTotal + 99, // Final + 99 Platform Fee
      tier: verifiedPlans.length >= 3 ? 'Elite' : 'Standard',
      events: [{ 
        status: 'Confirmed', 
        timestamp: new Date(), 
        user: user.userId, 
        notes: `Secure checkout verified by Automatic Discount Engine. Original Discount: ${calculatedPricing.discountPercentage * 100}%` 
      }],
      createdBy: user.userId,
    });

    return jsonResponse({ 
      subscription, 
      verifiedPricing: calculatedPricing,
      message: 'Checkout securely validated and synchronized.' 
    }, 201);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout Engine Failure';
    return errorResponse(message, 500);
  }
}
