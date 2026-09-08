import mongoose from 'mongoose';

const classroomBookingSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    purpose: { type: String, default: '', maxlength: 1000 },
    headcount: { type: Number, default: 1, min: 1 },
    estimatedPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model('ClassroomBooking', classroomBookingSchema);
