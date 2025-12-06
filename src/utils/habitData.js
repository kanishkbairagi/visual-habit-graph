// Initial habit data structure with dependencies
export const initialHabits = [
  {
    id: '1',
    name: 'Wake Up Early',
    description: 'Wake up at 6 AM',
    dependencies: [],
    color: '#3b82f6',
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    name: 'Morning Exercise',
    description: '30 min workout',
    dependencies: ['1'],
    color: '#10b981',
    position: { x: 300, y: 100 },
  },
  {
    id: '3',
    name: 'Meditation',
    description: '10 min meditation',
    dependencies: ['1'],
    color: '#8b5cf6',
    position: { x: 300, y: 250 },
  },
  {
    id: '4',
    name: 'Healthy Breakfast',
    description: 'Nutritious meal',
    dependencies: ['2', '3'],
    color: '#f59e0b',
    position: { x: 500, y: 175 },
  },
  {
    id: '5',
    name: 'Read 30 Pages',
    description: 'Daily reading',
    dependencies: ['4'],
    color: '#ef4444',
    position: { x: 700, y: 175 },
  },
  {
    id: '6',
    name: 'Evening Walk',
    description: '30 min walk',
    dependencies: ['5'],
    color: '#06b6d4',
    position: { x: 900, y: 175 },
  },
];

// Get habit completion history from localStorage
export const getHabitHistory = () => {
  const stored = localStorage.getItem('habitHistory');
  return stored ? JSON.parse(stored) : {};
};

// Save habit completion history to localStorage
export const saveHabitHistory = (history) => {
  localStorage.setItem('habitHistory', JSON.stringify(history));
};

// Check if habit is unlocked based on dependencies
export const isHabitUnlocked = (habit, completedHabits) => {
  return habit.dependencies.every(depId => completedHabits.includes(depId));
};

// Get streak for a habit
export const getStreak = (habitId, history) => {
  const dates = history[habitId] || [];
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map(d => new Date(d))
    .sort((a, b) => b - a);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    date.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (date.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// Get completion count for last 30 days
export const getLast30Days = (habitId, history) => {
  const dates = history[habitId] || [];
  const today = new Date();
  const last30Days = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dateStr = date.toISOString().split('T')[0];
    const isCompleted = dates.some(d => {
      const dDate = new Date(d);
      dDate.setHours(0, 0, 0, 0);
      return dDate.getTime() === date.getTime();
    });
    
    last30Days.push({ date: dateStr, completed: isCompleted });
  }

  return last30Days;
};

