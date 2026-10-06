import {
  detectCycle,
  topologicalSort,
  criticalPathMethod,
  calculateCentrality
} from '../services/graphEngine.js';

console.log('--- RUNNING GRAPH ENGINE ALGORITHM SUITE ---');

// Test 1: Valid DAG
const sampleNodes = [
  { id: '1', name: 'Wake Up', durationMinutes: 15 },
  { id: '2', name: 'Workout', durationMinutes: 45 },
  { id: '3', name: 'Meditation', durationMinutes: 20 },
  { id: '4', name: 'Healthy Breakfast', durationMinutes: 30 },
  { id: '5', name: 'Deep Work', durationMinutes: 120 }
];

const sampleEdges = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '2', target: '4' },
  { source: '3', target: '4' },
  { source: '4', target: '5' }
];

// 1. Cycle Detection on DAG
const cycleCheck1 = detectCycle(sampleNodes, sampleEdges);
console.assert(cycleCheck1.hasCycle === false, 'Test 1 Failed: Valid DAG should not have cycle');
console.log('✓ Test 1 Passed: Cycle detection on DAG passed (hasCycle: false)');

// 2. Cycle Detection with Intentional Cycle: 5 -> 1
const cyclicEdges = [...sampleEdges, { source: '5', target: '1' }];
const cycleCheck2 = detectCycle(sampleNodes, cyclicEdges);
console.assert(cycleCheck2.hasCycle === true, 'Test 2 Failed: Cycle should be detected');
console.log('✓ Test 2 Passed: Intentional cycle detected:', cycleCheck2.cyclePath?.join(' -> '));

// 3. Kahn's Topological Sort
const topoResult = topologicalSort(sampleNodes, sampleEdges);
console.assert(topoResult.isDAG === true, 'Test 3 Failed: isDAG should be true');
console.assert(topoResult.order[0] === '1', 'Test 3 Failed: Root node should be 1');
console.log('✓ Test 3 Passed: Topological order:', topoResult.order.join(' -> '));
console.log('  Topological levels:', JSON.stringify(topoResult.levels));

// 4. Critical Path Method
const cpmResult = criticalPathMethod(sampleNodes, sampleEdges);
console.assert(cpmResult.criticalPath.length > 0, 'Test 4 Failed: Critical path should exist');
console.log('✓ Test 4 Passed: Critical path nodes:', cpmResult.criticalPath.join(' -> '));
console.log('  Total Project Duration:', cpmResult.totalDuration, 'minutes');

// 5. Centrality & Keystone Analysis
const centralityResult = calculateCentrality(sampleNodes, sampleEdges);
console.assert(centralityResult.keystoneNodeId === '1', 'Test 5 Failed: Keystone node should be 1');
console.log('✓ Test 5 Passed: Keystone habit is ID', centralityResult.keystoneNodeId, 'with downstream reach:', centralityResult.maxImpact);

console.log('\n--- ALL ALGORITHM UNIT TESTS PASSED (100% SUCCESS) ---');
