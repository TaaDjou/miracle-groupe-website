import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, required: false }, // absent for final-exam attempts
    isFinalExam: { type: Boolean, default: false },
    answers: { type: [Number], required: true }, // selected option index per question, in order
    score: { type: Number, required: true }, // percentage 0-100
    passed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('QuizAttempt', quizAttemptSchema);
