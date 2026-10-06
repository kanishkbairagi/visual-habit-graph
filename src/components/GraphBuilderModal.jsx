import React, { useState } from 'react';
import { detectCycleClient } from '../utils/graphAlgorithms';

const GraphBuilderModal = ({
  isOpen,
  onClose,
  nodes,
  edges,
  onAddNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  onResetGraph
}) => {
  const [nodeName, setNodeName] = useState('');
  const [duration, setDuration] = useState('30');
  const [color, setColor] = useState('#3b82f6');
  
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  
  const [cycleError, setCycleError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const handleCreateNode = (e) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    onAddNode({
      name: nodeName.trim(),
      durationMinutes: Number(duration) || 30,
      color,
      position: { x: 250 + Math.random() * 300, y: 150 + Math.random() * 200 }
    });

    setNodeName('');
    setSuccessMessage(`Habit "${nodeName}" added successfully.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreateEdge = (e) => {
    e.preventDefault();
    setCycleError(null);

    if (!sourceNode || !targetNode) return;
    if (sourceNode === targetNode) {
      setCycleError('Self-loops (u -> u) are prohibited in Directed Acyclic Graphs.');
      return;
    }

    // Check existing
    const exists = edges.some(edge => edge.source === sourceNode && edge.target === targetNode);
    if (exists) {
      setCycleError('Dependency edge already exists.');
      return;
    }

    // Test for cycle
    const speculativeEdges = [...edges, { source: sourceNode, target: targetNode }];
    const cycleCheck = detectCycleClient(nodes, speculativeEdges);

    if (cycleCheck.hasCycle) {
      const sourceName = nodes.find(n => n.id === sourceNode)?.name || sourceNode;
      const targetName = nodes.find(n => n.id === targetNode)?.name || targetNode;
      setCycleError(
        `DAG Violation: Edge (${sourceName} → ${targetName}) creates a directed cycle loop: [${cycleCheck.cyclePath?.map(id => nodes.find(n => n.id === id)?.name || id).join(' → ')}]. Deadlocks are rejected!`
      );
      return;
    }

    onAddEdge(sourceNode, targetNode);
    setSuccessMessage('Prerequisite edge created successfully (DAG property preserved).');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xl">
              ⚙️
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Interactive DAG Builder & Cycle Invariant Sandbox
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add habits, establish prerequisite dependencies, and test real-time O(V+E) cycle detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Status Alerts */}
        {cycleError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/50 border border-rose-500/50 text-rose-300 rounded-xl text-xs flex items-start gap-2.5 shadow-lg">
            <span className="text-base">🚫</span>
            <div>
              <div className="font-semibold text-rose-200">Deadlock Prevented (Cycle Detected)</div>
              <div className="mt-0.5 opacity-90">{cycleError}</div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <span>✓</span>
            <div>{successMessage}</div>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Add Dependency Edge with Cycle Prevention */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <span>🔗 Add Prerequisite Dependency (With Real-Time Cycle Detection)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Connect a prerequisite habit to an unlocked habit. The system enforces the DAG invariant using 3-Color DFS.
            </p>
            <form onSubmit={handleCreateEdge} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Prerequisite (Source)</label>
                <select
                  value={sourceNode}
                  onChange={(e) => setSourceNode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Prerequisite...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Unlocks (Target)</label>
                <select
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Target...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!sourceNode || !targetNode}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-xs font-semibold transition"
                >
                  Validate & Connect Edge
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Add New Habit Node */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <span>➕ Create Custom Habit Node</span>
            </h3>
            <form onSubmit={handleCreateNode} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Solve LeetCode Hard"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Duration (Min)</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!nodeName.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-xs font-semibold transition"
                >
                  Add Node
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Active Edges & Dependencies List */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950/80 px-4 py-3 font-semibold text-white border-b border-slate-800 text-xs flex items-center justify-between">
              <span>Active Directed Edges ({edges.length})</span>
              <button
                onClick={onResetGraph}
                className="text-[11px] text-slate-400 hover:text-amber-400 transition"
              >
                ↻ Reset to Default Graph
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 p-2">
              {edges.length === 0 ? (
                <div className="text-xs text-slate-500 p-4 text-center">No dependencies configured.</div>
              ) : (
                edges.map((edge, idx) => {
                  const sName = nodes.find(n => n.id === edge.source)?.name || edge.source;
                  const tName = nodes.find(n => n.id === edge.target)?.name || edge.target;
                  return (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{sName}</span>
                        <span className="text-slate-500 font-bold">→</span>
                        <span className="font-medium text-indigo-300">{tName}</span>
                      </div>
                      <button
                        onClick={() => onDeleteEdge(edge.source, edge.target)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-2 py-1 rounded hover:bg-rose-950/30 transition"
                      >
                        Remove Edge
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphBuilderModal;
