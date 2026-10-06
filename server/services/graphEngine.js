/**
 * Graph Algorithms Engine for Directed Acyclic Graphs (DAG)
 * Visual Habit Graph - MS CS Portfolio Core
 * 
 * Theoretical Complexity:
 * - Cycle Detection: O(V + E) time, O(V) space (3-Color DFS)
 * - Topological Sort: O(V + E) time, O(V) space (Kahn's Algorithm)
 * - Critical Path Method: O(V + E) time, O(V) space (Dynamic Programming over DAG)
 * - Centrality Analytics: O(V + E) time, O(V) space
 */

/**
 * 3-Color Depth-First Search for Directed Cycle Detection
 * Node states:
 * 0 (WHITE): Unvisited
 * 1 (GRAY): Currently visiting in recursion stack (Back-edge detection)
 * 2 (BLACK): Fully visited
 * 
 * @param {Array} nodes - Array of node objects [{ id, name, ... }]
 * @param {Array} edges - Array of edge objects [{ source, target, ... }]
 * @returns {Object} { hasCycle: boolean, cyclePath: Array<string> | null }
 */
export function detectCycle(nodes, edges) {
  const adj = new Map();
  nodes.forEach(node => adj.set(node.id, []));
  edges.forEach(edge => {
    if (adj.has(edge.source)) {
      adj.get(edge.source).push(edge.target);
    }
  });

  const state = new Map(); // 0: White, 1: Gray, 2: Black
  const parent = new Map();
  nodes.forEach(node => state.set(node.id, 0));

  let cycleNodes = null;

  function dfs(u) {
    state.set(u, 1); // Gray

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!state.has(v)) continue;

      if (state.get(v) === 1) {
        // Back-edge detected! Reconstruct cycle
        cycleNodes = [v, u];
        let curr = u;
        while (curr !== v && parent.has(curr)) {
          curr = parent.get(curr);
          cycleNodes.push(curr);
          if (curr === v) break;
        }
        cycleNodes.reverse();
        return true;
      }

      if (state.get(v) === 0) {
        parent.set(v, u);
        if (dfs(v)) return true;
      }
    }

    state.set(u, 2); // Black
    return false;
  }

  for (const node of nodes) {
    if (state.get(node.id) === 0) {
      if (dfs(node.id)) {
        return { hasCycle: true, cyclePath: cycleNodes };
      }
    }
  }

  return { hasCycle: false, cyclePath: null };
}

/**
 * Kahn's Algorithm for Topological Sort & Layer Assignment
 * Computes deterministic resolution order and discrete topological depth levels.
 * 
 * @param {Array} nodes 
 * @param {Array} edges 
 * @returns {Object} { order: Array<string>, levels: Object, isDAG: boolean }
 */
export function topologicalSort(nodes, edges) {
  const inDegree = new Map();
  const adj = new Map();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    if (adj.has(e.source)) {
      adj.get(e.source).push(e.target);
    }
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, inDegree.get(e.target) + 1);
    }
  });

  // Queue of nodes with zero in-degree
  const queue = [];
  const levels = {};
  
  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
      levels[n.id] = 0;
    }
  });

  const order = [];

  while (queue.length > 0) {
    const u = queue.shift();
    order.push(u);
    const currLevel = levels[u] ?? 0;

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      inDegree.set(v, inDegree.get(v) - 1);
      // Topological level is max distance from any root
      levels[v] = Math.max(levels[v] || 0, currLevel + 1);

      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }

  const isDAG = order.length === nodes.length;

  return {
    order,
    levels,
    isDAG,
    unprocessedCount: nodes.length - order.length
  };
}

/**
 * Critical Path Method (CPM) using Dynamic Programming over DAG
 * Identifies the longest dependency chain and bottleneck habits in terms of time / difficulty.
 * 
 * @param {Array} nodes 
 * @param {Array} edges 
 * @returns {Object} { criticalPath: Array<string>, criticalEdges: Array<Object>, totalDuration: number, nodeMetrics: Object }
 */
export function criticalPathMethod(nodes, edges) {
  const { order, isDAG } = topologicalSort(nodes, edges);
  if (!isDAG || nodes.length === 0) {
    return { criticalPath: [], criticalEdges: [], totalDuration: 0, nodeMetrics: {} };
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map();
  const revAdj = new Map();

  nodes.forEach(n => {
    adj.set(n.id, []);
    revAdj.set(n.id, []);
  });

  edges.forEach(e => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
    if (revAdj.has(e.target)) revAdj.get(e.target).push(e.source);
  });

  // Forward Pass: Earliest Start (ES) and Earliest Finish (EF)
  const es = new Map();
  const ef = new Map();

  for (const u of order) {
    const node = nodeMap.get(u);
    const duration = node?.durationMinutes || 30; // default 30 min duration weight

    const predecessors = revAdj.get(u) || [];
    let maxPredecessorEF = 0;
    for (const p of predecessors) {
      maxPredecessorEF = Math.max(maxPredecessorEF, ef.get(p) || 0);
    }

    es.set(u, maxPredecessorEF);
    ef.set(u, maxPredecessorEF + duration);
  }

  // Maximum project duration
  let maxProjectDuration = 0;
  nodes.forEach(n => {
    maxProjectDuration = Math.max(maxProjectDuration, ef.get(n.id) || 0);
  });

  // Backward Pass: Latest Finish (LF) and Latest Start (LS)
  const lf = new Map();
  const ls = new Map();

  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i];
    const node = nodeMap.get(u);
    const duration = node?.durationMinutes || 30;

    const successors = adj.get(u) || [];
    if (successors.length === 0) {
      lf.set(u, maxProjectDuration);
    } else {
      let minSuccessorLS = Infinity;
      for (const s of successors) {
        minSuccessorLS = Math.min(minSuccessorLS, ls.get(s) ?? maxProjectDuration);
      }
      lf.set(u, minSuccessorLS);
    }

    ls.set(u, (lf.get(u) ?? maxProjectDuration) - duration);
  }

  // Calculate Slack = LF - EF (or LS - ES)
  // Critical Path has Slack === 0
  const criticalNodes = [];
  const nodeMetrics = {};

  nodes.forEach(n => {
    const u = n.id;
    const slack = (lf.get(u) || 0) - (ef.get(u) || 0);
    const isCritical = Math.abs(slack) < 0.001;

    nodeMetrics[u] = {
      es: es.get(u) || 0,
      ef: ef.get(u) || 0,
      ls: ls.get(u) || 0,
      lf: lf.get(u) || 0,
      slack,
      isCritical
    };

    if (isCritical) {
      criticalNodes.push(u);
    }
  });

  // Critical Edges
  const criticalEdges = edges.filter(e => {
    return nodeMetrics[e.source]?.isCritical && nodeMetrics[e.target]?.isCritical;
  });

  return {
    criticalPath: criticalNodes,
    criticalEdges,
    totalDuration: maxProjectDuration,
    nodeMetrics
  };
}

/**
 * Graph Centrality & Keystone Analysis
 * Computes in-degree, out-degree, and reachable downstream habits (influence factor).
 * 
 * @param {Array} nodes 
 * @param {Array} edges 
 * @returns {Object}
 */
export function calculateCentrality(nodes, edges) {
  const adj = new Map();
  const inDegree = new Map();
  const outDegree = new Map();

  nodes.forEach(n => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    if (adj.has(e.source)) {
      adj.get(e.source).push(e.target);
      outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
    }
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Downstream Reachability (Transitive Closure via BFS/DFS)
  const downstreamImpact = new Map();

  nodes.forEach(n => {
    const visited = new Set();
    const queue = [n.id];
    visited.add(n.id);

    while (queue.length > 0) {
      const curr = queue.shift();
      const neighbors = adj.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    // Reachable count excluding self
    downstreamImpact.set(n.id, visited.size - 1);
  });

  let keystoneNodeId = null;
  let maxImpact = -1;

  nodes.forEach(n => {
    const impact = downstreamImpact.get(n.id) || 0;
    if (impact > maxImpact) {
      maxImpact = impact;
      keystoneNodeId = n.id;
    }
  });

  const nodeStats = {};
  nodes.forEach(n => {
    nodeStats[n.id] = {
      inDegree: inDegree.get(n.id) || 0,
      outDegree: outDegree.get(n.id) || 0,
      downstreamCount: downstreamImpact.get(n.id) || 0,
      isKeystone: n.id === keystoneNodeId
    };
  });

  return {
    keystoneNodeId,
    maxImpact,
    nodeStats
  };
}
