import { getLast30Days } from '../utils/habitData';

const ProgressHeatmap = ({ habitId, habitName, history }) => {
  const days = getLast30Days(habitId, history);

  const getIntensity = (completed) => {
    return completed ? 'bg-green-500' : 'bg-slate-700';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm text-slate-400 mb-3">{habitName} - Last 30 Days</h3>
      <div className="flex gap-1 flex-wrap">
        {days.map((day, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded transition-all duration-300 hover:scale-125 ${
              getIntensity(day.completed)
            }`}
            title={`${day.date}: ${day.completed ? 'Completed' : 'Not completed'}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-700"></div>
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressHeatmap;

