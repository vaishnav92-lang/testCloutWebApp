#!/usr/bin/env node

/**
 * Grant Allocation Solver
 *
 * Demonstrates:
 * 1. Computing Modified EigenTrust scores on different graphs
 * 2. Assigning utility functions (linear between min/max)
 * 3. Solving the weighted utilitarian allocation problem
 */

// ============================================================================
// Modified EigenTrust Implementation
// ============================================================================

const UNIT_VERTEX = '__UNIT__';
const DECAY_FACTOR = 0.15;
const MAX_ITERATIONS = 1000;
const CONVERGENCE_THRESHOLD = 1e-8;

function computeModifiedEigenTrust(graph) {
  const vertices = Object.keys(graph).filter(v => v !== UNIT_VERTEX);
  const n = vertices.length;

  if (n === 0) return {};

  const scores = {};

  // For each vertex, compute score independently
  for (const vertex of vertices) {
    // Create subgraph where this vertex allocates to __UNIT__
    const subgraph = {};

    for (const giver of vertices) {
      subgraph[giver] = {};
      if (giver === vertex) {
        subgraph[giver][UNIT_VERTEX] = 1;
      } else {
        for (const [receiver, weight] of Object.entries(graph[giver] || {})) {
          if (receiver !== UNIT_VERTEX) {
            subgraph[giver][receiver] = weight;
          }
        }
      }
    }

    // Normalize subgraph
    for (const giver of vertices) {
      if (giver !== vertex) {
        let total = 0;
        for (const weight of Object.values(subgraph[giver])) {
          total += weight;
        }
        if (total > 0) {
          for (const receiver of Object.keys(subgraph[giver])) {
            subgraph[giver][receiver] /= total;
          }
        }
      }
    }

    // Run standard eigentrust on subgraph
    const otherVertices = vertices.filter(v => v !== vertex);
    const m = otherVertices.length;

    if (m === 0) {
      scores[vertex] = 1;
      continue;
    }

    const otherToIndex = new Map();
    otherVertices.forEach((v, i) => otherToIndex.set(v, i));

    const p = new Array(m).fill(1.0 / m);
    const C = Array(m)
      .fill(null)
      .map(() => Array(m).fill(0));

    for (const giver of otherVertices) {
      const giverIdx = otherToIndex.get(giver);
      const allocations = subgraph[giver] || {};

      let totalAllocated = 0;
      for (const [receiver, weight] of Object.entries(allocations)) {
        if (receiver !== UNIT_VERTEX && receiver !== vertex) {
          totalAllocated += weight;
        }
      }

      if (totalAllocated > 0) {
        for (const [receiver, weight] of Object.entries(allocations)) {
          if (receiver !== UNIT_VERTEX && receiver !== vertex) {
            const receiverIdx = otherToIndex.get(receiver);
            if (receiverIdx !== undefined) {
              C[giverIdx][receiverIdx] = weight / totalAllocated;
            }
          }
        }
      }
    }

    let t = [...p];

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const tNew = new Array(m);

      for (let j = 0; j < m; j++) {
        let sum = 0;
        for (let i = 0; i < m; i++) {
          sum += C[i][j] * t[i];
        }
        tNew[j] = (1 - DECAY_FACTOR) * sum + DECAY_FACTOR * p[j];
      }

      let maxChange = 0;
      for (let i = 0; i < m; i++) {
        maxChange = Math.max(maxChange, Math.abs(tNew[i] - t[i]));
      }

      t = tNew;

      if (maxChange < CONVERGENCE_THRESHOLD) {
        break;
      }
    }

    // Calculate score for this vertex based on incoming allocations
    let score = DECAY_FACTOR / n;
    for (const giver of otherVertices) {
      const giverIdx = otherToIndex.get(giver);
      const giverAllocation = graph[giver]?.[vertex] || 0;
      score += (1 - DECAY_FACTOR) * t[giverIdx] * giverAllocation;
    }

    scores[vertex] = Math.max(0, score);
  }

  return scores;
}

// ============================================================================
// Utility Function
// ============================================================================

class PiecewiseLinearUtility {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }

  // u(x) = 0 for x < min
  //      = (x - min) / (max - min) for min <= x <= max
  //      = 1 for x > max
  evaluate(x) {
    if (x < this.min) return 0;
    if (x > this.max) return 1;
    if (this.min >= this.max) {
      // Point mass: 1 if x == min, 0 otherwise
      return Math.abs(x - this.min) < 1 ? 1 : 0;
    }
    return (x - this.min) / (this.max - this.min);
  }

  // Marginal utility (constant in active region)
  marginalUtility() {
    if (this.min >= this.max) return 0; // Point mass
    return 1 / (this.max - this.min);
  }

  toString() {
    return `U(min=${this.min}, max=${this.max})`;
  }
}

// ============================================================================
// Allocation Algorithm
// ============================================================================

/**
 * ALGORITHM 1: Greedy Merit-Based (Rank by Trust)
 * Sort by trust descending, fill each person from min to max in order.
 * Highest trust gets first pick of capital.
 */
function allocateCapitalMeritRank(trustScores, utilities, totalCapital) {
  const users = Object.keys(trustScores);

  // Sort by trust score descending
  const ranked = users.sort((a, b) => trustScores[b] - trustScores[a]);

  const allocations = {};
  let remainingCapital = totalCapital;

  for (const userId of ranked) {
    const min = utilities[userId].min;
    const max = utilities[userId].max;

    // Give them at least min
    const allocation = Math.min(max, Math.max(min, remainingCapital));
    allocations[userId] = allocation;
    remainingCapital -= allocation;

    if (remainingCapital <= 0) break;
  }

  return allocations;
}

/**
 * ALGORITHM 2: Iterative Proportional (Merit-Based with Redistribution)
 * 1. Everyone gets minimum
 * 2. Remaining capital distributed proportionally to trust
 * 3. Anyone hitting max gets capped; excess goes back to pool
 * 4. Repeat until all capital allocated
 */
function allocateCapitalIterativeProp(trustScores, utilities, totalCapital) {
  const users = Object.keys(trustScores);
  const allocations = {};

  // Initialize everyone at their minimum
  let allocated = 0;
  for (const userId of users) {
    allocations[userId] = utilities[userId].min;
    allocated += utilities[userId].min;
  }

  let remainingCapital = totalCapital - allocated;

  // Iteratively distribute remaining capital proportionally to trust
  while (remainingCapital > 0.01) {
    // Calculate total trust among users who have room to grow
    const usersWithRoom = users.filter(
      u => allocations[u] < utilities[u].max
    );

    if (usersWithRoom.length === 0) break;

    const totalTrust = usersWithRoom.reduce((sum, u) => sum + trustScores[u], 0);
    if (totalTrust === 0) break;

    let capitalReturned = 0;

    // Distribute proportionally
    for (const userId of usersWithRoom) {
      const share = (trustScores[userId] / totalTrust) * remainingCapital;
      const available = utilities[userId].max - allocations[userId];
      const toAllocate = Math.min(share, available);

      allocations[userId] += toAllocate;
      remainingCapital -= toAllocate;

      // If they hit max before their full share, excess goes back to pool
      capitalReturned += share - toAllocate;
    }

    // If no progress made, exit to avoid infinite loop
    if (capitalReturned === remainingCapital && capitalReturned > 0) {
      break;
    }
  }

  return allocations;
}

/**
 * ALGORITHM 3: Hybrid Merit (Direct Trust Weighting)
 * For each person: "deserve" min + (t_i / Σt_j) * remaining
 * This directly weights merit by trust while respecting bounds.
 */
function allocateCapitalDirectMerit(trustScores, utilities, totalCapital) {
  const users = Object.keys(trustScores);
  const allocations = {};

  // Phase 1: Everyone gets minimum
  let allocated = 0;
  for (const userId of users) {
    allocations[userId] = utilities[userId].min;
    allocated += utilities[userId].min;
  }

  const remainingAfterMin = totalCapital - allocated;
  const totalTrust = users.reduce((sum, u) => sum + trustScores[u], 0);

  // Phase 2: Distribute remaining proportionally to trust, clipped to max
  if (totalTrust > 0) {
    for (const userId of users) {
      const trustShare = trustScores[userId] / totalTrust;
      const meritShare = trustShare * remainingAfterMin;
      const max = utilities[userId].max;

      // Can't exceed max
      allocations[userId] = Math.min(max, allocations[userId] + meritShare);
    }

    // Phase 3: Collect excess from anyone who hit max and redistribute
    let excess = 0;
    for (const userId of users) {
      const max = utilities[userId].max;
      const deserved = utilities[userId].min + (trustScores[userId] / totalTrust) * remainingAfterMin;
      if (allocations[userId] === max && deserved > max) {
        excess += deserved - max;
      }
    }

    // Redistribute excess to those with room, proportionally by trust
    if (excess > 0.01) {
      const usersWithRoom = users.filter(u => allocations[u] < utilities[u].max);
      const roomTrust = usersWithRoom.reduce((sum, u) => sum + trustScores[u], 0);

      if (roomTrust > 0) {
        for (const userId of usersWithRoom) {
          const share = (trustScores[userId] / roomTrust) * excess;
          allocations[userId] = Math.min(
            utilities[userId].max,
            allocations[userId] + share
          );
        }
      }
    }
  }

  return allocations;
}

// Default: use direct merit
function allocateCapital(trustScores, utilities, totalCapital) {
  return allocateCapitalDirectMerit(trustScores, utilities, totalCapital);
}

// ============================================================================
// Test Scenarios
// ============================================================================

const SCENARIOS = [
  {
    name: "Scenario 1: Balanced Network",
    description: "Equal distribution with moderate trust",
    graph: {
      Alice: { Bob: 0.5, Carol: 0.5 },
      Bob: { Alice: 0.5, Carol: 0.5 },
      Carol: { Alice: 0.5, Bob: 0.5 },
    },
    utilities: {
      Alice: new PiecewiseLinearUtility(10000, 50000),  // Happy with 10-50K
      Bob: new PiecewiseLinearUtility(5000, 100000),    // Happy with 5-100K
      Carol: new PiecewiseLinearUtility(20000, 40000),  // Picky: 20-40K only
    },
    totalCapital: 100000,
  },

  {
    name: "Scenario 2: Star Network (Alice central)",
    description: "Alice is highly trusted hub",
    graph: {
      Alice: { Bob: 0.5, Carol: 0.5 },
      Bob: { Alice: 1.0 },
      Carol: { Alice: 1.0 },
    },
    utilities: {
      Alice: new PiecewiseLinearUtility(0, 50000),      // Greedy: takes any amount
      Bob: new PiecewiseLinearUtility(30000, 30000),    // Needs exactly 30K
      Carol: new PiecewiseLinearUtility(25000, 75000),  // Flexible: 25-75K
    },
    totalCapital: 100000,
  },

  {
    name: "Scenario 3: Hierarchical Network",
    description: "Clear ranking of trust",
    graph: {
      Alice: { Bob: 0.7, Carol: 0.3 },
      Bob: { Carol: 1.0 },
      Carol: { Alice: 1.0 },
    },
    utilities: {
      Alice: new PiecewiseLinearUtility(0, 100000),     // Takes everything
      Bob: new PiecewiseLinearUtility(15000, 40000),    // Mid-range needs
      Carol: new PiecewiseLinearUtility(50000, 50000),  // Precise target
    },
    totalCapital: 100000,
  },

  {
    name: "Scenario 4: High-Threshold Coalition",
    description: "Some users only want large allocations",
    graph: {
      Alice: { Bob: 1.0 },
      Bob: { Carol: 1.0 },
      Carol: { Alice: 1.0 },
    },
    utilities: {
      Alice: new PiecewiseLinearUtility(60000, 100000), // Only wants big allocations
      Bob: new PiecewiseLinearUtility(5000, 50000),     // Happy with anything
      Carol: new PiecewiseLinearUtility(70000, 100000), // Also wants big allocations
    },
    totalCapital: 100000,
  },

  {
    name: "Scenario 5: Mixed Demands",
    description: "Diverse utility preferences",
    graph: {
      Alice: { Bob: 0.4, Carol: 0.3, David: 0.3 },
      Bob: { Carol: 0.6, David: 0.4 },
      Carol: { Alice: 0.5, David: 0.5 },
      David: { Alice: 1.0 },
    },
    utilities: {
      Alice: new PiecewiseLinearUtility(20000, 80000),
      Bob: new PiecewiseLinearUtility(0, 100000),       // Takes anything
      Carol: new PiecewiseLinearUtility(15000, 35000),
      David: new PiecewiseLinearUtility(40000, 50000),  // Narrow window
    },
    totalCapital: 150000,
  },
];

// ============================================================================
// Main Execution
// ============================================================================

function runAllocationAnalysis() {
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║     Grant Allocation with EigenTrust & Utility Functions          ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  for (const scenario of SCENARIOS) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`📊 ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`${"─".repeat(70)}`);

    // 1. Convert graph to proper format for eigentrust
    const trustGraph = {};
    for (const [user, allocations] of Object.entries(scenario.graph)) {
      trustGraph[user] = { ...allocations };
    }

    // 2. Compute Modified EigenTrust
    console.log("\n1️⃣  Trust Network:");
    for (const [user, allocations] of Object.entries(scenario.graph)) {
      const allocs = Object.entries(allocations)
        .map(([to, weight]) => `${to}:${(weight * 100).toFixed(0)}%`)
        .join(", ");
      console.log(`   ${user} → ${allocs}`);
    }

    const trustScores = computeModifiedEigenTrust(trustGraph);
    console.log("\n2️⃣  Modified EigenTrust Scores:");
    const totalTrust = Object.values(trustScores).reduce((a, b) => a + b, 0);
    for (const [user, score] of Object.entries(trustScores).sort(
      (a, b) => b[1] - a[1]
    )) {
      const percentage = (score / totalTrust * 100).toFixed(1);
      console.log(`   ${user}: ${score.toFixed(4)} (${percentage}%)`);
    }

    // 3. Display Utility Functions
    console.log("\n3️⃣  Utility Functions (u(min)=0, u(max)=1, linear between):");
    for (const [user, util] of Object.entries(scenario.utilities)) {
      const t_i = trustScores[user];
      const slope = t_i * util.marginalUtility();
      console.log(
        `   ${user}: [$${util.min.toLocaleString()}, $${util.max.toLocaleString()}] ` +
        `(slope: t*u'=${slope.toFixed(4)})`
      );
    }

    // 4. Compare all three algorithms
    const algorithms = [
      { name: "Algorithm 1: Greedy Merit-Rank", fn: allocateCapitalMeritRank },
      { name: "Algorithm 2: Iterative Proportional", fn: allocateCapitalIterativeProp },
      { name: "Algorithm 3: Direct Merit", fn: allocateCapitalDirectMerit },
    ];

    console.log(`\n4️⃣  Allocation Comparison (Capital: $${scenario.totalCapital.toLocaleString()}):\n`);

    const algorithmResults = [];

    for (const algo of algorithms) {
      console.log(`   ${algo.name}:`);
      const allocations = algo.fn(trustScores, scenario.utilities, scenario.totalCapital);

      let totalAllocated = 0;
      const results = [];

      for (const [user, amount] of Object.entries(allocations).sort(
        (a, b) => b[1] - a[1]
      )) {
        const utility = scenario.utilities[user];
        const utilityValue = utility.evaluate(amount);
        const trustScore = trustScores[user];
        const weightedUtility = trustScore * utilityValue;

        results.push({
          user,
          amount,
          utilityValue,
          trustScore,
          weightedUtility,
        });

        totalAllocated += amount;
        const percentage = ((amount / scenario.totalCapital) * 100).toFixed(1);
        const trustPct = ((trustScore / Object.values(trustScores).reduce((a,b) => a+b, 0)) * 100).toFixed(1);
        console.log(
          `      ${user}: $${amount.toLocaleString().padStart(9)} (${percentage}%) [trust:${trustPct}%]`
        );
      }

      const totalWeightedUtility = results.reduce((sum, r) => sum + r.weightedUtility, 0);
      const capacityUtilization = (totalAllocated / scenario.totalCapital * 100).toFixed(1);

      algorithmResults.push({
        name: algo.name,
        allocations,
        totalWeightedUtility,
        capacityUtilization,
        results,
        totalAllocated,
      });

      console.log(
        `      → Total Utility: ${totalWeightedUtility.toFixed(4)}, ` +
        `Capacity: ${capacityUtilization}%\n`
      );
    }

    // 5. Comparison Summary
    console.log(`\n5️⃣  Algorithm Comparison Summary:`);
    algorithmResults.sort((a, b) => b.totalWeightedUtility - a.totalWeightedUtility);
    for (let i = 0; i < algorithmResults.length; i++) {
      const r = algorithmResults[i];
      const rank = i === 0 ? "🏆" : i === 1 ? "🥈" : "🥉";
      console.log(
        `   ${rank} ${r.name}: Utility=${r.totalWeightedUtility.toFixed(4)}, Capacity=${r.capacityUtilization}%`
      );
    }
  }

  console.log(
    `\n${"─".repeat(70)}\n` +
    "✅ Analysis Complete!\n"
  );
}

// Run the analysis
runAllocationAnalysis();
