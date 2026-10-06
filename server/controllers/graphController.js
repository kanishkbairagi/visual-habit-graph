import HabitGraph from '../models/HabitGraph.js';
import HabitLog from '../models/HabitLog.js';
import { memoryStore, isUsingMemoryStore } from '../config/db.js';
import {
  detectCycle,
  topologicalSort,
  criticalPathMethod,
  calculateCentrality
} from '../services/graphEngine.js';

// Helper to fetch current graph
async function fetchCurrentGraph(userId = 'demo-user') {
  if (isUsingMemoryStore()) {
    return memoryStore.graph;
  }
  let graph = await HabitGraph.findOne({ userId });
  if (!graph) {
    graph = await HabitGraph.create({
      userId,
      title: 'Daily Routine DAG',
      nodes: memoryStore.graph.nodes,
      edges: memoryStore.graph.edges
    });
  }
  return graph;
}

// GET /api/graph
export async function getGraph(req, res) {
  try {
    const userId = req.query.userId || 'demo-user';
    const graph = await fetchCurrentGraph(userId);

    const nodes = graph.nodes;
    const edges = graph.edges;

    const cycleInfo = detectCycle(nodes, edges);
    const topoInfo = topologicalSort(nodes, edges);
    const cpmInfo = criticalPathMethod(nodes, edges);
    const centralityInfo = calculateCentrality(nodes, edges);

    res.json({
      success: true,
      data: {
        userId: graph.userId,
        title: graph.title,
        nodes,
        edges,
        version: graph.version || 1,
        algorithms: {
          cycleDetection: cycleInfo,
          topologicalSort: topoInfo,
          criticalPath: cpmInfo,
          centrality: centralityInfo,
          theoreticalComplexity: {
            cycleDetection: 'O(V + E) [3-Color DFS]',
            topologicalSort: 'O(V + E) [Kahn Algorithm]',
            criticalPath: 'O(V + E) [Dynamic Programming on DAG]',
            centrality: 'O(V + E) [Transitive Closure BFS]'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/graph/node
export async function addNode(req, res) {
  try {
    const { name, description, durationMinutes, color, position } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Habit name is required' });
    }

    const userId = req.body.userId || 'demo-user';
    const graph = await fetchCurrentGraph(userId);

    const newNode = {
      id: String(Date.now()),
      name,
      description: description || '',
      durationMinutes: Number(durationMinutes) || 30,
      color: color || '#3b82f6',
      position: position || { x: 300, y: 300 }
    };

    if (isUsingMemoryStore()) {
      graph.nodes.push(newNode);
      graph.version = (graph.version || 1) + 1;
    } else {
      graph.nodes.push(newNode);
      graph.version = (graph.version || 1) + 1;
      await graph.save();
    }

    res.status(201).json({ success: true, node: newNode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/graph/node/:id
export async function deleteNode(req, res) {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 'demo-user';
    const graph = await fetchCurrentGraph(userId);

    graph.nodes = graph.nodes.filter(n => n.id !== id);
    // Remove all associated edges
    graph.edges = graph.edges.filter(e => e.source !== id && e.target !== id);
    graph.version = (graph.version || 1) + 1;

    if (!isUsingMemoryStore()) {
      await graph.save();
    }

    res.json({ success: true, message: `Node ${id} and attached edges deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/graph/edge
export async function addEdge(req, res) {
  try {
    const { source, target, weight } = req.body;
    if (!source || !target) {
      return res.status(400).json({ success: false, error: 'Source and target IDs are required' });
    }
    if (source === target) {
      return res.status(400).json({ success: false, error: 'Self-loops are not allowed in a DAG' });
    }

    const userId = req.body.userId || 'demo-user';
    const graph = await fetchCurrentGraph(userId);

    // Check if edge already exists
    const exists = graph.edges.some(e => e.source === source && e.target === target);
    if (exists) {
      return res.status(400).json({ success: false, error: 'Edge already exists' });
    }

    // Speculatively test cycle detection
    const prospectiveEdges = [...graph.edges, { source, target, weight: weight || 1 }];
    const cycleCheck = detectCycle(graph.nodes, prospectiveEdges);

    if (cycleCheck.hasCycle) {
      return res.status(400).json({
        success: false,
        error: 'DAG Violation: Adding this dependency creates a directed cycle (deadlock).',
        cyclePath: cycleCheck.cyclePath,
        rejectedEdge: { source, target }
      });
    }

    // Valid DAG addition
    const newEdge = { source, target, weight: Number(weight) || 1 };
    graph.edges.push(newEdge);
    graph.version = (graph.version || 1) + 1;

    if (!isUsingMemoryStore()) {
      await graph.save();
    }

    res.status(201).json({ success: true, edge: newEdge, message: 'Dependency added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/graph/edge
export async function deleteEdge(req, res) {
  try {
    const { source, target } = req.body;
    const userId = req.body.userId || 'demo-user';
    const graph = await fetchCurrentGraph(userId);

    graph.edges = graph.edges.filter(e => !(e.source === source && e.target === target));
    graph.version = (graph.version || 1) + 1;

    if (!isUsingMemoryStore()) {
      await graph.save();
    }

    res.json({ success: true, message: 'Edge deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/graph/complete/:id
export async function completeHabit(req, res) {
  try {
    const { id: habitId } = req.params;
    const userId = req.body.userId || 'demo-user';
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const graph = await fetchCurrentGraph(userId);
    const habit = graph.nodes.find(n => n.id === habitId);
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }

    // Verify prerequisites
    const incomingEdges = graph.edges.filter(e => e.target === habitId);
    const prerequisiteIds = incomingEdges.map(e => e.source);

    let completedPrereqIds = [];
    if (isUsingMemoryStore()) {
      completedPrereqIds = memoryStore.logs
        .filter(l => l.userId === userId && l.completedDate === date)
        .map(l => l.habitId);
    } else {
      const logs = await HabitLog.find({ userId, completedDate: date });
      completedPrereqIds = logs.map(l => l.habitId);
    }

    const missingPrereqs = prerequisiteIds.filter(pid => !completedPrereqIds.includes(pid));
    if (missingPrereqs.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Prerequisites not fulfilled',
        missingPrerequisites: missingPrereqs
      });
    }

    // Toggle completion
    let isCompleted = false;
    if (isUsingMemoryStore()) {
      const existingIdx = memoryStore.logs.findIndex(
        l => l.userId === userId && l.habitId === habitId && l.completedDate === date
      );
      if (existingIdx >= 0) {
        memoryStore.logs.splice(existingIdx, 1);
        isCompleted = false;
      } else {
        memoryStore.logs.push({
          userId,
          habitId,
          completedDate: date,
          completedAt: new Date()
        });
        isCompleted = true;
      }
    } else {
      const existing = await HabitLog.findOne({ userId, habitId, completedDate: date });
      if (existing) {
        await HabitLog.deleteOne({ _id: existing._id });
        isCompleted = false;
      } else {
        await HabitLog.create({ userId, habitId, completedDate: date });
        isCompleted = true;
      }
    }

    res.json({
      success: true,
      habitId,
      date,
      isCompleted,
      message: isCompleted ? 'Habit marked complete' : 'Habit completion reverted'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/graph/analytics
export async function getAnalytics(req, res) {
  try {
    const userId = req.query.userId || 'demo-user';
    const graph = await fetchCurrentGraph(userId);

    const cpm = criticalPathMethod(graph.nodes, graph.edges);
    const centrality = calculateCentrality(graph.nodes, graph.edges);
    const topo = topologicalSort(graph.nodes, graph.edges);

    res.json({
      success: true,
      analytics: {
        totalVertices: graph.nodes.length,
        totalEdges: graph.edges.length,
        isDAG: topo.isDAG,
        topologicalDepth: Math.max(0, ...Object.values(topo.levels)),
        criticalPath: cpm.criticalPath,
        criticalEdgesCount: cpm.criticalEdges.length,
        totalBottleneckDurationMinutes: cpm.totalDuration,
        keystoneHabitId: centrality.keystoneNodeId,
        keystoneDownstreamImpact: centrality.maxImpact,
        centralityDetails: centrality.nodeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
