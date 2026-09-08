import mongoose from 'mongoose';

const coursePurchaseSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 }, // snapshot of course.price at request time
    status: {
      type: String,
      enum: ['pending', 'paid', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model('CoursePurchase', coursePurchaseSchema);
