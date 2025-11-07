# Modified EigenTrust Algorithm

## Problem Statement

In standard EigenTrust, a vertex changing its outgoing trust allocations can affect its own trust score due to feedback loops in the network. This creates a circular dependency where users can potentially game their own scores.

## Desired Property

**Allocation Independence**: A vertex k changing its outgoing trust allocations should NOT change its own trust score T_k.

## Why Standard EigenTrust Fails

Standard EigenTrust computes trust as the eigenvector of the trust matrix:

```
T_k = (1-α) × Σ_i C_ik × T_i + α × p_k
```

Although T_k only explicitly depends on **incoming** edges (C_ik), the system is coupled:
1. Vertex k changes its outgoing allocations (row k of matrix C)
2. This affects other vertices' scores T_j
3. Those changed scores propagate through the network
4. Eventually flow back to affect T_k through indirect paths

**Test Results**: Standard EigenTrust violates the property in ~76% of test cases.

## The Solution: Two-Phase Decoupled Computation

### Algorithm

For each vertex k, compute its trust score independently:

1. **Create Frozen Subgraph**: Build a subgraph where vertex k allocates all weight to the unit vertex (essentially removing k's influence on the network)

2. **Compute Frozen Scores**: Run standard EigenTrust on this subgraph to get "frozen" trust scores for all other vertices. These scores are independent of k's actual allocations.

3. **Compute k's Score**: Calculate k's trust score based on:
   - Incoming edge weights from other vertices
   - The frozen scores computed in step 2

   ```
   T_k = (1-α) × Σ_{i≠k} (C_ik × T_frozen_i) + α × p_k
   ```

4. **No Normalization**: Do NOT normalize the final scores. Normalization couples all scores together, making independence impossible.

### Why This Works

- k's allocations are excluded when computing others' scores (step 1-2)
- k's score depends only on those frozen scores and incoming edges (step 3)
- Therefore, k's allocations cannot affect its own score directly or indirectly

### Trade-offs

**Pros:**
- ✓ Guarantees allocation independence
- ✓ Eliminates gaming through self-allocation
- ✓ Maintains Sybil resistance (fake accounts still don't help)
- ✓ Preserves pretrust mechanism

**Cons:**
- Higher computational cost: O(n) EigenTrust computations instead of 1
- Scores are unnormalized (but can still be ranked)
- Scores may have different scale than standard EigenTrust

**Computational Complexity:**
- Standard EigenTrust: O(m × iter) where m = edges, iter = convergence iterations
- Modified EigenTrust: O(n × m × iter) where n = vertices
- For sparse graphs: Still manageable for networks up to ~1000 vertices

## Test Results

Comprehensive testing across **72,550 test cases**:

### Test Coverage

1. **Base Graphs** (450 tests):
   - Linear chains
   - Cycles
   - Self-loops
   - Star graphs (central hub)
   - Complete graphs (fully connected)
   - Disconnected components
   - All-to-unit allocations
   - Complex asymmetric patterns
   - Multiple self-loops

2. **Random Graphs** (72,100 tests):
   - 500 randomly generated graphs
   - 3-12 vertices per graph
   - Random allocation patterns
   - Various structural properties

3. **Allocation Modifications** per vertex:
   - All weight to unit vertex
   - Self-loops
   - Equal distribution
   - Single-target focus
   - Mixed allocations (self + others)
   - Three-way splits
   - Random variants

### Results

```
Modified EigenTrust:
  Total tests: 72,550
  Violations: 0
  Success rate: 100.00%

Standard EigenTrust (comparison):
  Total tests: 450
  Violations: 343
  Success rate: 23.78%
```

## Implementation Notes

### Pseudocode

```python
def compute_modified_eigentrust(graph, pretrust):
    vertices = graph.vertices
    scores = {}

    for k in vertices:
        # Build subgraph excluding k's allocations
        subgraph = graph.copy()
        subgraph.set_allocations(k, {UNIT: 1.0})

        # Compute frozen scores
        frozen_scores = standard_eigentrust(subgraph, pretrust)

        # Compute k's score from frozen scores
        incoming_trust = 0
        for i in vertices:
            if i != k:
                weight = graph.get_allocation(i, k)
                incoming_trust += weight * frozen_scores[i]

        scores[k] = (1 - alpha) * incoming_trust + alpha * pretrust[k]

    # DO NOT normalize scores
    return scores
```

### Key Implementation Details

1. **Unit Vertex**: Use a special unit vertex `()` to absorb unallocated weight
2. **Normalization**: Exclude k's allocations by setting them all to unit, not by removing the vertex entirely
3. **Decay Factor**: Standard α (e.g., 0.15) still applies
4. **Convergence**: Use same convergence criteria as standard EigenTrust for subgraph computations

## Use Cases

This modification is particularly valuable for:

- **Grant allocation systems**: Where applicants shouldn't be able to game their own funding
- **Reputation systems**: Where users shouldn't benefit from strategic self-allocation
- **Peer review systems**: Where reviewers' scores shouldn't depend on how they review others
- **Any trust network where allocation independence is desired**

## Comparison Table

| Property | Standard EigenTrust | Modified EigenTrust |
|----------|-------------------|-------------------|
| Allocation Independence | ✗ No | ✓ Yes |
| Normalized Scores | ✓ Yes | ✗ No |
| Single Computation | ✓ Yes | ✗ No (n computations) |
| Sybil Resistance | ✓ Yes | ✓ Yes |
| Pretrust Support | ✓ Yes | ✓ Yes |
| Time Complexity | O(m × iter) | O(n × m × iter) |
| Gaming Resistant | Partial | Strong |

## Conclusion

The modified EigenTrust algorithm successfully achieves allocation independence through two-phase decoupled computation without normalization. Extensive testing validates the property holds across diverse graph structures and allocation patterns.

The computational cost is higher (O(n) factor), but for most practical applications with < 1000 vertices, this remains feasible. The elimination of gaming through self-allocation makes this trade-off worthwhile for trust-critical applications.

---

**Test Suite**: `test-modified-eigentrust.js`
**Validation**: 72,550 tests, 100% success rate
**Date**: 2025-11-06
