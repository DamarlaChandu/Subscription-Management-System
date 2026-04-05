import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Invoice from '@/models/Invoice';
import Plan from '@/models/Plan';
import { getAuthFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse, generateInvoiceNumber } from '@/lib/helpers';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const user = await getAuthFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { id, action } = await params;
    
    // RBAC: Only Admin or Staff can trigger lifecycle changes
    if (!['admin', 'internal'].includes(user.role)) {
       return errorResponse('Forbidden: Staff only', 403);
    }

    const subscription = await Subscription.findById(id);

    if (!subscription) return errorResponse('Subscription not found', 404);

    // Business Logic Engine: Lifecycle Rules
    const current = subscription.status;
    let nextStatus = '';

    switch (action) {
      case 'quotation':
        if (current !== 'Draft') return errorResponse('Only Drafts can become Quotations', 400);
        nextStatus = 'Quotation';
        break;
      case 'confirm':
        if (current !== 'Quotation') return errorResponse('Only Quotations can be Confirmed', 400);
        nextStatus = 'Confirmed';
        break;
      case 'activate':
        if (current !== 'Confirmed') return errorResponse('Only Confirmed orders can be Activated', 400);
        nextStatus = 'Active';
        
        // Automated Billing Engine: Create first invoice
        const invoice = await Invoice.create({
          invoiceNumber: generateInvoiceNumber(),
          subscription: subscription._id,
          customer: subscription.customer,
          description: `Subscription activation invoice: ${subscription.subscriptionNumber}`,
          items: subscription.orderLines.length > 0 
            ? subscription.orderLines.map((line: any) => ({
                description: `Recurring Service Charge`,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                total: (line.quantity * line.unitPrice) - (line.discount || 0) + (line.tax || 0)
              }))
            : [{
                description: 'Monthly Plan Subscription',
                quantity: 1,
                unitPrice: subscription.totalAmount,
                total: subscription.totalAmount
              }],
          subtotal: subscription.totalAmount,
          total: subscription.totalAmount,
          status: 'confirmed',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days NET
          createdBy: user.userId
        });
        console.log(`Automated Invoice Created: ${invoice.invoiceNumber}`);
        break;
      case 'suspend':
        if (current !== 'Active') return errorResponse('Only Active subscriptions can be Suspended', 400);
        nextStatus = 'Suspended';
        break;
      case 'resume':
        if (current !== 'Suspended') return errorResponse('Only Suspended subscriptions can be Resumed', 400);
        nextStatus = 'Active';
        break;
      case 'close':
        if (!['Active', 'Suspended'].includes(current)) return errorResponse('Cannot close non-active subscription', 400);
        nextStatus = 'Closed';
        break;
      default:
        return errorResponse('Invalid lifecycle action', 400);
    }

    subscription.status = nextStatus;
    subscription.events.push({ 
        status: nextStatus, 
        timestamp: new Date(), 
        user: user.userId, 
        notes: `System lifecycle event: ${action}` 
    });
    await subscription.save();

    return jsonResponse({ 
      success: true, 
      message: `State transition to ${nextStatus} successful`, 
      subscription 
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
