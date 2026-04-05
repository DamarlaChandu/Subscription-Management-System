import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'internal' | 'customer';
  phone?: string;
  company?: string;
  address?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'internal', 'customer'], default: 'customer' },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    address: { type: String, default: '' },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
