import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Invoice from '@/models/Invoice';
import Plan from '@/models/Plan';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req);
    
    // Only customers should be able to create subscriptions directly from 'Browse Plans'
    if (!user || user.role !== 'customer') {
      return errorResponse('Only customers can subscribe directly. Admins/Managers should use the dashboard.', 403);
    }

    await dbConnect();
    const { planId } = await req.json();

    if (!planId) {
      return errorResponse('Plan ID is required', 400);
    }

    // Check if plan exists and is active
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return errorResponse('Plan not found or inactive', 404);
    }

    // Check if user already has an active subscription to this plan
    const existingActiveSub = await Subscription.findOne({
      customer: user.userId,
      plan: planId,
      status: 'active'
    });

    if (existingActiveSub) {
      return errorResponse('You are already subscribed to this plan. Manage it from your dashboard.', 400);
    }

    // Generate Subscription ID and dates
    const subscriptionId = `SUB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const startDate = new Date();
    const endDate = new Date();
    
    // Calculate end date based on billing cycle
    switch (plan.billingCycle.toLowerCase()) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create Subscription
    const subscription = await Subscription.create({
      subscriptionId,
      customer: user.userId,
      plan: planId,
      status: 'active', // Instantly active for demo purposes
      startDate,
      endDate,
      autoRenew: plan.isRenewable ?? true,
      createdBy: user.userId,
    });

    // Create Invoice (Status: Confirmed or Pending)
    const subtotal = plan.price;
    const taxRate = 10; // Simple 10% tax for demo
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due 7 days from now

    await Invoice.create({
      invoiceNumber,
      subscription: subscription._id,
      customer: user.userId,
      items: [{
        description: `Subscription to ${plan.name} (${plan.billingCycle})`,
        quantity: 1,
        unitPrice: plan.price,
        total: plan.price
      }],
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'confirmed', // Assuming confirmed before payment is collected
      dueDate,
      createdBy: user.userId,
    });

    return jsonResponse({ 
      message: 'Subscription created successfully!',
      subscription 
    }, 201);

  } catch (error: unknown) {
    console.error('Subscription Creation Error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}
