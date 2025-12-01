'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

type TutorialStep = 'intro' | 'create-grant' | 'select-recommenders' | 'allocate-trust' | 'manage-applications' | 'complete'

interface StepContent {
  title: string
  description: string
  action?: string
}

const STEPS: Record<TutorialStep, StepContent> = {
  intro: {
    title: 'Welcome to the Grant Allocation Tutorial',
    description:
      'Learn how to create grants, select trusted recommenders, and manage applications using trust-weighted allocation.',
    action: 'Start Tutorial',
  },
  'create-grant': {
    title: 'Step 1: Create Your First Grant',
    description:
      'Create a new grant by specifying the title, description, and amount. For this demo, we\'ll create a "Tech Innovation Fund" for $250,000.',
    action: 'Create Grant',
  },
  'select-recommenders': {
    title: 'Step 2: Select Trusted Recommenders',
    description:
      'Choose people from your network to recommend grant applications. You can allocate different trust weights to each recommender based on your confidence in their judgment.',
    action: 'Add Recommenders',
  },
  'allocate-trust': {
    title: 'Step 3: Allocate Trust Weights',
    description:
      'Distribute your trust across recommenders. Total allocation must equal 100%. Click "Next" to see a pre-configured allocation.',
    action: 'Configure Allocation',
  },
  'manage-applications': {
    title: 'Step 4: Manage Applications',
    description:
      'Review pending applications. Applications are scored based on recommendations from your trusted recommenders. The system weights recommendations according to your trust allocation.',
    action: 'Review Applications',
  },
  complete: {
    title: 'Tutorial Complete!',
    description:
      'You\'ve learned the key features of grant allocation with trust-weighted recommenders. Go back to the main dashboard to explore more features.',
    action: 'Back to Dashboard',
  },
}

export default function GrantDemoTutorialPage() {
  const router = useRouter()
  useDemoAuth()
  const { state, addGrant, updateGrant, addGrantApplication } = useDemoContext()
  const [currentStep, setCurrentStep] = useState<TutorialStep>('intro')
  const [demoGrantId, setDemoGrantId] = useState<string | null>(null)
  const [showRecommendersForm, setShowRecommendersForm] = useState(false)
  const [showTrustAllocation, setShowTrustAllocation] = useState(false)
  const [selectedRecommenders, setSelectedRecommenders] = useState<string[]>([])

  // Step content components
  const handleStepAction = () => {
    switch (currentStep) {
      case 'intro':
        handleCreateGrant()
        break
      case 'create-grant':
        setShowRecommendersForm(true)
        setCurrentStep('select-recommenders')
        break
      case 'select-recommenders':
        // Pre-select all recommenders
        setSelectedRecommenders(['user-2', 'user-3', 'user-4'])
        setShowTrustAllocation(true)
        setCurrentStep('allocate-trust')
        break
      case 'allocate-trust':
        handleApplicationsStep()
        break
      case 'manage-applications':
        setCurrentStep('complete')
        break
      case 'complete':
        router.push('/demo/dashboard')
        break
    }
  }

  const handleCreateGrant = () => {
    const newGrant = {
      title: 'Tech Innovation Fund',
      description:
        'Supporting innovative projects in technology, AI, and sustainable tech solutions. We believe in backing great ideas from talented teams.',
      amount: 250000,
      status: 'ACTIVE' as const,
      grantmakerUserId: state.currentUser.id,
      grantmakerName: state.currentUser.firstName + ' ' + state.currentUser.lastName,
      recommenders: [],
    }

    addGrant(newGrant)
    // Find the grant we just added (it will be the last one)
    const newGrantId = `grant-${Date.now()}`
    setDemoGrantId(newGrantId)
    setCurrentStep('create-grant')
  }

  const handleApplicationsStep = () => {
    // Pre-populate with sample applications
    const sampleApplications = [
      {
        grantId: demoGrantId || state.grants[state.grants.length - 1].id,
        applicantUserId: 'user-3',
        applicantName: 'Bob Smith',
        applicantEmail: 'bob@example.com',
        status: 'UNDER_REVIEW' as const,
        responses: {
          'project-title': 'Renewable Energy Optimization Platform',
          'project-description':
            'AI-driven platform to optimize renewable energy distribution across smart grids',
          'team-size': '5',
          'timeline': '12 months',
        },
        recommendationCount: 2,
        averageRecommendationScore: 8.7,
      },
      {
        grantId: demoGrantId || state.grants[state.grants.length - 1].id,
        applicantUserId: 'user-4',
        applicantName: 'Carol Williams',
        applicantEmail: 'carol@example.com',
        status: 'PENDING' as const,
        responses: {
          'project-title': 'Privacy-First Data Analytics',
          'project-description': 'Differential privacy framework for secure analytics',
          'team-size': '4',
          'timeline': '9 months',
        },
        recommendationCount: 1,
        averageRecommendationScore: 7.5,
      },
    ]

    sampleApplications.forEach(app => addGrantApplication(app))
    setCurrentStep('manage-applications')
  }

  const handleNext = () => {
    setCurrentStep(currentStep)
    handleStepAction()
  }

  const handleBack = () => {
    if (currentStep === 'intro') return
    const steps: TutorialStep[] = ['intro', 'create-grant', 'select-recommenders', 'allocate-trust', 'manage-applications', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Grant Allocation Tutorial
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Demo</span>
            </h1>
            <p className="text-sm text-gray-500">Step-by-step guide to grant creation and management</p>
          </div>
          <Link
            href="/demo/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Demo
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <div className="flex space-x-1">
                {(['intro', 'create-grant', 'select-recommenders', 'allocate-trust', 'manage-applications', 'complete'] as TutorialStep[]).map(
                  (step) => (
                    <div
                      key={step}
                      className={`h-2 rounded-full transition-all ${
                        step === currentStep
                          ? 'w-8 bg-indigo-600'
                          : ['intro', 'create-grant', 'select-recommenders', 'allocate-trust', 'manage-applications', 'complete'].indexOf(
                              step
                            ) <
                            ['intro', 'create-grant', 'select-recommenders', 'allocate-trust', 'manage-applications', 'complete'].indexOf(
                              currentStep
                            )
                          ? 'w-2 bg-green-600'
                          : 'w-2 bg-gray-300'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {(['intro', 'create-grant', 'select-recommenders', 'allocate-trust', 'manage-applications', 'complete'].indexOf(currentStep) + 1)} of 6
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {currentStep === 'intro' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{STEPS.intro.title}</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">{STEPS.intro.description}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                <p className="text-sm font-semibold text-blue-900">What You'll Learn:</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>How to create grants with specific criteria</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Select and weight trusted recommenders</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Allocate trust percentages that affect recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Review and manage grant applications</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 'create-grant' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{STEPS['create-grant'].title}</h2>
                <p className="text-lg text-gray-600">{STEPS['create-grant'].description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grant Title</label>
                    <div className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-900">
                      Tech Innovation Fund
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <div className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm">
                      Supporting innovative projects in technology, AI, and sustainable tech solutions. We believe in backing great ideas from talented teams.
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grant Amount</label>
                    <div className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-900">
                      $250,000
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ Grant created successfully! This grant is now active and can receive applications.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'select-recommenders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{STEPS['select-recommenders'].title}</h2>
                <p className="text-lg text-gray-600">{STEPS['select-recommenders'].description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-4">Selected Recommenders from Your Network:</p>
                  {['Alice Johnson', 'Bob Smith', 'Carol Williams'].map((name, idx) => (
                    <div key={idx} className="flex items-center p-3 bg-white border border-gray-300 rounded">
                      <input type="checkbox" checked readOnly className="mr-3" />
                      <span className="text-gray-900 font-medium">{name}</span>
                      <span className="ml-auto text-sm text-gray-500">(Clout Score: {720 - idx * 40})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> These recommenders will evaluate applications and their recommendations will be weighted based on your trust allocation.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'allocate-trust' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{STEPS['allocate-trust'].title}</h2>
                <p className="text-lg text-gray-600">{STEPS['allocate-trust'].description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Alice Johnson</label>
                    <span className="text-sm font-bold text-indigo-600">40%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Bob Smith</label>
                    <span className="text-sm font-bold text-indigo-600">35%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Carol Williams</label>
                    <span className="text-sm font-bold text-indigo-600">25%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total Allocation</span>
                    <span className="font-bold text-green-600">100% ✓</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>How it works:</strong> When applications are reviewed, recommendations from recommenders with higher trust weights will have more influence on the final scoring.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'manage-applications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{STEPS['manage-applications'].title}</h2>
                <p className="text-lg text-gray-600">{STEPS['manage-applications'].description}</p>
              </div>

              <div className="space-y-4">
                {/* Application 1 */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">Renewable Energy Optimization Platform</h3>
                      <p className="text-sm text-gray-600 mt-1">Bob Smith • bob@example.com</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                      Under Review
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    AI-driven platform to optimize renewable energy distribution across smart grids
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Team Size:</span>
                      <span className="ml-2 font-medium text-gray-900">5 people</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timeline:</span>
                      <span className="ml-2 font-medium text-gray-900">12 months</span>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Recommendation Score</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-green-600">8.7/10</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Based on 2 weighted recommendations</p>
                  </div>
                </div>

                {/* Application 2 */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">Privacy-First Data Analytics</h3>
                      <p className="text-sm text-gray-600 mt-1">Carol Williams • carol@example.com</p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                      Pending
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    Differential privacy framework for secure analytics on sensitive datasets
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Team Size:</span>
                      <span className="ml-2 font-medium text-gray-900">4 people</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timeline:</span>
                      <span className="ml-2 font-medium text-gray-900">9 months</span>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Recommendation Score</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-yellow-600">7.5/10</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Based on 1 weighted recommendation</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Next steps:</strong> Applications can be approved for funding based on recommendation scores and your own evaluation.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{STEPS.complete.title}</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">{STEPS.complete.description}</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
                <p className="text-sm font-semibold text-green-900">Key Takeaways:</p>
                <ul className="text-sm text-green-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Trust weights determine the influence of each recommender</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Application scores reflect weighted recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>You maintain full control over grant criteria and allocation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Trust allocation can be adjusted to reflect confidence in recommenders</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 'intro'}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-lg font-medium transition-colors"
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            {STEPS[currentStep].action} →
          </button>
        </div>
      </main>
    </div>
  )
}
