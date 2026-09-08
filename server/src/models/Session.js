import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['live', 'in_person'],
      required: true,
    },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 5000 },
    thumbnail: { type: String, default: '' },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: [true, 'Scheduled date/time is required'] },
    durationMinutes: { type: Number, default: 60, min: 5 },
    capacity: { type: Number, default: null, min: 1 },

    // live-only
    discordInviteUrl: {
      type: String,
      default: '',
      required: [
        function requiredForLive() {
          return this.type === 'live';
        },
        'A Discord invite link is required for live sessions',
      ],
    },

    // in_person-only
    location: {
      type: String,
      default: '',
      required: [
        function requiredForInPerson() {
          return this.type === 'in_person';
        },
        'A location is required for in-person sessions',
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
