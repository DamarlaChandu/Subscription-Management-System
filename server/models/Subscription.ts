import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderLine {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  amount: number;
}

export interface ISubscription extends Document {
  subscriptionNumber: string;
  customer: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'Draft' | 'Quotation' | 'Confirmed' | 'Active' | 'Suspended' | 'Closed';
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date;
  paymentTerm: string;
  orderLines: IOrderLine[];
  totalAmount: number;
  createdBy: mongoose.Types.ObjectId;
}

const OrderLineSchema = new Schema<IOrderLine>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  amount: { type: Number, required: true },
});

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Suspended', 'Closed'],
      default: 'Draft',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextBillingDate: { type: Date },
    paymentTerm: { type: String, default: 'NET 30' },
    orderLines: [OrderLineSchema],
    totalAmount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Pre-save hook for auto-generating subscription number sequentially
SubscriptionSchema.pre('validate', async function (next) {
  if (this.isNew) {
    try {
      const lastSub = await mongoose.model('Subscription').findOne().sort({ createdAt: -1 });
      let nextNum = 1;

      if (lastSub && lastSub.subscriptionNumber) {
        const lastNum = parseInt(lastSub.subscriptionNumber.split('-')[1]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }

      this.subscriptionNumber = `SUB-${nextNum.toString().padStart(4, '0')}`;
    } catch (err) {
      return next(err as any);
    }
  }
  next();
});

// Middleware to calculate amounts
SubscriptionSchema.pre('save', function (next) {
  this.totalAmount = this.orderLines.reduce((acc, line) => {
    line.amount = (line.quantity * line.unitPrice) - line.discount + line.tax;
    return acc + line.amount;
  }, 0);
  next();
});

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
