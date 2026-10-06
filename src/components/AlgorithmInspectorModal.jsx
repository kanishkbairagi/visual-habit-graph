import React, { useState } from 'react';

const AlgorithmInspectorModal = ({ isOpen, onClose, nodes, edges, algorithms, isBackendConnected }) => {
  const [activeTab, setActiveTab] = useState('complexity');

  if (!isOpen) return null;

  const { cycleDetection, topologicalSort, criticalPath, centrality } = algorithms || {};
  const isDAG = topologicalSort?.isDAG ?? !cycleDetection?.hasCycle;
  const topoOrder = topologicalSort?.order || [];
  const criticalNodes = criticalPath?.criticalPath || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-xl">
              📐
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Graph Theoretical Engine & Architecture Inspector
                </h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  isBackendConnected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {isBackendConnected ? 'MERN Engine Online' : 'Client Algorithmic Runtime'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Formal DAG mathematical model, asymptotic complexity bounds, and system architecture
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          {[
            { id: 'complexity', label: '⚡ Algorithmic Complexity', icon: 'Ω' },
            { id: 'dag-state', label: '📊 Formal Graph State G=(V,E)', icon: 'G' },
            { id: 'cpm', label: '⏱️ Critical Path Method (CPM)', icon: '⏳' },
            { id: 'architecture', label: '🏗️ System Architecture', icon: '🏛️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xs opacity-70">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* TAB 1: COMPLEXITY MATRIX */}
          {activeTab === 'complexity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Total Vertices |V|</div>
                  <div className="text-2xl font-bold text-white mt-1">{nodes.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Disjoint / connected habits</div>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Directed Edges |E|</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">{edges.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Prerequisite relations</div>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">DAG Invariant Status</div>
                  <div className={`text-2xl font-bold mt-1 ${isDAG ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isDAG ? 'Acyclic (Valid)' : 'Deadlock Detected'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Verified via 3-Color DFS</div>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                  <div className="text-xs text-slate-400">Keystone Habit Impact</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {centrality?.maxImpact ?? 0} Nodes
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Downstream reachability</div>
                </div>
              </div>

              {/* Theoretical Complexity Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950/80 px-4 py-3 font-semibold text-white border-b border-slate-800 text-xs tracking-wider uppercase">
                  Rigorous Computational Complexity Bounds
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/40 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Algorithm & Operation</th>
                        <th className="p-3">Formal Approach</th>
                        <th className="p-3">Time Complexity</th>
                        <th className="p-3">Auxiliary Space</th>
                        <th className="p-3">Optimality Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-indigo-300">Cycle Detection</td>
                        <td className="p-3 text-slate-300">3-Color DFS (White/Gray/Black recursion)</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V| + |E|)</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V|)</td>
                        <td className="p-3 text-slate-400">Detects back-edges instantly on edge insertion.</td>
                      </tr>
                      <tr className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-cyan-300">Topological Sort</td>
                        <td className="p-3 text-slate-300">Kahn's In-Degree Zero Queue</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V| + |E|)</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V|)</td>
                        <td className="p-3 text-slate-400">Assigns discrete topological strata for milestones.</td>
                      </tr>
                      <tr className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-amber-300">Critical Path Analysis</td>
                        <td className="p-3 text-slate-300">Forward/Backward DP over DAG</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V| + |E|)</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V|)</td>
                        <td className="p-3 text-slate-400">Calculates Earliest/Latest times and zero-slack bottleneck path.</td>
                      </tr>
                      <tr className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-purple-300">Keystone Centrality</td>
                        <td className="p-3 text-slate-300">Transitive Reachability via BFS</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V|(|V| + |E|))</td>
                        <td className="p-3 font-mono text-emerald-400">O(|V|)</td>
                        <td className="p-3 text-slate-400">Finds node whose completion unlocks maximum downstream graph.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAG STATE */}
          {activeTab === 'dag-state' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span>Linear Topological Ordering (Resolution Queue)</span>
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Every directed edge (u, v) guarantees that node u appears strictly before node v in this topological sequence:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {topoOrder.map((id, index) => {
                    const node = nodes.find(n => n.id === id);
                    return (
                      <React.Fragment key={id}>
                        <span className="px-3 py-1.5 bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-mono">#{index + 1}</span>
                          {node?.name || id}
                        </span>
                        {index < topoOrder.length - 1 && (
                          <span className="text-slate-600 font-bold">→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Node Adjacency and In-Degree Details */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950/80 px-4 py-3 font-semibold text-white border-b border-slate-800 text-xs">
                  Node Invariant & Degree Breakdown
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nodes.map(node => {
                    const inDeg = edges.filter(e => e.target === node.id).length;
                    const outDeg = edges.filter(e => e.source === node.id).length;
                    const stats = centrality?.nodeStats?.[node.id];
                    const isKeystone = stats?.isKeystone;

                    return (
                      <div key={node.id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: node.color }}></span>
                            {node.name}
                            {isKeystone && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded border border-amber-500/40 font-semibold">
                                ★ Keystone
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Duration: {node.durationMinutes || 30} mins | Downstream Reach: {stats?.downstreamCount ?? 0}
                          </div>
                        </div>
                        <div className="text-right text-xs font-mono space-y-0.5">
                          <div className="text-cyan-400">In-Degree: {inDeg}</div>
                          <div className="text-purple-400">Out-Degree: {outDeg}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CRITICAL PATH METHOD */}
          {activeTab === 'cpm' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-600/30">
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                  <span>⚡ Bottleneck Routine Identification (Critical Path)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Using forward-pass and backward-pass dynamic programming, the critical path identifies the sequential sequence of dependent habits with <strong>Zero Slack Time</strong>. Any delay in these habits delays the entire daily milestone.
                </p>
                <div className="mt-4 p-3 bg-slate-950/70 rounded-lg border border-amber-500/30">
                  <div className="text-xs text-amber-300/80 mb-2 font-mono">
                    Critical Chain (Slack = 0):
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {criticalNodes.map((id, index) => {
                      const node = nodes.find(n => n.id === id);
                      return (
                        <React.Fragment key={id}>
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium">
                            {node?.name || id} ({node?.durationMinutes || 30}m)
                          </span>
                          {index < criticalNodes.length - 1 && (
                            <span className="text-amber-500 font-bold">➔</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    Total Cumulative Duration: <span className="text-white font-bold">{criticalPath?.totalDuration || 0} minutes</span>
                  </div>
                </div>
              </div>

              {/* Forward / Backward Pass Schedule Details */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950/80 px-4 py-3 font-semibold text-white border-b border-slate-800 text-xs">
                  Dynamic Programming Schedule (ES, EF, LS, LF, Slack)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-800/40 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 font-sans">Habit</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Earliest Start (ES)</th>
                        <th className="p-2.5">Earliest Finish (EF)</th>
                        <th className="p-2.5">Latest Start (LS)</th>
                        <th className="p-2.5">Latest Finish (LF)</th>
                        <th className="p-2.5">Slack (LF - EF)</th>
                        <th className="p-2.5 font-sans">Critical</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {nodes.map(n => {
                        const metric = criticalPath?.nodeMetrics?.[n.id] || {};
                        const isCrit = metric.isCritical;
                        return (
                          <tr key={n.id} className={isCrit ? 'bg-amber-500/5' : ''}>
                            <td className="p-2.5 font-sans font-medium text-white">{n.name}</td>
                            <td className="p-2.5">{n.durationMinutes || 30}m</td>
                            <td className="p-2.5 text-cyan-400">{metric.es ?? 0}m</td>
                            <td className="p-2.5 text-cyan-400">{metric.ef ?? 0}m</td>
                            <td className="p-2.5 text-purple-400">{metric.ls ?? 0}m</td>
                            <td className="p-2.5 text-purple-400">{metric.lf ?? 0}m</td>
                            <td className={`p-2.5 font-bold ${isCrit ? 'text-amber-400' : 'text-slate-400'}`}>
                              {metric.slack ?? 0}m
                            </td>
                            <td className="p-2.5 font-sans">
                              {isCrit ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  YES
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">No</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800">
                <h3 className="text-white font-semibold mb-3">MERN Stack Multi-Tier System Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-slate-900 rounded-xl border border-blue-500/30">
                    <div className="text-blue-400 font-bold mb-1">Presentation Tier</div>
                    <div className="text-xs text-white">React 18 + D3.js</div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Interactive SVG Canvas, Force simulation, Real-time path animations
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/30">
                    <div className="text-cyan-400 font-bold mb-1">API Controller Tier</div>
                    <div className="text-xs text-white">Node.js / Express</div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      RESTful routes, Middleware validation, Request sanitization
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-xl border border-indigo-500/30">
                    <div className="text-indigo-400 font-bold mb-1">Algorithmic Engine</div>
                    <div className="text-xs text-white">Graph Theory Service</div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      3-Color DFS cycle check, Kahn's topo sort, Critical Path DP
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30">
                    <div className="text-emerald-400 font-bold mb-1">Data Persistence</div>
                    <div className="text-xs text-white">MongoDB + Mongoose</div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Adjacency list schema, Habit completion logs, UTC time consistency
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-white">Why This Impresses Graduate Admissions:</div>
                <p className="text-slate-400 leading-relaxed">
                  Most student portfolios showcase generic CRUD applications. This project treats routine building as a formal <strong>Directed Acyclic Graph (DAG)</strong> optimization problem, combining theoretical algorithmic invariants (\(O(V+E)\) cycle prevention, topological ordering, and dynamic programming bottleneck identification) with a production-grade full-stack architecture.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Engineered for Academic Research & MS in Computer Science Portfolio Showcase
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmInspectorModal;
