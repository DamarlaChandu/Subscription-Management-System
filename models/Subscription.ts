import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderLine {
  _id?: string | mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  amount: number;
}

export interface ISubscription extends Document {
  subscriptionId?: string; // For backward compat with database indexes
  subscriptionNumber: string;
  customer: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  plan?: mongoose.Types.ObjectId;
  subscriptionType: 'Standard' | 'Custom' | 'Trial' | 'Promo' | 'Enterprise';
  status: 'Draft' | 'Quotation' | 'Confirmed' | 'Active' | 'Suspended' | 'Closed';
  startDate: Date;
  expirationDate: Date;
  nextBillingDate?: Date;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentTerm: string;
  orderLines: IOrderLine[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  events: Array<{ status: string; timestamp: Date; user?: string; notes?: string }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderLineSchema = new Schema<IOrderLine>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  amount: { type: Number, required: true, min: 0 },
});

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionId: { type: String, unique: true, sparse: true },
    subscriptionNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: false },
    subscriptionType: {
      type: String,
      enum: ['Standard', 'Custom', 'Trial', 'Promo', 'Enterprise'],
      default: 'Standard',
    },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Suspended', 'Closed'],
      default: 'Draft',
    },
    startDate: { type: Date, required: true },
    expirationDate: { type: Date, required: true },
    nextBillingDate: { type: Date },
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    paymentTerm: { type: String, default: 'NET 30' },
    orderLines: [OrderLineSchema],
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    events: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for Scalability (NFR Compliance)
SubscriptionSchema.index({ subscriptionNumber: 1 });
SubscriptionSchema.index({ customer: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
