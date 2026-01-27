import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  customerName: string;
  serviceId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  appointmentDate: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'waiting';
  queuePosition?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'waiting'],
      default: 'waiting',
    },
    queuePosition: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
