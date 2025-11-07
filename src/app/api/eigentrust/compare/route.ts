/**
 * API endpoint to compare standard vs modified EigenTrust
 */

import { NextRequest, NextResponse } from 'next/server';

const UNIT_VERTEX = '__UNIT__';
const EPSILON = 1e-6;
const MAX_ITERATIONS = 1000;
const CONVERGENCE_THRESHOLD = 1e-8;
const DECAY_FACTOR = 0.15;

interface Graph {
  [vertex: string]: {
    [target: string]: number;
  };
}

/**
 * Standard EigenTrust
 */
function computeStandardEigenTrust(graph: Graph): Record<string, number> {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const vertexToIndex = new Map<string, number>();
  vertices.forEach((v, i) => vertexToIndex.set(v, i));

  const p = new Array(n).fill(1.0 / n);
  const C = Array(n).fill(null).map(() => Array(n).fill(0));

  for (const giver of vertices) {
    const giverIdx = vertexToIndex.get(giver)!;
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

  // Normalize
  const total = t.reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    t = t.map(val => val / total);
  }

  const result: Record<string, number> = {};
  vertices.forEach((v, i) => {
    result[v] = t[i];
  });

  return result;
}

/**
 * Helper: Compute standard EigenTrust on a subgraph
 */
function computeSubgraphEigenTrust(graph: Graph): Record<string, number> {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const vertexToIndex = new Map<string, number>();
  vertices.forEach((v, i) => vertexToIndex.set(v, i));

  const p = new Array(n).fill(1.0 / n);
  const C = Array(n).fill(null).map(() => Array(n).fill(0));

  for (const giver of vertices) {
    const giverIdx = vertexToIndex.get(giver)!;
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

  const result: Record<string, number> = {};
  vertices.forEach((v, i) => {
    result[v] = t[i];
  });

  return result;
}

/**
 * Modified EigenTrust: Two-Phase Decoupled Computation
 */
function computeModifiedEigenTrust(graph: Graph): Record<string, number> {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const result: Record<string, number> = {};

  // For each vertex k, compute its score independently
  for (const k of vertices) {
    // Build subgraph excluding k's outgoing allocations
    const subgraph: Graph = {};
    for (const giver of vertices) {
      if (giver !== k) {
        subgraph[giver] = { ...graph[giver] };
      } else {
        // k doesn't contribute to the network flow
        subgraph[k] = { [UNIT_VERTEX]: 1.0 };
      }
    }

    // Compute EigenTrust on subgraph
    const subScores = computeSubgraphEigenTrust(subgraph);

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
    const pretrustValue = 1.0 / n;
    result[k] = (1 - DECAY_FACTOR) * kScore + DECAY_FACTOR * pretrustValue;
  }

  // DO NOT normalize - this is key to maintaining independence

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { graph } = await request.json();

    if (!graph || typeof graph !== 'object') {
      return NextResponse.json(
        { error: 'Invalid graph format' },
        { status: 400 }
      );
    }

    // Compute both algorithms
    const standardScores = computeStandardEigenTrust(graph);
    const modifiedScores = computeModifiedEigenTrust(graph);

    return NextResponse.json({
      standard: standardScores,
      modified: modifiedScores,
    });
  } catch (error) {
    console.error('Error computing EigenTrust:', error);
    return NextResponse.json(
      { error: 'Failed to compute trust scores' },
      { status: 500 }
    );
  }
}
