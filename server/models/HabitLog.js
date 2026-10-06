import mongoose from 'mongoose';

const HabitLogSchema = new mongoose.Schema({
  userId: { type: String, default: 'demo-user', index: true },
  habitId: { type: String, required: true, index: true },
  completedDate: { type: String, required: true }, // Format: YYYY-MM-DD (ISO date UTC normalized)
  completedAt: { type: Date, default: Date.now },
  streakCountAtTime: { type: Number, default: 1 }
}, {
  timestamps: true
});

HabitLogSchema.index({ userId: 1, habitId: 1, completedDate: 1 }, { unique: true });

export default mongoose.models.HabitLog || mongoose.model('HabitLog', HabitLogSchema);
