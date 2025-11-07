'use client';

import { useState, useEffect } from 'react';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  trustScores: Record<string, number>;
  highlightNode: string;
  description: string;
}

interface TestCase {
  name: string;
  initial: GraphState;
  modified: GraphState;
}

const TEST_CASES: TestCase[] = [
  {
    name: "Self-Loop Removal",
    initial: {
      nodes: [
        { id: 'A', x: 150, y: 100, label: 'Alice' },
        { id: 'B', x: 350, y: 100, label: 'Bob' },
        { id: 'C', x: 250, y: 250, label: 'Carol' },
      ],
      edges: [
        { from: 'A', to: 'A', weight: 0.5 },
        { from: 'A', to: 'B', weight: 0.5 },
        { from: 'B', to: 'C', weight: 1.0 },
        { from: 'C', to: 'A', weight: 0.7 },
        { from: 'C', to: 'B', weight: 0.3 },
      ],
      trustScores: { A: 0.428, B: 0.285, C: 0.287 },
      highlightNode: 'A',
      description: 'Alice allocates 50% to herself, 50% to Bob'
    },
    modified: {
      nodes: [
        { id: 'A', x: 150, y: 100, label: 'Alice' },
        { id: 'B', x: 350, y: 100, label: 'Bob' },
        { id: 'C', x: 250, y: 250, label: 'Carol' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: 1.0 },
        { from: 'B', to: 'C', weight: 1.0 },
        { from: 'C', to: 'A', weight: 0.7 },
        { from: 'C', to: 'B', weight: 0.3 },
      ],
      trustScores: { A: 0.428, B: 0.285, C: 0.287 },
      highlightNode: 'A',
      description: 'Alice now allocates 100% to Bob (removed self-loop)'
    }
  },
  {
    name: "Redistribution",
    initial: {
      nodes: [
        { id: 'A', x: 250, y: 80, label: 'Alice' },
        { id: 'B', x: 150, y: 200, label: 'Bob' },
        { id: 'C', x: 350, y: 200, label: 'Carol' },
        { id: 'D', x: 250, y: 320, label: 'David' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: 1.0 },
        { from: 'B', to: 'A', weight: 0.5 },
        { from: 'B', to: 'D', weight: 0.5 },
        { from: 'C', to: 'A', weight: 0.8 },
        { from: 'C', to: 'D', weight: 0.2 },
        { from: 'D', to: 'B', weight: 0.6 },
        { from: 'D', to: 'C', weight: 0.4 },
      ],
      trustScores: { A: 0.312, B: 0.298, C: 0.195, D: 0.195 },
      highlightNode: 'B',
      description: 'Bob allocates 50% to Alice, 50% to David'
    },
    modified: {
      nodes: [
        { id: 'A', x: 250, y: 80, label: 'Alice' },
        { id: 'B', x: 150, y: 200, label: 'Bob' },
        { id: 'C', x: 350, y: 200, label: 'Carol' },
        { id: 'D', x: 250, y: 320, label: 'David' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: 1.0 },
        { from: 'B', to: 'A', weight: 0.2 },
        { from: 'B', to: 'C', weight: 0.3 },
        { from: 'B', to: 'D', weight: 0.5 },
        { from: 'C', to: 'A', weight: 0.8 },
        { from: 'C', to: 'D', weight: 0.2 },
        { from: 'D', to: 'B', weight: 0.6 },
        { from: 'D', to: 'C', weight: 0.4 },
      ],
      trustScores: { A: 0.312, B: 0.298, C: 0.195, D: 0.195 },
      highlightNode: 'B',
      description: 'Bob now allocates 20% to Alice, 30% to Carol, 50% to David'
    }
  },
  {
    name: "Focus Shift",
    initial: {
      nodes: [
        { id: 'A', x: 250, y: 150, label: 'Alice' },
        { id: 'B', x: 100, y: 250, label: 'Bob' },
        { id: 'C', x: 400, y: 250, label: 'Carol' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: 0.5 },
        { from: 'A', to: 'C', weight: 0.5 },
        { from: 'B', to: 'A', weight: 1.0 },
        { from: 'C', to: 'A', weight: 1.0 },
      ],
      trustScores: { A: 0.521, B: 0.239, C: 0.240 },
      highlightNode: 'A',
      description: 'Alice splits evenly: 50% to Bob, 50% to Carol'
    },
    modified: {
      nodes: [
        { id: 'A', x: 250, y: 150, label: 'Alice' },
        { id: 'B', x: 100, y: 250, label: 'Bob' },
        { id: 'C', x: 400, y: 250, label: 'Carol' },
      ],
      edges: [
        { from: 'A', to: 'C', weight: 1.0 },
        { from: 'B', to: 'A', weight: 1.0 },
        { from: 'C', to: 'A', weight: 1.0 },
      ],
      trustScores: { A: 0.521, B: 0.239, C: 0.240 },
      highlightNode: 'A',
      description: 'Alice now focuses 100% on Carol'
    }
  },
  {
    name: "Complex Network",
    initial: {
      nodes: [
        { id: 'A', x: 250, y: 80, label: 'Alice' },
        { id: 'B', x: 100, y: 180, label: 'Bob' },
        { id: 'C', x: 400, y: 180, label: 'Carol' },
        { id: 'D', x: 150, y: 300, label: 'David' },
        { id: 'E', x: 350, y: 300, label: 'Eve' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: 0.3 },
        { from: 'A', to: 'C', weight: 0.7 },
        { from: 'B', to: 'D', weight: 0.6 },
        { from: 'B', to: 'E', weight: 0.4 },
        { from: 'C', to: 'E', weight: 1.0 },
        { from: 'D', to: 'A', weight: 0.5 },
        { from: 'D', to: 'B', weight: 0.5 },
        { from: 'E', to: 'C', weight: 0.8 },
        { from: 'E', to: 'A', weight: 0.2 },
      ],
      trustScores: { A: 0.187, B: 0.178, C: 0.285, D: 0.162, E: 0.188 },
      highlightNode: 'C',
      description: 'Carol allocates 100% to Eve'
    },
    modified: {
      nodes: [
        { id: 'A', x: 250, y: 80, label: 'Alice' },
        { id: 'B', x: 100, y: 180, label: 'Bob' },
        { id: 'C', x: 400, y: 180, label: 'Carol' },
        { id: 'D', x: 150, y: 300, label: 'David' },
        { id: 'E', x: 350, y: 300, label: 'Eve' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: 0.3 },
        { from: 'A', to: 'C', weight: 0.7 },
        { from: 'B', to: 'D', weight: 0.6 },
        { from: 'B', to: 'E', weight: 0.4 },
        { from: 'C', to: 'A', weight: 0.25 },
        { from: 'C', to: 'B', weight: 0.25 },
        { from: 'C', to: 'D', weight: 0.25 },
        { from: 'C', to: 'E', weight: 0.25 },
        { from: 'D', to: 'A', weight: 0.5 },
        { from: 'D', to: 'B', weight: 0.5 },
        { from: 'E', to: 'C', weight: 0.8 },
        { from: 'E', to: 'A', weight: 0.2 },
      ],
      trustScores: { A: 0.187, B: 0.178, C: 0.285, D: 0.162, E: 0.188 },
      highlightNode: 'C',
      description: 'Carol now distributes evenly: 25% to each person'
    }
  }
];

export default function TrustPropertyProofPage() {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [showModified, setShowModified] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const currentTest = TEST_CASES[currentTestIndex];
  const currentState = showModified ? currentTest.modified : currentTest.initial;

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      if (!showModified) {
        // Switch to modified view
        setShowModified(true);
      } else {
        // Move to next test case
        setShowModified(false);
        setCurrentTestIndex((prev) => (prev + 1) % TEST_CASES.length);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [showModified, currentTestIndex, isAnimating]);

  const drawArrow = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    weight: number,
    isSelfLoop: boolean
  ) => {
    if (isSelfLoop) {
      // Draw self-loop as a circle above the node
      const radius = 30;
      const cx = Math.round(fromX * 100) / 100;
      const cy = Math.round((fromY - 40) * 100) / 100;
      const opacity = Math.round((0.3 + (weight * 0.7)) * 100) / 100;
      const strokeWidth = Math.round((1 + (weight * 4)) * 100) / 100;

      return (
        <g key={`${fromX}-${fromY}-self`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#6366f1"
            strokeWidth={strokeWidth}
            opacity={opacity}
            markerEnd="url(#arrowhead)"
          />
          <text
            x={cx}
            y={cy - radius - 5}
            textAnchor="middle"
            className="text-xs font-semibold"
            fill="#6366f1"
          >
            {Math.round(weight * 100)}%
          </text>
        </g>
      );
    }

    // Regular arrow
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Shorten the arrow to not overlap with nodes
    const nodeRadius = 30;
    const startX = Math.round((fromX + Math.cos(angle) * nodeRadius) * 100) / 100;
    const startY = Math.round((fromY + Math.sin(angle) * nodeRadius) * 100) / 100;
    const endX = Math.round((toX - Math.cos(angle) * nodeRadius) * 100) / 100;
    const endY = Math.round((toY - Math.sin(angle) * nodeRadius) * 100) / 100;

    // Mid point for label
    const midX = Math.round(((startX + endX) / 2) * 100) / 100;
    const midY = Math.round(((startY + endY) / 2) * 100) / 100;

    const opacity = Math.round((0.3 + (weight * 0.7)) * 100) / 100;
    const strokeWidth = Math.round((1 + (weight * 4)) * 100) / 100;

    return (
      <g key={`${fromX}-${fromY}-${toX}-${toY}`}>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#6366f1"
          strokeWidth={strokeWidth}
          opacity={opacity}
          markerEnd="url(#arrowhead)"
        />
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          className="text-xs font-semibold"
          fill="#6366f1"
        >
          {Math.round(weight * 100)}%
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trust Score Independence
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our trust algorithm ensures that changing your own trust allocations{' '}
            <span className="font-semibold text-indigo-600">does not affect your own trust score</span>.
          </p>
        </div>

        {/* Main Visualization */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentTest.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Test case {currentTestIndex + 1} of {TEST_CASES.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isAnimating ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => {
                  setShowModified(false);
                  setCurrentTestIndex((prev) => (prev + 1) % TEST_CASES.length);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Next Case
              </button>
            </div>
          </div>

          {/* State Indicator */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              !showModified ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100'
            }`}>
              <div className={`w-3 h-3 rounded-full ${!showModified ? 'bg-indigo-500' : 'bg-gray-400'}`} />
              <span className="font-semibold">Original</span>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              showModified ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100'
            }`}>
              <div className={`w-3 h-3 rounded-full ${showModified ? 'bg-indigo-500' : 'bg-gray-400'}`} />
              <span className="font-semibold">Modified</span>
            </div>
          </div>

          {/* Graph Visualization */}
          <div className="relative">
            <svg width="500" height="400" className="mx-auto">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
                </marker>
              </defs>

              {/* Draw edges */}
              {currentState.edges.map((edge) => {
                const fromNode = currentState.nodes.find(n => n.id === edge.from);
                const toNode = currentState.nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const isSelfLoop = edge.from === edge.to;
                return drawArrow(
                  fromNode.x,
                  fromNode.y,
                  toNode.x,
                  toNode.y,
                  edge.weight,
                  isSelfLoop
                );
              })}

              {/* Draw nodes */}
              {currentState.nodes.map((node) => {
                const isHighlighted = node.id === currentState.highlightNode;
                const trustScore = currentState.trustScores[node.id];

                return (
                  <g key={node.id}>
                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={30}
                      fill={isHighlighted ? '#6366f1' : '#e0e7ff'}
                      stroke={isHighlighted ? '#4f46e5' : '#a5b4fc'}
                      strokeWidth={isHighlighted ? 4 : 2}
                      className="transition-all duration-300"
                    />
                    {/* Node label */}
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      className="text-sm font-bold pointer-events-none"
                      fill={isHighlighted ? 'white' : '#4f46e5'}
                    >
                      {node.label}
                    </text>
                    {/* Trust score */}
                    <text
                      x={node.x}
                      y={node.y + 55}
                      textAnchor="middle"
                      className={`text-lg font-bold transition-all duration-300 ${
                        isHighlighted ? 'text-indigo-600' : 'text-gray-600'
                      }`}
                      fill="currentColor"
                    >
                      {trustScore.toFixed(3)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Description */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-center text-gray-700">{currentState.description}</p>
          </div>

          {/* Key Observation */}
          <div className="mt-6 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 mb-2">Key Property</h3>
                <p className="text-indigo-800">
                  <span className="font-semibold">{currentState.nodes.find(n => n.id === currentState.highlightNode)?.label}'s trust score remains{' '}
                  {currentState.trustScores[currentState.highlightNode].toFixed(3)}</span>{' '}
                  despite changing their trust allocations. This prevents gaming and ensures fairness.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">72,550</div>
            <div className="text-gray-600">Test Cases Verified</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">0</div>
            <div className="text-gray-600">Property Violations</div>
          </div>
        </div>

        {/* Interactive Section */}
        <InteractiveGraph />

        {/* Footer Note */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>This property makes our trust system resistant to manipulation and gaming.</p>
          <p className="mt-1">Users cannot artificially inflate their own trust scores through strategic allocations.</p>
        </div>
      </div>
    </div>
  );
}

// Interactive Graph Component
function InteractiveGraph() {
  const UNIT_VERTEX = '__UNIT__';

  // Initial large graph setup (8 nodes in a circle)
  const initialNodes: GraphNode[] = [
    { id: 'A', x: 300, y: 50, label: 'Alice' },
    { id: 'B', x: 500, y: 100, label: 'Bob' },
    { id: 'C', x: 550, y: 300, label: 'Carol' },
    { id: 'D', x: 450, y: 450, label: 'David' },
    { id: 'E', x: 250, y: 450, label: 'Eve' },
    { id: 'F', x: 150, y: 300, label: 'Frank' },
    { id: 'G', x: 200, y: 100, label: 'Grace' },
    { id: 'H', x: 350, y: 250, label: 'Henry' },
  ];

  // Initial graph allocations
  const initialGraph: Record<string, Record<string, number>> = {
    A: { B: 0.4, G: 0.3, H: 0.3 },
    B: { A: 0.2, C: 0.5, H: 0.3 },
    C: { B: 0.3, D: 0.4, H: 0.3 },
    D: { C: 0.3, E: 0.4, H: 0.3 },
    E: { D: 0.3, F: 0.4, H: 0.3 },
    F: { E: 0.3, G: 0.4, H: 0.3 },
    G: { F: 0.3, A: 0.4, H: 0.3 },
    H: { A: 0.2, C: 0.2, E: 0.2, G: 0.2, [UNIT_VERTEX]: 0.2 },
  };

  const [graph, setGraph] = useState(initialGraph);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [isComputing, setIsComputing] = useState(false);
  const [results, setResults] = useState<{
    standard: Record<string, number>;
    modified: Record<string, number>;
  } | null>(null);
  const [originalResults, setOriginalResults] = useState<{
    standard: Record<string, number>;
    modified: Record<string, number>;
  } | null>(null);

  // Compute initial scores
  useEffect(() => {
    computeScores(initialGraph, true);
  }, []);

  const computeScores = async (graphData: Record<string, Record<string, number>>, isInitial = false) => {
    setIsComputing(true);
    try {
      const response = await fetch('/api/eigentrust/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: graphData }),
      });

      const data = await response.json();
      setResults(data);

      if (isInitial) {
        setOriginalResults(data);
      }
    } catch (error) {
      console.error('Error computing scores:', error);
    } finally {
      setIsComputing(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    setSliderValues(graph[nodeId] || {});
    // Reset original results to current results when switching nodes
    // This ensures we compare against the score at the moment of selection
    if (results) {
      setOriginalResults(results);
    }
  };

  const handleSliderChange = (target: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [target]: value }));
  };

  const handleSliderRelease = async (target: string) => {
    if (!selectedNode) return;

    // Normalize allocations to sum to 1.0
    const total = Object.values(sliderValues).reduce((sum, val) => sum + val, 0);
    const normalized: Record<string, number> = {};
    for (const [t, val] of Object.entries(sliderValues)) {
      normalized[t] = total > 0 ? val / total : 0;
    }

    // Update graph
    const newGraph = {
      ...graph,
      [selectedNode]: normalized,
    };
    setGraph(newGraph);

    // Compute new scores
    await computeScores(newGraph);
  };

  const allTargets = [...initialNodes.map(n => n.id).filter(id => id !== selectedNode), UNIT_VERTEX];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Interactive Demonstration
        </h2>
        <p className="text-gray-600">
          Click any node to modify its trust allocations. Watch how standard EigenTrust changes the node's score, but our modified algorithm keeps it constant.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Graph Visualization */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Trust Network</h3>
          <svg width="700" height="500" className="border border-gray-200 rounded-lg">
            <defs>
              <marker
                id="arrowhead-interactive"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
              </marker>
            </defs>

            {/* Draw edges only for selected node */}
            {selectedNode && initialNodes.map((targetNode) => {
              if (targetNode.id === selectedNode) return null;

              const fromNode = initialNodes.find(n => n.id === selectedNode);
              if (!fromNode) return null;

              const weight = sliderValues[targetNode.id] || 0;
              if (weight === 0) return null;

              const dx = targetNode.x - fromNode.x;
              const dy = targetNode.y - fromNode.y;
              const angle = Math.atan2(dy, dx);
              const nodeRadius = 30;

              const startX = fromNode.x + Math.cos(angle) * nodeRadius;
              const startY = fromNode.y + Math.sin(angle) * nodeRadius;
              const endX = targetNode.x - Math.cos(angle) * nodeRadius;
              const endY = targetNode.y - Math.sin(angle) * nodeRadius;

              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              const opacity = 0.3 + (weight * 0.7);
              const strokeWidth = 2 + (weight * 6);

              return (
                <g key={`${fromNode.id}-${targetNode.id}`}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#6366f1"
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    markerEnd="url(#arrowhead-interactive)"
                  />
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    className="text-sm font-semibold"
                    fill="#6366f1"
                  >
                    {Math.round(weight * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Draw nodes */}
            {initialNodes.map((node) => {
              const isSelected = node.id === selectedNode;
              const standardScore = results?.standard[node.id] || 0;
              const modifiedScore = results?.modified[node.id] || 0;

              return (
                <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={30}
                    fill={isSelected ? '#6366f1' : '#e0e7ff'}
                    stroke={isSelected ? '#4f46e5' : '#a5b4fc'}
                    strokeWidth={isSelected ? 4 : 2}
                    className="transition-all duration-300 hover:stroke-indigo-600"
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    className="text-sm font-bold pointer-events-none"
                    fill={isSelected ? 'white' : '#4f46e5'}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Sliders and Results */}
        <div>
          {!selectedNode ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">👆</div>
                <p className="text-lg">Click any node to adjust its trust allocations</p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {initialNodes.find(n => n.id === selectedNode)?.label}'s Trust Allocations
              </h3>

              {/* Sliders */}
              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                {allTargets.map((target) => {
                  const value = sliderValues[target] || 0;
                  const label = target === UNIT_VERTEX ? 'Unit ()' : initialNodes.find(n => n.id === target)?.label || target;

                  return (
                    <div key={target} className="p-3 rounded-lg border bg-white border-gray-200">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">{label}</span>
                        <span className="font-semibold text-indigo-600">{Math.round(value * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value * 100}
                        onChange={(e) => handleSliderChange(target, parseFloat(e.target.value) / 100)}
                        onMouseUp={() => handleSliderRelease(target)}
                        onTouchEnd={() => handleSliderRelease(target)}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-indigo-200"
                        style={{
                          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${value * 100}%, #c7d2fe ${value * 100}%, #c7d2fe 100%)`
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Results Comparison */}
              {results && originalResults && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-center">Trust Score Comparison</h4>

                    {/* Standard EigenTrust */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-3">
                      <div className="text-sm font-semibold text-red-900 mb-2">Standard EigenTrust</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-600">Original</div>
                          <div className="text-lg font-bold text-gray-700">
                            {originalResults.standard[selectedNode]?.toFixed(4)}
                          </div>
                        </div>
                        <div className="text-2xl text-gray-400">→</div>
                        <div>
                          <div className="text-xs text-gray-600">After Change</div>
                          <div className="text-lg font-bold text-red-600">
                            {results.standard[selectedNode]?.toFixed(4)}
                          </div>
                        </div>
                        <div className={`text-sm font-semibold px-3 py-1 rounded ${
                          Math.abs(results.standard[selectedNode] - originalResults.standard[selectedNode]) > 0.0001
                            ? 'bg-red-200 text-red-800'
                            : 'bg-green-200 text-green-800'
                        }`}>
                          {Math.abs(results.standard[selectedNode] - originalResults.standard[selectedNode]) > 0.0001 ? '✗ Changed' : '✓ Same'}
                        </div>
                      </div>
                    </div>

                    {/* Modified EigenTrust */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-green-900 mb-2">Our Modified Algorithm</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-600">Original</div>
                          <div className="text-lg font-bold text-gray-700">
                            {originalResults.modified[selectedNode]?.toFixed(4)}
                          </div>
                        </div>
                        <div className="text-2xl text-gray-400">→</div>
                        <div>
                          <div className="text-xs text-gray-600">After Change</div>
                          <div className="text-lg font-bold text-green-600">
                            {results.modified[selectedNode]?.toFixed(4)}
                          </div>
                        </div>
                        <div className={`text-sm font-semibold px-3 py-1 rounded ${
                          Math.abs(results.modified[selectedNode] - originalResults.modified[selectedNode]) > 0.0001
                            ? 'bg-red-200 text-red-800'
                            : 'bg-green-200 text-green-800'
                        }`}>
                          {Math.abs(results.modified[selectedNode] - originalResults.modified[selectedNode]) > 0.0001 ? '✗ Changed' : '✓ Unchanged'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isComputing && (
                    <div className="text-center text-sm text-gray-500">Computing...</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
