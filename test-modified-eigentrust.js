/**
 * Test Suite for Modified EigenTrust Algorithm
 *
 * Tests the property: A vertex changing its outgoing allocations
 * does not change its own trust score.
 */

const UNIT_VERTEX = '__UNIT__';
const EPSILON = 1e-6; // Floating point comparison threshold
const MAX_ITERATIONS = 1000;
const CONVERGENCE_THRESHOLD = 1e-8;
const DECAY_FACTOR = 0.15;

/**
 * Modified EigenTrust: Two-Phase Decoupled Computation
 *
 * For each vertex k, we compute its score based on a "frozen" network
 * where k's allocations don't affect the computation.
 *
 * Algorithm:
 * 1. For each vertex k:
 *    a. Create subgraph excluding k's outgoing edges
 *    b. Compute EigenTrust on this subgraph to get others' scores
 *    c. Compute k's score = sum of (incoming weight × sender's frozen score)
 */
function computeModifiedEigenTrust(graph, pretrust = null) {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const result = {};

  // For each vertex k, compute its score independently
  for (const k of vertices) {
    // Build subgraph excluding k's outgoing allocations
    const subgraph = {};
    for (const giver of vertices) {
      if (giver !== k) {
        subgraph[giver] = { ...graph[giver] };
      } else {
        // k doesn't contribute to the network flow
        subgraph[k] = { [UNIT_VERTEX]: 1.0 };
      }
    }

    // Compute EigenTrust on subgraph
    const subScores = computeSubgraphEigenTrust(subgraph, pretrust);

    // Now compute k's score based on incoming edges and the frozen scores
    let kScore = 0;
    for (const giver of vertices) {
      if (giver !== k) {
        const allocations = graph[giver] || {};
        let totalAllocated = 0;
        for (const [receiver, weight] of Object.entries(allocations)) {
          if (receiver !== UNIT_VERTEX) {
            totalAllocated += weight;
          }
        }

        if (totalAllocated > 0 && allocations[k]) {
          const normalizedWeight = allocations[k] / totalAllocated;
          kScore += normalizedWeight * (subScores[giver] || 0);
        }
      }
    }

    // Apply decay factor to pretrust
    const pretrustValue = pretrust && pretrust[k] ? pretrust[k] : 1.0 / n;
    result[k] = (1 - DECAY_FACTOR) * kScore + DECAY_FACTOR * pretrustValue;
  }

  // DO NOT normalize - normalization couples all scores together
  // Return raw scores to maintain independence

  return result;
}

/**
 * Helper: Compute standard EigenTrust on a subgraph
 */
function computeSubgraphEigenTrust(graph, pretrust = null) {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const vertexToIndex = new Map();
  vertices.forEach((v, i) => vertexToIndex.set(v, i));

  const p = new Array(n).fill(1.0 / n);
  if (pretrust) {
    let sum = 0;
    vertices.forEach((v, i) => {
      p[i] = pretrust[v] || 0;
      sum += p[i];
    });
    if (sum > 0) {
      for (let i = 0; i < n; i++) p[i] /= sum;
    }
  }

  const C = Array(n).fill(null).map(() => Array(n).fill(0));

  for (const giver of vertices) {
    const giverIdx = vertexToIndex.get(giver);
    const allocations = graph[giver] || {};

    let totalAllocated = 0;
    for (const [receiver, weight] of Object.entries(allocations)) {
      if (receiver !== UNIT_VERTEX) {
        totalAllocated += weight;
      }
    }

    if (totalAllocated > 0) {
      for (const [receiver, weight] of Object.entries(allocations)) {
        if (receiver !== UNIT_VERTEX) {
          const receiverIdx = vertexToIndex.get(receiver);
          if (receiverIdx !== undefined) {
            C[giverIdx][receiverIdx] = weight / totalAllocated;
          }
        }
      }
    }
  }

  let t = [...p];

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const tNew = new Array(n);

    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += C[i][j] * t[i];
      }
      tNew[j] = (1 - DECAY_FACTOR) * sum + DECAY_FACTOR * p[j];
    }

    let maxChange = 0;
    for (let i = 0; i < n; i++) {
      maxChange = Math.max(maxChange, Math.abs(tNew[i] - t[i]));
    }

    t = tNew;

    if (maxChange < CONVERGENCE_THRESHOLD) {
      break;
    }
  }

  const result = {};
  vertices.forEach((v, i) => {
    result[v] = t[i];
  });

  return result;
}

/**
 * Standard EigenTrust (for comparison)
 */
function computeStandardEigenTrust(graph, pretrust = null) {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const vertexToIndex = new Map();
  vertices.forEach((v, i) => vertexToIndex.set(v, i));

  const p = new Array(n).fill(1.0 / n);
  if (pretrust) {
    let sum = 0;
    vertices.forEach((v, i) => {
      p[i] = pretrust[v] || 0;
      sum += p[i];
    });
    if (sum > 0) {
      for (let i = 0; i < n; i++) p[i] /= sum;
    }
  }

  const C = Array(n).fill(null).map(() => Array(n).fill(0));

  for (const giver of vertices) {
    const giverIdx = vertexToIndex.get(giver);
    const allocations = graph[giver] || {};

    let totalAllocated = 0;
    for (const [receiver, weight] of Object.entries(allocations)) {
      if (receiver !== UNIT_VERTEX) {
        totalAllocated += weight;
      }
    }

    if (totalAllocated > 0) {
      for (const [receiver, weight] of Object.entries(allocations)) {
        if (receiver !== UNIT_VERTEX) {
          const receiverIdx = vertexToIndex.get(receiver);
          if (receiverIdx !== undefined) {
            C[giverIdx][receiverIdx] = weight / totalAllocated;
          }
        }
      }
    }
  }

  let t = [...p];

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const tNew = new Array(n);

    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        // STANDARD: Include all contributions
        sum += C[i][j] * t[i];
      }
      tNew[j] = (1 - DECAY_FACTOR) * sum + DECAY_FACTOR * p[j];
    }

    let maxChange = 0;
    for (let i = 0; i < n; i++) {
      maxChange = Math.max(maxChange, Math.abs(tNew[i] - t[i]));
    }

    t = tNew;

    if (maxChange < CONVERGENCE_THRESHOLD) {
      break;
    }
  }

  const result = {};
  vertices.forEach((v, i) => {
    result[v] = t[i];
  });

  return result;
}

/**
 * Deep clone a graph
 */
function cloneGraph(graph) {
  const clone = {};
  for (const [vertex, allocations] of Object.entries(graph)) {
    clone[vertex] = { ...allocations };
  }
  return clone;
}

/**
 * Normalize allocations for a vertex to sum to 1.0
 */
function normalizeAllocations(allocations) {
  const total = Object.values(allocations).reduce((sum, w) => sum + w, 0);
  if (total === 0) {
    return { [UNIT_VERTEX]: 1.0 };
  }
  const normalized = {};
  for (const [target, weight] of Object.entries(allocations)) {
    normalized[target] = weight / total;
  }
  return normalized;
}

/**
 * Generate random allocations for a vertex
 */
function generateRandomAllocations(vertices, includeUnit = true) {
  const allocations = {};
  const targets = includeUnit ? [...vertices, UNIT_VERTEX] : vertices;

  // Random number of targets (1 to all)
  const numTargets = Math.floor(Math.random() * targets.length) + 1;
  const selectedTargets = [];

  for (let i = 0; i < numTargets; i++) {
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!selectedTargets.includes(target)) {
      selectedTargets.push(target);
    }
  }

  // Assign random weights
  for (const target of selectedTargets) {
    allocations[target] = Math.random();
  }

  return normalizeAllocations(allocations);
}

/**
 * Test Cases: Base Graphs
 */
function createBaseGraphs() {
  return {
    // Simple linear chain
    'linear_3': {
      'A': { 'B': 1.0 },
      'B': { 'C': 1.0 },
      'C': { [UNIT_VERTEX]: 1.0 }
    },

    // Simple cycle
    'cycle_3': {
      'A': { 'B': 1.0 },
      'B': { 'C': 1.0 },
      'C': { 'A': 1.0 }
    },

    // Self-loop
    'self_loop': {
      'A': { 'A': 0.5, 'B': 0.5 },
      'B': { 'A': 1.0 }
    },

    // Star graph (central hub)
    'star_5': {
      'CENTER': { 'A': 0.25, 'B': 0.25, 'C': 0.25, 'D': 0.25 },
      'A': { 'CENTER': 1.0 },
      'B': { 'CENTER': 1.0 },
      'C': { 'CENTER': 1.0 },
      'D': { 'CENTER': 1.0 }
    },

    // Fully connected (complete graph)
    'complete_4': {
      'A': { 'B': 0.33, 'C': 0.33, 'D': 0.34 },
      'B': { 'A': 0.33, 'C': 0.33, 'D': 0.34 },
      'C': { 'A': 0.33, 'B': 0.33, 'D': 0.34 },
      'D': { 'A': 0.33, 'B': 0.33, 'C': 0.34 }
    },

    // Disconnected components
    'disconnected': {
      'A': { 'B': 1.0 },
      'B': { 'A': 1.0 },
      'C': { 'D': 1.0 },
      'D': { 'C': 1.0 }
    },

    // All to unit
    'all_unit': {
      'A': { [UNIT_VERTEX]: 1.0 },
      'B': { [UNIT_VERTEX]: 1.0 },
      'C': { [UNIT_VERTEX]: 1.0 }
    },

    // Complex asymmetric
    'asymmetric': {
      'A': { 'B': 0.6, 'C': 0.4 },
      'B': { 'C': 0.8, 'D': 0.2 },
      'C': { 'A': 0.3, 'D': 0.7 },
      'D': { 'A': 1.0 }
    },

    // With self-loops everywhere
    'multi_self_loops': {
      'A': { 'A': 0.4, 'B': 0.3, 'C': 0.3 },
      'B': { 'B': 0.5, 'A': 0.5 },
      'C': { 'C': 0.6, 'A': 0.2, 'B': 0.2 }
    }
  };
}

/**
 * Generate allocation modifications for testing
 */
function* generateModifications(graph, vertex) {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);

  // Test 1: Change to all unit
  yield { [UNIT_VERTEX]: 1.0 };

  // Test 2: Self-loop only
  yield { [vertex]: 1.0 };

  // Test 3: Distribute to all others equally
  const others = vertices.filter(v => v !== vertex);
  if (others.length > 0) {
    const equal = {};
    const weight = 1.0 / others.length;
    others.forEach(v => equal[v] = weight);
    yield equal;
  }

  // Test 4: Focus on single other vertex
  if (others.length > 0) {
    for (const target of others) {
      yield { [target]: 1.0 };
    }
  }

  // Test 5: Mix with self-loop
  if (others.length > 0) {
    yield { [vertex]: 0.5, [others[0]]: 0.5 };
  }

  // Test 6: Mix with unit
  if (others.length > 0) {
    yield { [others[0]]: 0.7, [UNIT_VERTEX]: 0.3 };
  }

  // Test 7: Three-way split
  if (others.length >= 2) {
    yield { [others[0]]: 0.5, [others[1]]: 0.3, [UNIT_VERTEX]: 0.2 };
  }

  // Test 8: Include self in mix
  if (others.length >= 2) {
    yield { [vertex]: 0.25, [others[0]]: 0.5, [others[1]]: 0.25 };
  }

  // Test 9: Random allocations (5 variants)
  for (let i = 0; i < 5; i++) {
    yield generateRandomAllocations(vertices, true);
  }
}

/**
 * Test that property holds for a specific modification
 */
function testSingleModification(graph, vertex, newAllocations, algorithm = 'modified') {
  const computeFn = algorithm === 'modified' ? computeModifiedEigenTrust : computeStandardEigenTrust;

  // Compute original scores
  const originalScores = computeFn(graph);
  const originalScore = originalScores[vertex];

  // Modify graph
  const modifiedGraph = cloneGraph(graph);
  modifiedGraph[vertex] = { ...newAllocations };

  // Compute new scores
  const newScores = computeFn(modifiedGraph);
  const newScore = newScores[vertex];

  // Check if score changed
  const changed = Math.abs(newScore - originalScore) > EPSILON;

  return {
    vertex,
    originalScore,
    newScore,
    changed,
    difference: newScore - originalScore,
    allocations: newAllocations
  };
}

/**
 * Test all modifications for a graph
 */
function testGraph(graphName, graph, algorithm = 'modified') {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const results = [];

  for (const vertex of vertices) {
    for (const newAllocations of generateModifications(graph, vertex)) {
      const result = testSingleModification(graph, vertex, newAllocations, algorithm);
      results.push({
        graphName,
        ...result
      });
    }
  }

  return results;
}

/**
 * Generate random graphs for stress testing
 */
function generateRandomGraphs(numGraphs, minVertices = 3, maxVertices = 10) {
  const graphs = {};

  for (let i = 0; i < numGraphs; i++) {
    const numVertices = Math.floor(Math.random() * (maxVertices - minVertices + 1)) + minVertices;
    const vertices = [];

    for (let j = 0; j < numVertices; j++) {
      vertices.push(`V${j}`);
    }

    const graph = {};
    for (const vertex of vertices) {
      graph[vertex] = generateRandomAllocations(vertices, true);
    }

    graphs[`random_${i}`] = graph;
  }

  return graphs;
}

/**
 * Run comprehensive test suite
 */
function runTestSuite() {
  console.log('='.repeat(80));
  console.log('MODIFIED EIGENTRUST TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  // Test base graphs
  console.log('Testing base graphs with MODIFIED EigenTrust...');
  const baseGraphs = createBaseGraphs();
  const baseResults = [];

  for (const [name, graph] of Object.entries(baseGraphs)) {
    const results = testGraph(name, graph, 'modified');
    baseResults.push(...results);
  }

  const baseFailed = baseResults.filter(r => r.changed);
  console.log(`Base graphs: ${baseResults.length} tests, ${baseFailed.length} violations`);

  if (baseFailed.length > 0) {
    console.log('\nViolations found in base graphs:');
    baseFailed.slice(0, 10).forEach(r => {
      console.log(`  ${r.graphName} / ${r.vertex}: ${r.originalScore.toFixed(6)} -> ${r.newScore.toFixed(6)} (Δ${r.difference.toFixed(6)})`);
    });
  }

  // Test random graphs
  console.log('\nGenerating and testing random graphs...');
  const randomGraphs = generateRandomGraphs(500, 3, 12);
  const randomResults = [];

  for (const [name, graph] of Object.entries(randomGraphs)) {
    const results = testGraph(name, graph, 'modified');
    randomResults.push(...results);
  }

  const randomFailed = randomResults.filter(r => r.changed);
  console.log(`Random graphs: ${randomResults.length} tests, ${randomFailed.length} violations`);

  if (randomFailed.length > 0) {
    console.log('\nViolations found in random graphs:');
    randomFailed.slice(0, 10).forEach(r => {
      console.log(`  ${r.graphName} / ${r.vertex}: ${r.originalScore.toFixed(6)} -> ${r.newScore.toFixed(6)} (Δ${r.difference.toFixed(6)})`);
    });
  }

  // Compare with standard EigenTrust
  console.log('\n' + '='.repeat(80));
  console.log('COMPARISON: Standard EigenTrust (should have violations)');
  console.log('='.repeat(80));
  console.log();

  const standardResults = [];
  for (const [name, graph] of Object.entries(baseGraphs)) {
    const results = testGraph(name, graph, 'standard');
    standardResults.push(...results);
  }

  const standardViolations = standardResults.filter(r => r.changed);
  console.log(`Standard algorithm: ${standardResults.length} tests, ${standardViolations.length} violations`);

  if (standardViolations.length > 0) {
    console.log('\nExample violations in standard EigenTrust:');
    standardViolations.slice(0, 5).forEach(r => {
      console.log(`  ${r.graphName} / ${r.vertex}: ${r.originalScore.toFixed(6)} -> ${r.newScore.toFixed(6)} (Δ${r.difference.toFixed(6)})`);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const totalModified = baseResults.length + randomResults.length;
  const totalViolations = baseFailed.length + randomFailed.length;

  console.log(`\nModified EigenTrust:`);
  console.log(`  Total tests: ${totalModified}`);
  console.log(`  Violations: ${totalViolations}`);
  console.log(`  Success rate: ${((1 - totalViolations / totalModified) * 100).toFixed(2)}%`);

  console.log(`\nStandard EigenTrust:`);
  console.log(`  Total tests: ${standardResults.length}`);
  console.log(`  Violations: ${standardViolations.length}`);
  console.log(`  Success rate: ${((1 - standardViolations.length / standardResults.length) * 100).toFixed(2)}%`);

  if (totalViolations === 0) {
    console.log('\n✓ SUCCESS: Modified EigenTrust maintains the property!');
    console.log('  A vertex changing its allocations does NOT change its own trust score.');
  } else {
    console.log('\n✗ FAILURE: Property violations detected.');
  }

  console.log('\n' + '='.repeat(80));

  return {
    modified: {
      total: totalModified,
      violations: totalViolations,
      passed: totalViolations === 0
    },
    standard: {
      total: standardResults.length,
      violations: standardViolations.length
    }
  };
}

// Run the test suite
const results = runTestSuite();
process.exit(results.modified.passed ? 0 : 1);
