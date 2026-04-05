import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getAuthFromRequest } from '@/lib/auth';
import { 
  jsonResponse, 
  errorResponse, 
  generateSubscriptionNumber, 
  calculateNextBillingDate, 
  calculateEndDate 
} from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    
    // Securely pull only the subscriptions linked to the authenticated customer
    const subscriptions = await Subscription.find({ customer: user.userId })
      .populate('customer', 'firstName lastName email')
      .populate('orderLines.product', 'name type')
      .sort({ createdAt: -1 });

    return jsonResponse({ subscriptions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lifecycle Sync Failure';
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const body = await req.json();
    const { 
      orderLines, 
      totalAmount, 
      subtotal, 
      totalDiscount, 
      subscriptionType = 'Custom',
      tier 
    } = body;

    if (!orderLines || orderLines.length === 0) {
      return errorResponse('Missing integration nodes', 400);
    }

    const start = new Date();
    const billingCycle = 'monthly'; // Standard for bundles
    const expirationDate = calculateEndDate(start, billingCycle);
    const nextBillingDate = calculateNextBillingDate(start, billingCycle);

    const subscription = await Subscription.create({
      subscriptionNumber: generateSubscriptionNumber(),
      customer: user.userId,
      subscriptionType,
      status: 'Confirmed', // Strict structural enum mapping
      startDate: start,
      expirationDate,
      nextBillingDate,
      billingCycle,
      paymentTerm: 'NET 30',
      orderLines,
      subtotal,
      totalDiscount,
      totalTax: Math.round(subtotal * 0.18),
      totalAmount,
      tier,
      events: [{ 
        status: 'Confirmed', 
        timestamp: new Date(), 
        user: user.userId, 
        notes: `Smart Bundle created via Customer Portal. Tier: ${tier}` 
      }],
      createdBy: user.userId,
    });

    return jsonResponse({ subscription, message: 'Bundle successfully registered for account sync.' }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lifecycle Sync Failure';
    return errorResponse(message, 500);
  }
}
