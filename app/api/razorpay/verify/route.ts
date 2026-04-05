import { NextRequest } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Invoice from '@/models/Invoice';
import Plan from '@/models/Plan';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      planId,
      quantity = 1,
      extraPrice = 0
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Invalid payment details', 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return errorResponse('Server config error', 500);

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return errorResponse('Payment verification failed', 400);
    }

    // Payment is verified, create subscription
    await dbConnect();
    const plan = await Plan.findById(planId);
    if (!plan) return errorResponse('Plan not found', 404);

    // Generate Subscription details
    const subscriptionId = `SUB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const startDate = new Date();
    const endDate = new Date();
    
    switch (plan.billingCycle.toLowerCase()) {
      case 'monthly': endDate.setMonth(endDate.getMonth() + 1); break;
      case 'yearly': endDate.setFullYear(endDate.getFullYear() + 1); break;
      case 'weekly': endDate.setDate(endDate.getDate() + 7); break;
      case 'daily': endDate.setDate(endDate.getDate() + 1); break;
      default: endDate.setMonth(endDate.getMonth() + 1);
    }

    // Check if user already has it (should be checked frontend too, but be safe)
    const existing = await Subscription.findOne({ customer: userId, plan: planId, status: 'Active' });
    if (existing) {
      return jsonResponse({ message: 'Subscription already active' });
    }

    const subscription = await Subscription.create({
      subscriptionNumber: subscriptionId, // Use the correct field name from the model
      customer: userId,
      plan: planId,
      status: 'Active',
      startDate,
      expirationDate: endDate, // Use the correct field name from the model
      nextBillingDate: endDate, // Standard renewal expectation
      billingCycle: plan.billingCycle,
      orderLines: [{
        product: plan.product || plan._id,
        quantity: Number(quantity),
        unitPrice: plan.price + Number(extraPrice),
        discount: 0,
        tax: (plan.price + Number(extraPrice)) * 0.1,
        amount: (plan.price + Number(extraPrice)) * 1.1 * Number(quantity)
      }],
      subtotal: (plan.price + Number(extraPrice)) * Number(quantity),
      totalDiscount: 0,
      totalTax: (plan.price + Number(extraPrice)) * 0.1 * Number(quantity),
      totalAmount: (plan.price + Number(extraPrice)) * 1.1 * Number(quantity),
      createdBy: userId,
      events: [{ status: 'Active', timestamp: new Date(), notes: `Authenticated via Razorpay: ${razorpay_payment_id}` }]
    });

    // Create Invoice (Paid immediately since payment is verified)
    const unitPrice = plan.price + Number(extraPrice);
    const subtotal = unitPrice * Number(quantity);
    const taxRate = 10;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    await Invoice.create({
      invoiceNumber,
      subscription: subscription._id,
      customer: userId,
      items: [{
        description: `Subscription to ${plan.name} (${plan.billingCycle})`,
        quantity: Number(quantity),
        unitPrice: unitPrice,
        total: subtotal
      }],
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'paid', // VERIFIED PAYMENT!
      dueDate: new Date(),
      paidDate: new Date(),
      notes: `Paid via Razorpay. Txn ID: ${razorpay_payment_id}`,
      createdBy: userId,
    });

    return jsonResponse({ 
      message: 'Payment verified and Subscription activated successfully!',
      subscriptionId: subscription._id
    });

  } catch (error: any) {
    console.error('Razorpay Verification Error:', error);
    return errorResponse(error.message || 'Server error', 500);
  }
}
