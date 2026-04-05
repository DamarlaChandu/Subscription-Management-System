import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  _id?: string | mongoose.Types.ObjectId;
  attribute: string;
  value: string;
  extraPrice: number;
}

export interface IRecurringPlan {
  _id?: string | mongoose.Types.ObjectId;
  planName: string;
  billingCycle: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  price: number;
  minQuantity: number;
  startDate?: Date;
  endDate?: Date;
  status: 'Active' | 'Paused' | 'Closed';
}

export interface IProduct extends Document {
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  sku?: string;
  description?: string;
  isActive: boolean;
  variants: IProductVariant[];
  recurringPlans: IRecurringPlan[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  attribute: { type: String, required: true },
  value: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
});

const RecurringPlanSchema = new Schema<IRecurringPlan>({
  planName: { type: String, required: true },
  billingCycle: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'], required: true },
  price: { type: Number, required: true, min: 0 },
  minQuantity: { type: Number, default: 1, min: 1 },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Paused', 'Closed'], default: 'Active' },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    salesPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    variants: [ProductVariantSchema],
    recurringPlans: [RecurringPlanSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
