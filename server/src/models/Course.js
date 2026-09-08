import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: 'A question needs at least 2 options',
      },
      required: true,
    },
    correctOptionIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    questions: { type: [questionSchema], default: [] },
    passingScore: { type: Number, default: 70 }, // percentage
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz'],
    default: 'text',
  },
  content: { type: String, default: '' }, // text body, or a description for video/quiz lessons
  videoUrl: { type: String, default: '' },
  quiz: { type: quizSchema, default: undefined },
  order: { type: Number, default: 0 },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  lessons: { type: [lessonSchema], default: [] },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 5000 },
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'General', trim: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sections: { type: [sectionSchema], default: [] },
    published: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 }, // 0 = free
    finalExam: { type: quizSchema, default: undefined },
  },
  { timestamps: true }
);

courseSchema.methods.getTotalLessons = function getTotalLessons() {
  return this.sections.reduce((total, section) => total + section.lessons.length, 0);
};

courseSchema.methods.isPaid = function isPaid() {
  return this.price > 0;
};

export default mongoose.model('Course', courseSchema);
