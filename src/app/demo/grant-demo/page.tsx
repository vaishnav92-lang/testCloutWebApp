'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDemoAuth } from '@/hooks/useDemo'

type Phase = 'intro' | 'admin-creates' | 'applicants-apply' | 'applicants-trust' | 'utility-over-value' | 'results'

interface Applicant {
  id: string
  name: string
  project: string
  description: string
}

interface AllApplicantsAllocations {
  [fromApplicantId: string]: {
    [toApplicantId: string]: number
  }
}

interface UtilityFunction {
  [applicantId: string]: {
    min: number
    max: number
  }
}

const APPLICANTS: Applicant[] = [
  {
    id: 'alice',
    name: 'Alice',
    project: 'AI Safety Alignment Framework',
    description: 'A novel approach to aligning AI systems with human values using interpretability techniques',
  },
  {
    id: 'bob',
    name: 'Bob',
    project: 'Robustness Testing for AI Systems',
    description: 'Comprehensive testing framework to identify vulnerabilities in AI safety mechanisms',
  },
  {
    id: 'carol',
    name: 'Carol',
    project: 'AI Governance & Policy',
    description: 'Developing frameworks for responsible AI governance and regulatory compliance',
  },
  {
    id: 'david',
    name: 'David',
    project: 'Interpretability Methods for LLMs',
    description: 'Advancing our understanding of how large language models make decisions',
  },
  {
    id: 'emma',
    name: 'Emma',
    project: 'Scalable AI Monitoring Systems',
    description: 'Building infrastructure to monitor and audit AI systems at scale',
  },
]

export default function GrantDemoPage() {
  useDemoAuth()
  const [currentPhase, setCurrentPhase] = useState<Phase>('intro')
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>('alice')

  // Each applicant's trust allocations to others
  // Varied network: some concentrated (100/0), some sparse (85/15), some 2-3 way splits
  const [allocations, setAllocations] = useState<AllApplicantsAllocations>({
    alice: { bob: 100, carol: 0, david: 0, emma: 0 },        // Fully concentrated on Bob
    bob: { alice: 85, carol: 15, david: 0, emma: 0 },        // Very sparse: Alice/Carol split
    carol: { alice: 0, bob: 30, david: 70, emma: 0 },        // Focused on David and Bob
    david: { alice: 50, bob: 0, carol: 40, emma: 10 },       // Concentrated on Alice/Carol with small Emma
    emma: { alice: 0, bob: 60, carol: 25, david: 15 },       // Concentrated on Bob, some Carol/David
  })

  const [utilities, setUtilities] = useState<UtilityFunction>({
    alice: { min: 28000, max: 55000 },      // High trust (0.25): can support high min
    bob: { min: 15000, max: 60000 },        // Highest trust (0.35): medium min, generous max
    carol: { min: 4000, max: 22000 },       // Medium trust (0.15): low min, modest max
    david: { min: 18000, max: 45000 },      // Medium-high trust (0.20): medium-high min
    emma: { min: 25000, max: 40000 },       // Low trust (0.05): high min → likely disqualified
  })

  const [computing, setComputing] = useState(false)
  const [eigentrustScores, setEigentrustScores] = useState<Record<string, number> | null>(null)
  const [finalAllocations, setFinalAllocations] = useState<Record<string, number> | null>(null)

  const phases: Phase[] = ['intro', 'admin-creates', 'applicants-apply', 'applicants-trust', 'utility-over-value', 'results']
  const currentIndex = phases.indexOf(currentPhase)

  // Convert allocations to graph format and call API immediately when computing
  useEffect(() => {
    if (computing && !eigentrustScores) {
      // Build graph from allocations
      const graph: Record<string, Record<string, number>> = {}

      APPLICANTS.forEach(app => {
        graph[app.id] = {}
        const appAllocations = allocations[app.id] || {}
        const total = Object.values(appAllocations).reduce((a, b) => a + b, 0)

        APPLICANTS.forEach(other => {
          if (other.id !== app.id) {
            const rawValue = appAllocations[other.id] || 0
            graph[app.id][other.id] = total > 0 ? rawValue / 100 : 0
          }
        })
      })

      // Call the API immediately
      fetch('/api/eigentrust/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph }),
      })
        .then(res => res.json())
        .then(data => {
          setEigentrustScores(data.modified)
          // Compute final allocations
          const allocResult = allocateCapital(data.modified, utilities, 100000)
          setFinalAllocations(allocResult)
          setComputing(false)
        })
        .catch(error => {
          console.error('Error computing EigenTrust:', error)
          setComputing(false)
        })
    }
  }, [computing, eigentrustScores, allocations])

  // Exact Utility-Maximizing Allocation via Subset Enumeration
  // Algorithm (from Grok):
  // 1. Enumerate all 2^n subsets S of applicants to potentially fund
  // 2. For each subset S:
  //    - Check if Σ(min_i for i in S) <= B (feasible)
  //    - Allocate remaining budget greedily by marginal rate r_i = t_i/(max_i - min_i)
  //    - Compute total utility: Σ t_i * u_i(x_i)
  // 3. Select subset with maximum total utility
  // Properties:
  // - Optimal: maximizes Σ t_i * u_i(x_i) exactly
  // - High min + low trust → excluded (doesn't maximize utility)
  // - High min + high trust → included if utility gain justifies cost
  // - Merit-driven: trust score directly affects priority and utility
  const allocateCapital = (trustScores: Record<string, number>, utils: UtilityFunction, totalCapital: number) => {
    const users = Object.keys(trustScores)
    const n = users.length

    let bestUtility = 0
    let bestAllocations: Record<string, number> = {}

    // Initialize all allocations to 0
    for (const userId of users) {
      bestAllocations[userId] = 0
    }

    // Enumerate all 2^n subsets
    for (let mask = 0; mask < (1 << n); mask++) {
      const subset: string[] = []

      // Build subset from bitmask
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          subset.push(users[i])
        }
      }

      // Check feasibility: sum of minimums must not exceed budget
      let fixedCost = 0
      for (const userId of subset) {
        fixedCost += utils[userId].min
      }

      if (fixedCost > totalCapital) continue // Infeasible

      // Allocate remaining budget optimally for this subset
      const remainingBudget = totalCapital - fixedCost

      // Compute marginal rates and sort by descending order
      const marginalRates = subset.map(userId => ({
        userId,
        rate: trustScores[userId] / (utils[userId].max - utils[userId].min),
      }))
      marginalRates.sort((a, b) => b.rate - a.rate)

      // Greedy allocation of remaining budget
      const allocations: Record<string, number> = {}
      for (const userId of users) {
        allocations[userId] = 0
      }

      // Assign minimums
      for (const userId of subset) {
        allocations[userId] = utils[userId].min
      }

      // Distribute remaining budget to subset members by marginal rate
      let remaining = remainingBudget
      for (const { userId } of marginalRates) {
        const range = utils[userId].max - utils[userId].min
        const additional = Math.min(remaining, range)
        allocations[userId] += additional
        remaining -= additional

        if (remaining <= 0) break
      }

      // Compute total utility for this allocation
      let totalUtility = 0
      for (const userId of users) {
        const x_i = allocations[userId]
        const min_i = utils[userId].min
        const max_i = utils[userId].max
        const t_i = trustScores[userId]

        // Utility: 0 if below min, linear between min-max, 1 if above max
        let u_i = 0
        if (x_i >= min_i && x_i <= max_i) {
          u_i = (x_i - min_i) / (max_i - min_i)
        } else if (x_i > max_i) {
          u_i = 1
        }

        totalUtility += t_i * u_i
      }

      // Update best if this subset is better
      if (totalUtility > bestUtility) {
        bestUtility = totalUtility
        bestAllocations = allocations
      }
    }

    return bestAllocations
  }

  const handleNext = () => {
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1]
      if (nextPhase === 'results') {
        setComputing(true)
      }
      setCurrentPhase(nextPhase)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentPhase(phases[currentIndex - 1])
    }
  }

  const handleAllocationChange = (fromApplicantId: string, toApplicantId: string, newValue: number) => {
    const value = Math.max(0, Math.min(100, newValue))

    // Get other allocations for this applicant
    const appAllocations = { ...allocations[fromApplicantId] }
    const otherTotal = Object.entries(appAllocations)
      .filter(([id]) => id !== toApplicantId)
      .reduce((sum, [_, val]) => sum + val, 0)

    if (otherTotal + value > 100) {
      const maxAllowed = 100 - otherTotal
      appAllocations[toApplicantId] = maxAllowed
    } else {
      appAllocations[toApplicantId] = value
    }

    setAllocations(prev => ({
      ...prev,
      [fromApplicantId]: appAllocations,
    }))
  }

  const handleRebalance = (fromApplicantId: string) => {
    const otherApplicants = APPLICANTS.filter(a => a.id !== fromApplicantId)
    const perApplicant = Math.floor(100 / otherApplicants.length)
    const remainder = 100 % otherApplicants.length

    const newAllocations: Record<string, number> = {}
    otherApplicants.forEach((app, idx) => {
      newAllocations[app.id] = perApplicant + (idx < remainder ? 1 : 0)
    })

    setAllocations(prev => ({
      ...prev,
      [fromApplicantId]: newAllocations,
    }))
  }

  const getPhaseStatus = (phase: Phase) => {
    const phaseIndex = phases.indexOf(phase)
    if (phaseIndex < currentIndex) return 'completed'
    if (phaseIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current':
        return '→'
      case 'completed':
        return '✓'
      case 'pending':
        return '○'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-indigo-100 border-indigo-300'
      case 'completed':
        return 'bg-green-100 border-green-300'
      case 'pending':
        return 'bg-gray-100 border-gray-300'
    }
  }

  // Calculate funding allocations
  const fundingTotal = 100000
  let fundingAllocations: Record<string, number> = {}
  if (eigentrustScores) {
    const totalScore = Object.values(eigentrustScores).reduce((a, b) => a + b, 0)
    APPLICANTS.forEach(app => {
      fundingAllocations[app.id] = (eigentrustScores[app.id] / totalScore) * fundingTotal
    })
  }

  const getTotalAllocated = (applicantId: string) => {
    const appAllocations = allocations[applicantId] || {}
    return Object.values(appAllocations).reduce((a, b) => a + b, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Grant Allocation: The Complete Journey
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Demo</span>
            </h1>
            <p className="text-sm text-gray-500">Admin creates $100K grant • Applicants apply, allocate trust & define utility • EigenTrust computes fair allocations</p>
          </div>
          <Link href="/demo/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Phase */}
        {currentPhase === 'intro' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fair Grant Allocation with EigenTrust</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              See how five AI safety researchers compete for $100K in funding. Each applicant rates the others with trust scores, specifies their funding needs, and a fair allocation algorithm combines both to compute the outcome.
            </p>
            <div className="mb-8">
              <Link href="/trust-property-proof" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm inline-block">
                Learn more about Modified EigenTrust →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 max-w-5xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">Admin Creates</h3>
                <p className="text-sm text-blue-800">Sets up a $100K grant round</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2">Apply & Rate</h3>
                <p className="text-sm text-purple-800">Submit proposals and rate peers</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
                <h3 className="font-bold text-yellow-900 mb-2">Define Utility</h3>
                <p className="text-sm text-yellow-800">Specify min/max funding needs</p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-2">Results</h3>
                <p className="text-sm text-green-800">Fair allocations computed</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start the Journey
            </button>
          </div>
        )}

        {/* Main Content for Phases 1-4 */}
        {currentPhase !== 'intro' && (
          <>
            {/* Phase Navigation */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2 mb-6">
                {phases.slice(1).map((phase) => {
                  const status = getPhaseStatus(phase)
                  const phaseNames: Record<Exclude<Phase, 'intro'>, string> = {
                    'admin-creates': 'Admin Creates',
                    'applicants-apply': 'Applicants Apply',
                    'applicants-trust': 'Allocate Trust',
                    'utility-over-value': 'Utility Function',
                    'results': 'Results',
                  }
                  return (
                    <div key={phase} className="flex-1">
                      <div className={`p-4 rounded-lg border-2 ${getStatusColor(status)} transition-all`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold">{getStatusIcon(status)}</span>
                          <p className="text-sm font-semibold text-gray-900">{phaseNames[phase as Exclude<Phase, 'intro'>]}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Admin Side */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-300">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                    🏛 Grant Admin
                    {['admin-creates'].includes(currentPhase) && (
                      <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded font-semibold">Active</span>
                    )}
                  </h2>

                  {currentPhase === 'admin-creates' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Creating a Grant Round</h3>
                      <div className="bg-white rounded p-4 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Grant Round Name</label>
                          <p className="text-gray-900 font-semibold mt-1">AI Safety Research Initiative 2025</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Focus Area</label>
                          <p className="text-gray-900 font-semibold mt-1">Research in AI safety and alignment</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Total Funding Available</label>
                          <p className="text-gray-900 font-semibold text-lg mt-1">$100,000</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          <p className="text-gray-900 font-semibold mt-1 bg-green-100 text-green-900 w-fit px-3 py-1 rounded">
                            PHASE_ONE_VETTING
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'applicants-apply' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Waiting for applicants to submit proposals...</p>
                      <div className="animate-pulse">
                        <div className="inline-block">
                          <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'applicants-trust' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Applicants are allocating trust to each other...</p>
                      <div className="animate-pulse">
                        <div className="inline-block">
                          <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'utility-over-value' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Applicants are defining their utility functions...</p>
                      <div className="animate-pulse">
                        <div className="inline-block">
                          <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'results' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Summary & Analysis</h3>
                      <div className="space-y-3">
                        {APPLICANTS.map(app => {
                          const amount = finalAllocations?.[app.id] || 0
                          const trust = eigentrustScores?.[app.id] || 0
                          const util = utilities[app.id]
                          return (
                            <div key={app.id} className="bg-white rounded p-3 border-l-4 border-indigo-500">
                              <p className="font-semibold text-gray-900">{app.name}</p>
                              <p className="text-xs text-gray-600 mt-1">{app.project}</p>
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Trust Score:</span>
                                  <span className="font-semibold">{trust.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Utility Range:</span>
                                  <span className="font-semibold">${util?.min?.toLocaleString()} - ${util?.max?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Allocation:</span>
                                  <span className="font-bold text-indigo-600">${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Applicants Side */}
              <div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border-2 border-purple-300">
                  <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                    👥 Applicants
                    {['applicants-apply', 'applicants-trust'].includes(currentPhase) && (
                      <span className="text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded font-semibold">Active</span>
                    )}
                  </h2>

                  {currentPhase === 'admin-creates' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Waiting for grant round to open...</p>
                    </div>
                  )}

                  {currentPhase === 'applicants-apply' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Submitting AI Safety Research Proposals</h3>
                      <p className="text-sm text-gray-600 mb-4">Three researchers propose innovative AI safety projects:</p>
                      <div className="space-y-3">
                        {APPLICANTS.map(app => (
                          <div key={app.id} className="bg-white rounded p-3 border border-gray-200">
                            <p className="font-semibold text-gray-900">{app.name}: {app.project}</p>
                            <p className="text-xs text-gray-600 mt-1">{app.description}</p>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">Submitted</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentPhase === 'applicants-trust' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Allocate Trust (0-100 points)</h3>
                      <p className="text-sm text-gray-600 mb-4">Each applicant rates the others. Try different allocations to see how it affects the outcomes!</p>

                      <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 text-sm text-blue-800">
                        <strong>Note:</strong> Each applicant independently allocates their 100 trust points. Adjust and see how allocations change the final results.
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {APPLICANTS.map(applicant => (
                          <div key={applicant.id} className="bg-white rounded border border-gray-200">
                            {/* Collapsible Header */}
                            <button
                              onClick={() => setExpandedApplicant(expandedApplicant === applicant.id ? null : applicant.id)}
                              className="w-full px-3 py-2 text-left font-semibold text-gray-900 hover:bg-gray-50 flex justify-between items-center"
                            >
                              <span>{applicant.name} allocating trust</span>
                              <span className="text-xs font-normal text-gray-600">
                                {getTotalAllocated(applicant.id)}/100
                              </span>
                            </button>

                            {/* Expanded Content */}
                            {expandedApplicant === applicant.id && (
                              <div className="border-t border-gray-200 p-3 space-y-3">
                                {APPLICANTS.filter(a => a.id !== applicant.id).map(other => (
                                  <div key={other.id}>
                                    <div className="flex justify-between items-center mb-2">
                                      <label className="text-sm font-medium text-gray-900">{other.name}</label>
                                      <span className="text-sm font-bold text-indigo-600">
                                        {allocations[applicant.id]?.[other.id] || 0}
                                      </span>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={allocations[applicant.id]?.[other.id] || 0}
                                        onChange={e =>
                                          handleAllocationChange(applicant.id, other.id, parseInt(e.target.value))
                                        }
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={allocations[applicant.id]?.[other.id] || 0}
                                        onChange={e =>
                                          handleAllocationChange(
                                            applicant.id,
                                            other.id,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>

                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                                      <div
                                        className="h-full bg-indigo-500 transition-all"
                                        style={{
                                          width: `${allocations[applicant.id]?.[other.id] || 0}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}

                                <div className="bg-gray-50 rounded p-2 border border-gray-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-700">Total</span>
                                    <span
                                      className={`text-xs font-bold ${
                                        getTotalAllocated(applicant.id) === 100
                                          ? 'text-green-600'
                                          : 'text-orange-600'
                                      }`}
                                    >
                                      {getTotalAllocated(applicant.id)}/100
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600 transition-all"
                                      style={{ width: `${Math.min(getTotalAllocated(applicant.id), 100)}%` }}
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRebalance(applicant.id)}
                                  className="w-full px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-900 rounded font-medium transition-colors"
                                >
                                  Rebalance Equally
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentPhase === 'utility-over-value' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Define Your Utility Function</h3>
                      <p className="text-sm text-gray-600 mb-4">Specify the minimum and maximum amounts you'd find useful. Users get full utility at max and zero below min. Utility is linear between the min and max.</p>

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {APPLICANTS.map(applicant => (
                          <div key={applicant.id} className="bg-white rounded border border-gray-200 p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">{applicant.name}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Minimum Amount ($)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={utilities[applicant.id]?.min || 0}
                                  onChange={e => {
                                    const newMin = Math.max(0, parseInt(e.target.value) || 0)
                                    const currentMax = utilities[applicant.id]?.max || newMin
                                    setUtilities(prev => ({
                                      ...prev,
                                      [applicant.id]: {
                                        min: Math.min(newMin, currentMax),
                                        max: currentMax,
                                      },
                                    }))
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Maximum Amount ($)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={utilities[applicant.id]?.max || 0}
                                  onChange={e => {
                                    const newMax = Math.max(0, parseInt(e.target.value) || 0)
                                    const currentMin = utilities[applicant.id]?.min || 0
                                    setUtilities(prev => ({
                                      ...prev,
                                      [applicant.id]: {
                                        min: currentMin,
                                        max: Math.max(newMax, currentMin),
                                      },
                                    }))
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              Range: ${utilities[applicant.id]?.min?.toLocaleString() || 0} - ${utilities[applicant.id]?.max?.toLocaleString() || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentPhase === 'results' && (
                    <div className="space-y-4">
                      {computing ? (
                        <div className="text-center py-8">
                          <div className="inline-block mb-3">
                            <div className="animate-spin">
                              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                          </div>
                          <p className="font-semibold text-purple-900">Computing allocations...</p>
                          <p className="text-xs text-purple-700 mt-1">Running Modified EigenTrust algorithm</p>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-gray-900 text-lg">Final Allocations</h3>
                          <p className="text-sm text-gray-600 mb-4">Computed from EigenTrust scores and your utility preferences.</p>
                          <div className="space-y-3">
                            {APPLICANTS.map(app => {
                              const amount = finalAllocations?.[app.id] || 0
                              const util = utilities[app.id]
                              const utilValue = util ? (amount < util.min ? 0 : amount > util.max ? 1 : (amount - util.min) / (util.max - util.min)) : 0
                              const trust = eigentrustScores?.[app.id] || 0
                              return (
                                <div key={app.id} className="bg-white rounded p-4 border-l-4 border-green-500">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-gray-900">{app.name}</p>
                                      <p className="text-xs text-gray-600 mt-1">{app.project}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-green-600">
                                        ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-3 text-xs">
                                    <div>
                                      <p className="text-gray-600">Trust Score</p>
                                      <p className="font-semibold text-gray-900">{trust.toFixed(4)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Utility Range</p>
                                      <p className="font-semibold text-gray-900">
                                        ${util?.min?.toLocaleString() || 0} - ${util?.max?.toLocaleString() || 0}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Utility Value</p>
                                      <p className="font-semibold text-gray-900">{utilValue.toFixed(3)}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 rounded-lg font-medium transition-colors"
              >
                ← Previous
              </button>

              {currentPhase === 'results' ? (
                <div className="flex gap-4">
                  <Link
                    href="/demo/dashboard"
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ← Back to Demo
                  </Link>
                  <button
                    onClick={() => {
                      setCurrentPhase('intro')
                      setAllocations({
                        alice: { bob: 100, carol: 0, david: 0, emma: 0 },
                        bob: { alice: 85, carol: 15, david: 0, emma: 0 },
                        carol: { alice: 0, bob: 30, david: 70, emma: 0 },
                        david: { alice: 50, bob: 0, carol: 40, emma: 10 },
                        emma: { alice: 0, bob: 60, carol: 25, david: 15 },
                      })
                      setUtilities({
                        alice: { min: 28000, max: 55000 },
                        bob: { min: 15000, max: 60000 },
                        carol: { min: 4000, max: 22000 },
                        david: { min: 18000, max: 45000 },
                        emma: { min: 25000, max: 40000 },
                      })
                      setEigentrustScores(null)
                      setFinalAllocations(null)
                      setComputing(false)
                      setExpandedApplicant('alice')
                    }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Try Different Allocations
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentIndex === phases.length - 1}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
