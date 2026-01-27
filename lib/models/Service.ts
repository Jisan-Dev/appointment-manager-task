import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  duration: number; // in minutes
  requiredStaffType: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
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
    duration: {
      type: Number,
      required: true,
      enum: [15, 30, 60],
    },
    requiredStaffType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
