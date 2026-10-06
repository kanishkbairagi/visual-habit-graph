import {
  detectCycleClient,
  topologicalSortClient,
  criticalPathMethodClient,
  calculateCentralityClient
} from '../utils/graphAlgorithms';

const API_BASE_URL = 'http://localhost:5000/api';

export async function checkServerHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { online: true, details: data };
    }
  } catch (err) {
    // Backend offline or unreachable
  }
  return { online: false, details: null };
}

export async function fetchGraphData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/graph`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { isBackend: true, ...data.data };
    }
  } catch (err) {
    // Fallback to local
  }
  return null;
}

export async function addEdgeApi(source, target) {
  try {
    const res = await fetch(`${API_BASE_URL}/graph/edge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addNodeApi(nodeData) {
  try {
    const res = await fetch(`${API_BASE_URL}/graph/node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nodeData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteNodeApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/graph/node/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
