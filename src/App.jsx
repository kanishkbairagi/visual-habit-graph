import { useState, useEffect } from 'react';
import HabitGraph from './components/HabitGraph';
import StreakDisplay from './components/StreakDisplay';
import ProgressHeatmap from './components/ProgressHeatmap';
import {
  initialHabits,
  getHabitHistory,
  saveHabitHistory,
  isHabitUnlocked,
} from './utils/habitData';

function App() {
  const [habits, setHabits] = useState(initialHabits);
  const [completedHabits, setCompletedHabits] = useState([]);
  const [history, setHistory] = useState({});
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    const savedHistory = getHabitHistory();
    setHistory(savedHistory);
    
    // Load completed habits from today
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = Object.keys(savedHistory).filter(habitId => {
      const dates = savedHistory[habitId] || [];
      return dates.some(d => d.startsWith(today));
    });
    setCompletedHabits(todayCompleted);
  }, []);

  const handleHabitClick = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !isHabitUnlocked(habit, completedHabits)) return;

    const today = new Date().toISOString().split('T')[0];
    const updatedHistory = { ...history };
    
    if (!updatedHistory[habitId]) {
      updatedHistory[habitId] = [];
    }

    // Toggle completion for today
    const todayIndex = updatedHistory[habitId].findIndex(d => d.startsWith(today));
    
    if (todayIndex >= 0) {
      // Remove completion
      updatedHistory[habitId].splice(todayIndex, 1);
      setCompletedHabits(prev => prev.filter(id => id !== habitId));
    } else {
      // Add completion
      updatedHistory[habitId].push(new Date().toISOString());
      setCompletedHabits(prev => [...prev, habitId]);
    }

    setHistory(updatedHistory);
    saveHabitHistory(updatedHistory);
  };

  const handleNodeSelect = (habitId) => {
    setSelectedHabit(habitId);
  };

  const selectedHabitData = habits.find(h => h.id === selectedHabit);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Visual Habit Graph
          </h1>
          <p className="text-slate-400">
            Complete habits to unlock new ones. Click on unlocked habits to mark them complete.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <HabitGraph
                habits={habits}
                completedHabits={completedHabits}
                onHabitClick={handleHabitClick}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Today's Progress</h2>
              <div className="space-y-2">
                {habits.map(habit => {
                  const unlocked = isHabitUnlocked(habit, completedHabits);
                  const completed = completedHabits.includes(habit.id);
                  
                  return (
                    <div
                      key={habit.id}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        !unlocked
                          ? 'bg-slate-800 border-slate-700 opacity-50'
                          : completed
                          ? 'bg-green-900/30 border-green-500'
                          : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => handleNodeSelect(habit.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{habit.name}</span>
                        {!unlocked && (
                          <span className="text-xs text-slate-500">🔒</span>
                        )}
                        {unlocked && completed && (
                          <span className="text-xs text-green-400">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {selectedHabitData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <StreakDisplay
              habitId={selectedHabitData.id}
              habitName={selectedHabitData.name}
              history={history}
            />
            <ProgressHeatmap
              habitId={selectedHabitData.id}
              habitName={selectedHabitData.name}
              history={history}
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <StreakDisplay
                habitId={habit.id}
                habitName={habit.name}
                history={history}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <div key={habit.id}>
              <ProgressHeatmap
                habitId={habit.id}
                habitName={habit.name}
                history={history}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

