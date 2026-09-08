import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 150 },
    thumbnail: { type: String, default: '' },
    location: { type: String, default: '', trim: true },
    capacity: { type: Number, required: [true, 'Capacity is required'], min: 1 },
    amenities: { type: [String], default: [] },
    pricePerHour: { type: Number, required: [true, 'Price per hour is required'], min: 0 },
    description: { type: String, default: '', maxlength: 2000 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Classroom', classroomSchema);
