import mongoose from 'mongoose';

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  durationMinutes: { type: Number, default: 30 },
  color: { type: String, default: '#3b82f6' },
  position: {
    x: { type: Number, default: 200 },
    y: { type: Number, default: 200 }
  }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
  weight: { type: Number, default: 1 }
}, { _id: false });

const HabitGraphSchema = new mongoose.Schema({
  userId: { type: String, default: 'demo-user', index: true },
  title: { type: String, default: 'Daily Routine DAG' },
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

export default mongoose.models.HabitGraph || mongoose.model('HabitGraph', HabitGraphSchema);
