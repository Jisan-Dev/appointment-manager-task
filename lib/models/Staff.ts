import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  serviceType: string;
  dailyCapacity: number;
  availability: 'available' | 'on_leave';
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    dailyCapacity: {
      type: Number,
      default: 5,
      min: 1,
    },
    availability: {
      type: String,
      enum: ['available', 'on_leave'],
      default: 'available',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);
