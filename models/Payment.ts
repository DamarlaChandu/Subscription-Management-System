import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  invoice: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'cash' | 'upi' | 'other';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes: string;
  paidAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash', 'upi', 'other'],
      default: 'bank_transfer',
    },
    transactionId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
