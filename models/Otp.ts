import mongoose, { Schema, Document, Model, models } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 minutes
});

OtpSchema.index({ email: 1, otp: 1 });

const Otp: Model<IOtp> = models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
export default Otp;
