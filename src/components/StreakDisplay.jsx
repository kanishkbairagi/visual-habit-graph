import { useState, useEffect } from 'react';
import { getStreak } from '../utils/habitData';

const StreakDisplay = ({ habitId, habitName, history }) => {
  const [streak, setStreak] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const currentStreak = getStreak(habitId, history);
    if (currentStreak !== streak) {
      setIsAnimating(true);
      setStreak(currentStreak);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [habitId, history, streak]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm text-slate-400 mb-2">{habitName}</h3>
      <div className="flex items-center gap-2">
        <div className={`text-3xl font-bold transition-all duration-500 ${
          isAnimating ? 'scale-125 text-yellow-400' : 'text-yellow-500'
        }`}>
          🔥
        </div>
        <div className={`text-4xl font-bold transition-all duration-500 ${
          isAnimating ? 'scale-125 text-yellow-400' : 'text-white'
        }`}>
          {streak}
        </div>
        <span className="text-slate-400 text-sm">day streak</span>
      </div>
    </div>
  );
};

export default StreakDisplay;

