import Subscription from '../models/Subscription';
import { z } from 'zod';

// Validation Schema
const lineSchema = z.object({
  product: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
});

const subscriptionCreateSchema = z.object({
  customer: z.string(),
  plan: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  paymentTerm: z.string().optional(),
  orderLines: z.array(lineSchema).min(1),
});

// Helper for Mock Invoice
const triggerInvoiceCreation = (subscription) => {
  console.log(`[EVENT] Invoice automatically generated for ${subscription.subscriptionNumber}`);
  console.log(`[EVENT] Client: ${subscription.customer} | Total: ₹${subscription.totalAmount}`);
};

export const createSubscription = async (req, res, next) => {
  try {
    const validated = subscriptionCreateSchema.parse(req.body);
    const subscription = new Subscription({
      ...validated,
      createdBy: req.user.userId,
      status: 'Draft',
    });

    await subscription.save();
    res.status(201).json({ success: true, data: subscription });
  } catch (err) { next(err); }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { subscriptionNumber: { $regex: search, $options: 'i' } },
        { customer: search }, // Simplified customer search
      ];
    }

    const subscriptions = await Subscription.find(query)
      .populate('customer', 'name email')
      .populate('plan')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Subscription.countDocuments(query);
    res.status(200).json({ success: true, data: subscriptions, total: count });
  } catch (err) { next(err); }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customer', 'name email company phone')
      .populate('plan')
      .populate('orderLines.product');

    if (!subscription) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: subscription });
  } catch (err) { next(err); }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Not found' });

    if (subscription.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only Draft subscriptions can be edited' });
    }

    Object.assign(subscription, req.body);
    await subscription.save();
    res.status(200).json({ success: true, data: subscription });
  } catch (err) { next(err); }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Not found' });

    if (subscription.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only Draft subscriptions can be deleted' });
    }

    await subscription.deleteOne();
    res.status(200).json({ success: true, message: 'Subscription deleted' });
  } catch (err) { next(err); }
};

// State Transitions
const transitionStatus = async (req, res, next, from, to, onConfirm = null) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) return res.status(404).json({ success: false, message: 'Not found' });

        if (subscription.status !== from) {
            return res.status(400).json({ success: false, message: `Invalid transition from ${subscription.status} to ${to}` });
        }

        subscription.status = to;
        if (onConfirm) onConfirm(subscription);
        await subscription.save();
        res.status(200).json({ success: true, data: subscription });
    } catch (err) { next(err); }
};

export const convertToQuotation = (req, res, next) => transitionStatus(req, res, next, 'Draft', 'Quotation');
export const confirmSubscription = (req, res, next) => transitionStatus(req, res, next, 'Quotation', 'Confirmed');
export const activateSubscription = (req, res, next) => transitionStatus(req, res, next, 'Confirmed', 'Active', triggerInvoiceCreation);
export const suspendSubscription = (req, res, next) => transitionStatus(req, res, next, 'Active', 'Suspended');
export const closeSubscription = (req, res, next) => {
    try {
        // Can be closed from Active or Suspended
        Subscription.findById(req.params.id).then(sub => {
            if (!['Active', 'Suspended'].includes(sub.status)) {
                return res.status(400).json({ success: false, message: 'Cannot close non-active subscription' });
            }
            sub.status = 'Closed';
            sub.save().then(s => res.status(200).json({ success: true, data: s }));
        });
    } catch (err) { next(err); }
};
