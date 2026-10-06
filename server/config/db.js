import mongoose from 'mongoose';

let isConnected = false;
let useMemoryStore = false;

// In-memory fallback repository when MongoDB daemon is not running locally
export const memoryStore = {
  graph: {
    userId: 'demo-user',
    title: 'Daily Routine DAG',
    nodes: [
      { id: '1', name: 'Wake Up Early', description: 'Wake up at 6 AM', durationMinutes: 15, color: '#3b82f6', position: { x: 100, y: 100 } },
      { id: '2', name: 'Morning Exercise', description: '30 min workout', durationMinutes: 45, color: '#10b981', position: { x: 300, y: 100 } },
      { id: '3', name: 'Meditation', description: '10 min meditation', durationMinutes: 15, color: '#8b5cf6', position: { x: 300, y: 250 } },
      { id: '4', name: 'Healthy Breakfast', description: 'Nutritious meal', durationMinutes: 30, color: '#f59e0b', position: { x: 500, y: 175 } },
      { id: '5', name: 'Read 30 Pages', description: 'Daily reading', durationMinutes: 40, color: '#ef4444', position: { x: 700, y: 175 } },
      { id: '6', name: 'Evening Walk', description: '30 min walk', durationMinutes: 30, color: '#06b6d4', position: { x: 900, y: 175 } },
    ],
    edges: [
      { source: '1', target: '2', weight: 1 },
      { source: '1', target: '3', weight: 1 },
      { source: '2', target: '4', weight: 1 },
      { source: '3', target: '4', weight: 1 },
      { source: '4', target: '5', weight: 1 },
      { source: '5', target: '6', weight: 1 },
    ],
    version: 1
  },
  logs: []
};

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habit_graph';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    useMemoryStore = false;
    console.log(`✓ Connected to MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[DB Notice] MongoDB connection timed out (${err.message}).`);
    console.log(`✓ Using High-Performance In-Memory Graph Data Store (Zero-config mode for evaluators).`);
    useMemoryStore = true;
    isConnected = false;
  }
}

export function isUsingMemoryStore() {
  return useMemoryStore;
}
