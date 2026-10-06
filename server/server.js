/**
 * Visual Habit Graph - MERN / Node.js High-Performance REST Engine
 * Zero-dependency robust HTTP Server with Graph Algorithms & MongoDB Schema Support
 */
import http from 'node:http';
import { URL } from 'node:url';
import {
  detectCycle,
  topologicalSort,
  criticalPathMethod,
  calculateCentrality
} from './services/graphEngine.js';

const PORT = process.env.PORT || 5000;

// High-Performance Data Store with Invariant Enforcement
export const db = {
  graph: {
    userId: 'demo-user',
    title: 'Daily Routine DAG (Directed Acyclic Graph)',
    nodes: [
      { id: '1', name: 'Wake Up Early', description: 'Wake up at 6 AM', durationMinutes: 15, color: '#3b82f6', position: { x: 100, y: 120 } },
      { id: '2', name: 'Morning Exercise', description: '30 min workout', durationMinutes: 45, color: '#10b981', position: { x: 300, y: 70 } },
      { id: '3', name: 'Meditation', description: '10 min mindfulness', durationMinutes: 15, color: '#8b5cf6', position: { x: 300, y: 220 } },
      { id: '4', name: 'Healthy Breakfast', description: 'High-protein nutrition', durationMinutes: 30, color: '#f59e0b', position: { x: 520, y: 150 } },
      { id: '5', name: 'Read 30 Pages', description: 'Deep reading & synthesis', durationMinutes: 40, color: '#ef4444', position: { x: 740, y: 150 } },
      { id: '6', name: 'Evening Walk', description: 'Zone-2 recovery walk', durationMinutes: 30, color: '#06b6d4', position: { x: 950, y: 150 } },
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

// CORS and JSON Headers
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Request Body Parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  try {
    // GET /api/health
    if (pathname === '/api/health' && method === 'GET') {
      return sendJSON(res, 200, {
        status: 'online',
        server: 'Visual Habit Graph Node.js Algorithmic Engine',
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        algorithms: {
          cycleDetection: '3-Color DFS O(V + E)',
          topologicalSort: 'Kahns In-Degree Zero Queue O(V + E)',
          criticalPathMethod: 'Dynamic Programming over DAG O(V + E)',
          centralityAnalytics: 'Transitive Closure BFS O(V + E)'
        }
      });
    }

    // GET /api/graph
    if (pathname === '/api/graph' && method === 'GET') {
      const nodes = db.graph.nodes;
      const edges = db.graph.edges;

      const cycleInfo = detectCycle(nodes, edges);
      const topoInfo = topologicalSort(nodes, edges);
      const cpmInfo = criticalPathMethod(nodes, edges);
      const centralityInfo = calculateCentrality(nodes, edges);

      return sendJSON(res, 200, {
        success: true,
        data: {
          userId: db.graph.userId,
          title: db.graph.title,
          nodes,
          edges,
          version: db.graph.version,
          algorithms: {
            cycleDetection: cycleInfo,
            topologicalSort: topoInfo,
            criticalPath: cpmInfo,
            centrality: centralityInfo
          }
        }
      });
    }

    // POST /api/graph/node
    if (pathname === '/api/graph/node' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.name) {
        return sendJSON(res, 400, { success: false, error: 'Habit name is required' });
      }

      const newNode = {
        id: String(Date.now()),
        name: body.name,
        description: body.description || '',
        durationMinutes: Number(body.durationMinutes) || 30,
        color: body.color || '#3b82f6',
        position: body.position || { x: 400, y: 200 }
      };

      db.graph.nodes.push(newNode);
      db.graph.version += 1;
      return sendJSON(res, 201, { success: true, node: newNode });
    }

    // DELETE /api/graph/node/:id
    if (pathname.startsWith('/api/graph/node/') && method === 'DELETE') {
      const id = pathname.split('/api/graph/node/')[1];
      db.graph.nodes = db.graph.nodes.filter(n => n.id !== id);
      db.graph.edges = db.graph.edges.filter(e => e.source !== id && e.target !== id);
      db.graph.version += 1;
      return sendJSON(res, 200, { success: true, message: `Node ${id} deleted` });
    }

    // POST /api/graph/edge
    if (pathname === '/api/graph/edge' && method === 'POST') {
      const body = await parseBody(req);
      const { source, target, weight } = body;

      if (!source || !target) {
        return sendJSON(res, 400, { success: false, error: 'Source and target IDs are required' });
      }
      if (source === target) {
        return sendJSON(res, 400, { success: false, error: 'Self-loops are not permitted in a DAG' });
      }

      const exists = db.graph.edges.some(e => e.source === source && e.target === target);
      if (exists) {
        return sendJSON(res, 400, { success: false, error: 'Edge already exists' });
      }

      // Speculative cycle detection test
      const prospectiveEdges = [...db.graph.edges, { source, target, weight: weight || 1 }];
      const cycleCheck = detectCycle(db.graph.nodes, prospectiveEdges);

      if (cycleCheck.hasCycle) {
        return sendJSON(res, 400, {
          success: false,
          error: 'DAG Violation: Adding this dependency creates a directed cycle (deadlock).',
          cyclePath: cycleCheck.cyclePath,
          rejectedEdge: { source, target }
        });
      }

      const newEdge = { source, target, weight: Number(weight) || 1 };
      db.graph.edges.push(newEdge);
      db.graph.version += 1;
      return sendJSON(res, 201, { success: true, edge: newEdge, message: 'Dependency edge added' });
    }

    // DELETE /api/graph/edge
    if (pathname === '/api/graph/edge' && method === 'DELETE') {
      const body = await parseBody(req);
      const { source, target } = body;
      db.graph.edges = db.graph.edges.filter(e => !(e.source === source && e.target === target));
      db.graph.version += 1;
      return sendJSON(res, 200, { success: true, message: 'Edge deleted' });
    }

    // POST /api/graph/complete/:id
    if (pathname.startsWith('/api/graph/complete/') && method === 'POST') {
      const habitId = pathname.split('/api/graph/complete/')[1];
      const body = await parseBody(req);
      const date = body.date || new Date().toISOString().split('T')[0];

      const habit = db.graph.nodes.find(n => n.id === habitId);
      if (!habit) {
        return sendJSON(res, 404, { success: false, error: 'Habit not found' });
      }

      // Verify prerequisite fulfillment
      const incomingEdges = db.graph.edges.filter(e => e.target === habitId);
      const prereqIds = incomingEdges.map(e => e.source);

      const completedPrereqs = db.logs
        .filter(l => l.completedDate === date)
        .map(l => l.habitId);

      const missing = prereqIds.filter(pid => !completedPrereqs.includes(pid));
      if (missing.length > 0) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Prerequisites not fulfilled',
          missingPrerequisites: missing
        });
      }

      const existingIdx = db.logs.findIndex(l => l.habitId === habitId && l.completedDate === date);
      let isCompleted = false;
      if (existingIdx >= 0) {
        db.logs.splice(existingIdx, 1);
        isCompleted = false;
      } else {
        db.logs.push({
          habitId,
          completedDate: date,
          completedAt: new Date().toISOString()
        });
        isCompleted = true;
      }

      return sendJSON(res, 200, {
        success: true,
        habitId,
        date,
        isCompleted,
        message: isCompleted ? 'Habit completed' : 'Habit uncompleted'
      });
    }

    // GET /api/graph/analytics
    if (pathname === '/api/graph/analytics' && method === 'GET') {
      const nodes = db.graph.nodes;
      const edges = db.graph.edges;

      const cpm = criticalPathMethod(nodes, edges);
      const centrality = calculateCentrality(nodes, edges);
      const topo = topologicalSort(nodes, edges);

      return sendJSON(res, 200, {
        success: true,
        analytics: {
          totalVertices: nodes.length,
          totalEdges: edges.length,
          isDAG: topo.isDAG,
          topologicalDepth: Math.max(0, ...Object.values(topo.levels)),
          criticalPath: cpm.criticalPath,
          totalDurationMinutes: cpm.totalDuration,
          keystoneHabitId: centrality.keystoneNodeId,
          maxDownstreamImpact: centrality.maxImpact,
          nodeStats: centrality.nodeStats
        }
      });
    }

    // 404 Fallback
    sendJSON(res, 404, { success: false, error: 'Endpoint Not Found' });
  } catch (error) {
    console.error('[API Error]', error);
    sendJSON(res, 500, { success: false, error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Visual Habit Graph Algorithmic Backend Online`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✨ Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Graph:  http://localhost:${PORT}/api/graph`);
  console.log(`=======================================================`);
});
