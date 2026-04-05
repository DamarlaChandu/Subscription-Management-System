import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  price: number;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  product: mongoose.Types.ObjectId;
  features: string[];
  minimumQuantity: number;
  startDate: Date | null;
  endDate: Date | null;
  // Plan Options
  autoClose: boolean;
  isClosable: boolean;
  isPausable: boolean;
  isRenewable: boolean;
  trialDays: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    features: [{ type: String }],
    minimumQuantity: { type: Number, default: 1, min: 1 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Plan Options
    autoClose: { type: Boolean, default: false },
    isClosable: { type: Boolean, default: true },
    isPausable: { type: Boolean, default: false },
    isRenewable: { type: Boolean, default: true },
    trialDays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
