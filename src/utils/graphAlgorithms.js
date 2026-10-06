/**
 * Client-Side Algorithmic Engine for Visual Habit Graph
 * Provides mathematical validation and graph algorithms
 */

export function detectCycleClient(nodes, edges) {
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

export function topologicalSortClient(nodes, edges) {
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
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

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
      levels[v] = Math.max(levels[v] || 0, currLevel + 1);

      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }

  return {
    order,
    levels,
    isDAG: order.length === nodes.length,
    unprocessedCount: nodes.length - order.length
  };
}

export function criticalPathMethodClient(nodes, edges) {
  const { order, isDAG } = topologicalSortClient(nodes, edges);
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

  const es = new Map();
  const ef = new Map();

  for (const u of order) {
    const node = nodeMap.get(u);
    const duration = node?.durationMinutes || 30;

    const predecessors = revAdj.get(u) || [];
    let maxPredecessorEF = 0;
    for (const p of predecessors) {
      maxPredecessorEF = Math.max(maxPredecessorEF, ef.get(p) || 0);
    }

    es.set(u, maxPredecessorEF);
    ef.set(u, maxPredecessorEF + duration);
  }

  let maxProjectDuration = 0;
  nodes.forEach(n => {
    maxProjectDuration = Math.max(maxProjectDuration, ef.get(n.id) || 0);
  });

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

export function calculateCentralityClient(nodes, edges) {
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
