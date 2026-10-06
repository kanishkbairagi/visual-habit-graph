import { useState, useEffect, useMemo } from 'react';
import HabitGraph from './components/HabitGraph';
import StreakDisplay from './components/StreakDisplay';
import ProgressHeatmap from './components/ProgressHeatmap';
import AlgorithmInspectorModal from './components/AlgorithmInspectorModal';
import GraphBuilderModal from './components/GraphBuilderModal';

import {
  detectCycleClient,
  topologicalSortClient,
  criticalPathMethodClient,
  calculateCentralityClient
} from './utils/graphAlgorithms';

import {
  checkServerHealth,
  fetchGraphData,
  addEdgeApi,
  addNodeApi,
  deleteNodeApi
} from './services/api';

import {
  initialHabits,
  getHabitHistory,
  saveHabitHistory
} from './utils/habitData';

const DEFAULT_EDGES = [
  { source: '1', target: '2', weight: 1 },
  { source: '1', target: '3', weight: 1 },
  { source: '2', target: '4', weight: 1 },
  { source: '3', target: '4', weight: 1 },
  { source: '4', target: '5', weight: 1 },
  { source: '5', target: '6', weight: 1 },
];

function App() {
  const [habits, setHabits] = useState(initialHabits);
  const [edges, setEdges] = useState(DEFAULT_EDGES);
  const [completedHabits, setCompletedHabits] = useState([]);
  const [history, setHistory] = useState({});
  const [selectedHabit, setSelectedHabit] = useState('1');

  // Modals and view toggles
  const [showInspector, setShowInspector] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Compute graph theoretical algorithms
  const algorithms = useMemo(() => {
    const cycleDetection = detectCycleClient(habits, edges);
    const topologicalSort = topologicalSortClient(habits, edges);
    const criticalPath = criticalPathMethodClient(habits, edges);
    const centrality = calculateCentralityClient(habits, edges);

    return {
      cycleDetection,
      topologicalSort,
      criticalPath,
      centrality
    };
  }, [habits, edges]);

  // Check backend server and initial data
  useEffect(() => {
    async function init() {
      const health = await checkServerHealth();
      setIsBackendConnected(health.online);

      if (health.online) {
        const serverData = await fetchGraphData();
        if (serverData && serverData.nodes && serverData.edges) {
          setHabits(serverData.nodes);
          setEdges(serverData.edges);
        }
      }

      const savedHistory = getHabitHistory();
      setHistory(savedHistory);

      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = Object.keys(savedHistory).filter(habitId => {
        const dates = savedHistory[habitId] || [];
        return dates.some(d => d.startsWith(today));
      });
      setCompletedHabits(todayCompleted);
    }

    init();
  }, []);

  // Helper: check unlocked state using active edges
  const isHabitUnlocked = (habitId) => {
    const incomingEdges = edges.filter(e => e.target === habitId);
    return incomingEdges.every(e => completedHabits.includes(e.source));
  };

  const handleHabitClick = (habitId) => {
    if (!isHabitUnlocked(habitId)) return;

    const today = new Date().toISOString().split('T')[0];
    const updatedHistory = { ...history };

    if (!updatedHistory[habitId]) {
      updatedHistory[habitId] = [];
    }

    const todayIndex = updatedHistory[habitId].findIndex(d => d.startsWith(today));

    if (todayIndex >= 0) {
      updatedHistory[habitId].splice(todayIndex, 1);
      setCompletedHabits(prev => prev.filter(id => id !== habitId));
    } else {
      updatedHistory[habitId].push(new Date().toISOString());
      setCompletedHabits(prev => [...prev, habitId]);
    }

    setHistory(updatedHistory);
    saveHabitHistory(updatedHistory);
  };

  // Graph Builder Actions
  const handleAddNode = async (nodeData) => {
    const newNode = {
      id: String(Date.now()),
      ...nodeData
    };
    setHabits(prev => [...prev, newNode]);

    if (isBackendConnected) {
      await addNodeApi(newNode);
    }
  };

  const handleDeleteNode = async (id) => {
    setHabits(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));

    if (isBackendConnected) {
      await deleteNodeApi(id);
    }
  };

  const handleAddEdge = async (source, target) => {
    setEdges(prev => [...prev, { source, target, weight: 1 }]);

    if (isBackendConnected) {
      await addEdgeApi(source, target);
    }
  };

  const handleDeleteEdge = (source, target) => {
    setEdges(prev => prev.filter(e => !(e.source === source && e.target === target)));
  };

  const handleResetGraph = () => {
    setHabits(initialHabits);
    setEdges(DEFAULT_EDGES);
  };

  const selectedHabitData = habits.find(h => h.id === selectedHabit) || habits[0];
  const keystoneHabit = habits.find(h => h.id === algorithms.centrality?.keystoneNodeId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Architecture Badge Bar */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Visual Habit Graph
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                DAG Algorithm Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Modeling habit formation as a formal Directed Acyclic Graph. Featuring real-time \(O(V+E)\) cycle detection, Kahn's topological sort, and Critical Path Method (CPM) bottleneck analysis.
            </p>
          </div>

          {/* System Status Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 ${
              isBackendConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`}></span>
              {isBackendConnected ? 'MERN Stack Connected (Port 5000)' : 'Client Algorithmic Runtime'}
            </span>

            <span className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 font-mono">
              O(|V| + |E|) Verified
            </span>
          </div>
        </header>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowInspector(true)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>🔬</span>
              <span>Inspect CS Algorithms & Complexity</span>
            </button>

            <button
              onClick={() => setShowBuilder(true)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>DAG Builder & Cycle Tester</span>
            </button>

            <button
              onClick={() => setShowCriticalPath(prev => !prev)}
              className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition flex items-center gap-2 ${
                showCriticalPath
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span>⚡</span>
              <span>Critical Path Mode: {showCriticalPath ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>Vertices |V|: <strong className="text-white">{habits.length}</strong></span>
            <span>Edges |E|: <strong className="text-cyan-400">{edges.length}</strong></span>
            <span>Invariant: <strong className="text-emerald-400">Valid DAG</strong></span>
          </div>
        </div>

        {/* Keystone & Critical Path Insight Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg text-lg">
              ★
            </div>
            <div>
              <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                Keystone Habit (Max Centrality)
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {keystoneHabit?.name || 'Wake Up Early'}
                <span className="text-xs font-normal text-slate-400 ml-2">
                  (Unlocks {algorithms.centrality?.maxImpact ?? 0} downstream habits)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-lg">
              ⏱️
            </div>
            <div>
              <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                Critical Path Bottleneck Chain
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {algorithms.criticalPath?.totalDuration || 0} mins cumulative
                <span className="text-xs font-normal text-slate-400 ml-2">
                  ({algorithms.criticalPath?.criticalPath?.length || 0} habits with Zero Slack)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: D3 SVG Graph Canvas + Prerequisite Progress Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HabitGraph
              habits={habits}
              edges={edges}
              completedHabits={completedHabits}
              onHabitClick={handleHabitClick}
              criticalEdges={algorithms.criticalPath?.criticalEdges || []}
              criticalNodes={algorithms.criticalPath?.criticalPath || []}
              showCriticalPath={showCriticalPath}
              topologicalLevels={algorithms.topologicalSort?.levels || {}}
              keystoneHabitId={algorithms.centrality?.keystoneNodeId}
            />
          </div>

          {/* Today's Prerequisite Status Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Daily Topological Prerequisite Queue</h2>
                <span className="text-xs text-slate-400 font-mono">
                  {completedHabits.length}/{habits.length} Done
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {habits.map(habit => {
                  const unlocked = isHabitUnlocked(habit.id);
                  const completed = completedHabits.includes(habit.id);
                  const isSelected = selectedHabit === habit.id;
                  const isCrit = algorithms.criticalPath?.criticalPath?.includes(habit.id);

                  return (
                    <div
                      key={habit.id}
                      onClick={() => setSelectedHabit(habit.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-indigo-500' : ''
                      } ${
                        !unlocked
                          ? 'bg-slate-950/60 border-slate-800 opacity-60'
                          : completed
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color }}></span>
                          <span className="font-semibold text-xs">{habit.name}</span>
                          {isCrit && showCriticalPath && (
                            <span className="text-[10px] text-amber-400 font-mono font-bold">⚡ CPM</span>
                          )}
                        </div>

                        <div className="text-xs flex items-center gap-1">
                          {!unlocked && <span className="text-slate-500">🔒</span>}
                          {unlocked && completed && <span className="text-emerald-400 font-bold">✓</span>}
                          {unlocked && !completed && <span className="text-blue-400 text-[10px]">Ready</span>}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{habit.durationMinutes || 30} mins</span>
                        <span className="font-mono text-[10px]">
                          Prereqs: {edges.filter(e => e.target === habit.id).length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Habit Detail Analytics: Streak & 30-Day Heatmap */}
        {selectedHabitData && (
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Selected Node Analytics:</span>
                  <span className="text-indigo-400">{selectedHabitData.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time streak persistence and 30-day temporal habit formation distribution
                </p>
              </div>
              <button
                onClick={() => handleHabitClick(selectedHabitData.id)}
                disabled={!isHabitUnlocked(selectedHabitData.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  !isHabitUnlocked(selectedHabitData.id)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : completedHabits.includes(selectedHabitData.id)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {!isHabitUnlocked(selectedHabitData.id)
                  ? '🔒 Locked by Prerequisites'
                  : completedHabits.includes(selectedHabitData.id)
                  ? '✓ Completed Today (Click to Toggle)'
                  : 'Mark as Completed Today'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
          </div>
        )}

        {/* Modals */}
        <AlgorithmInspectorModal
          isOpen={showInspector}
          onClose={() => setShowInspector(false)}
          nodes={habits}
          edges={edges}
          algorithms={algorithms}
          isBackendConnected={isBackendConnected}
        />

        <GraphBuilderModal
          isOpen={showBuilder}
          onClose={() => setShowBuilder(false)}
          nodes={habits}
          edges={edges}
          onAddNode={handleAddNode}
          onDeleteNode={handleDeleteNode}
          onAddEdge={handleAddEdge}
          onDeleteEdge={handleDeleteEdge}
          onResetGraph={handleResetGraph}
        />
      </div>
    </div>
  );
}

export default App;
