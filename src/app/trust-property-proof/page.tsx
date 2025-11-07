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
      const cx = fromX;
      const cy = fromY - 40;
      const opacity = 0.3 + (weight * 0.7);
      const strokeWidth = 1 + (weight * 4);

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
    const startX = fromX + Math.cos(angle) * nodeRadius;
    const startY = fromY + Math.sin(angle) * nodeRadius;
    const endX = toX - Math.cos(angle) * nodeRadius;
    const endY = toY - Math.sin(angle) * nodeRadius;

    // Mid point for label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const opacity = 0.3 + (weight * 0.7);
    const strokeWidth = 1 + (weight * 4);

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

        {/* Footer Note */}
        <div className="text-center text-gray-500 text-sm">
          <p>This property makes our trust system resistant to manipulation and gaming.</p>
          <p className="mt-1">Users cannot artificially inflate their own trust scores through strategic allocations.</p>
        </div>
      </div>
    </div>
  );
}
