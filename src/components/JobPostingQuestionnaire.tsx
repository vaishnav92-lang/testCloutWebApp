/**
 * JOB POSTING QUESTIONNAIRE COMPONENT
 *
 * This component guides hiring managers through a comprehensive questionnaire
 * to create job postings that surface "illegible talent" through guided questions.
 *
 * Features:
 * - 7 sections plus introduction and review
 * - Auto-save drafts every 30 seconds
 * - Progress indicator
 * - Mobile-friendly design
 * - Conversational tone with examples
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type LocationType = 'REMOTE' | 'HYBRID' | 'IN_PERSON'
type ReferralPreference = 'MANUAL_SCREEN' | 'AUTO_EMAIL' | 'CONFIDENCE_BASED'

interface JobFormData {
  // Section 1: The Basics
  title: string
  locationType: LocationType
  locationCity: string
  salaryMin: number | ''
  salaryMax: number | ''
  currency: string
  equityOffered: boolean
  equityRange: string
  dayToDayDescription: string

  // Section 2: What You're Really Looking For
  archetypes: string
  nonWorkSignals: string
  flexibleRequirements: string[]
  flexibleReasons: Record<string, string>

  // Section 3: Red Flags & Mismatches
  commonMismatches: string
  roleChallenges: string

  // Section 4: How You Work
  workingStyle: string
  excitingWork: string

  // Section 5: The Upside
  specialOpportunity: string
  growthPath: string

  // Section 6: Must-Haves
  mustHaves: string

  // Section 7: Referral Budget
  referralBudget: number | ''
  referralPreference: ReferralPreference
}

const initialFormData: JobFormData = {
  title: '',
  locationType: 'REMOTE',
  locationCity: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  equityOffered: false,
  equityRange: '',
  dayToDayDescription: '',
  archetypes: '',
  nonWorkSignals: '',
  flexibleRequirements: [],
  flexibleReasons: {},
  commonMismatches: '',
  roleChallenges: '',
  workingStyle: '',
  excitingWork: '',
  specialOpportunity: '',
  growthPath: '',
  mustHaves: '',
  referralBudget: '',
  referralPreference: 'MANUAL_SCREEN'
}

interface JobPostingQuestionnaireProps {
  jobId?: string // For editing existing jobs
  onComplete?: (jobId: string) => void
}

export default function JobPostingQuestionnaire({ jobId, onComplete }: JobPostingQuestionnaireProps) {
  const [currentSection, setCurrentSection] = useState(0) // 0 = intro, 1-7 = sections, 8 = review
  const [formData, setFormData] = useState<JobFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoadingJob, setIsLoadingJob] = useState(!!jobId) // Loading existing job data
  const router = useRouter()

  // Load existing job data when editing
  useEffect(() => {
    if (jobId) {
      const loadJobData = async () => {
        try {
          const response = await fetch(`/api/hiring-manager/jobs/${jobId}`)
          if (response.ok) {
            const data = await response.json()
            const job = data.job

            // Map job data to form data structure
            setFormData({
              title: job.title || '',
              locationType: job.locationType || 'REMOTE',
              locationCity: job.locationCity || '',
              salaryMin: job.salaryMin || '',
              salaryMax: job.salaryMax || '',
              currency: job.currency || 'USD',
              equityOffered: job.equityOffered || false,
              equityRange: job.equityRange || '',
              dayToDayDescription: job.dayToDayDescription || '',
              archetypes: job.archetypes || '',
              nonWorkSignals: job.nonWorkSignals || '',
              flexibleRequirements: job.flexibleRequirements || [],
              flexibleReasons: job.flexibleReasons || {},
              commonMismatches: job.commonMismatches || '',
              roleChallenges: job.roleChallenges || '',
              workingStyle: job.workingStyle || '',
              excitingWork: job.excitingWork || '',
              specialOpportunity: job.specialOpportunity || '',
              growthPath: job.growthPath || '',
              mustHaves: job.mustHaves || '',
              referralBudget: job.referralBudget || '',
              referralPreference: job.referralPreference || 'MANUAL_SCREEN'
            })
          }
        } catch (error) {
          console.error('Error loading job data:', error)
        } finally {
          setIsLoadingJob(false)
        }
      }

      loadJobData()
    }
  }, [jobId])

  const sections = [
    'Introduction',
    'The Basics',
    'What You\'re Really Looking For',
    'Red Flags & Mismatches',
    'How You Work',
    'The Upside',
    'Must-Haves',
    'Referral Budget',
    'Review & Publish'
  ]

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (currentSection === 0) return // Don't save on intro screen

    setSaving(true)
    try {
      const response = await fetch(`/api/hiring-manager/jobs${jobId ? `/${jobId}` : ''}`, {
        method: jobId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'DRAFT'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (!jobId && data.jobId) {
          // New job created, update URL
          window.history.replaceState(null, '', `/hiring-manager/job/${data.jobId}/edit`)
        }
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setSaving(false)
    }
  }, [formData, jobId, currentSection])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  const updateFormData = (updates: Partial<JobFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  const goToSection = (sectionIndex: number) => {
    setCurrentSection(sectionIndex)
  }

  // Introduction Screen
  const renderIntroduction = () => (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">
        Let's create a job posting that finds hidden gems
      </h1>

      <p className="text-xl text-gray-600">
        We'll help you articulate what you're really looking for - beyond just skills and years of experience.
      </p>

      <p className="text-gray-500">
        This takes about 10-15 minutes. You can save and come back anytime.
      </p>

      <button
        onClick={nextSection}
        className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        Get Started
        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  )

  // Section 1: The Basics
  const renderBasics = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">The Basics</h2>
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's the job title? *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Senior Product Manager"
        />
        <p className="text-xs text-gray-500 mt-1">
          Keep it simple and searchable (e.g., 'Senior Product Manager' not 'Growth Ninja')
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Where is this role located? *
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="locationType"
              value="REMOTE"
              checked={formData.locationType === 'REMOTE'}
              onChange={(e) => updateFormData({ locationType: e.target.value as LocationType })}
              className="mr-2"
            />
            Remote
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="locationType"
              value="HYBRID"
              checked={formData.locationType === 'HYBRID'}
              onChange={(e) => updateFormData({ locationType: e.target.value as LocationType })}
              className="mr-2"
            />
            Hybrid (specify city)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="locationType"
              value="IN_PERSON"
              checked={formData.locationType === 'IN_PERSON'}
              onChange={(e) => updateFormData({ locationType: e.target.value as LocationType })}
              className="mr-2"
            />
            In-person (specify city)
          </label>
        </div>

        {(formData.locationType === 'HYBRID' || formData.locationType === 'IN_PERSON') && (
          <div className="mt-3">
            <input
              type="text"
              value={formData.locationCity}
              onChange={(e) => updateFormData({ locationCity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="City name"
            />
          </div>
        )}
      </div>

      {/* Compensation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's the compensation range?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min Salary</label>
            <input
              type="number"
              value={formData.salaryMin}
              onChange={(e) => updateFormData({ salaryMin: e.target.value ? parseInt(e.target.value) : '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Salary</label>
            <input
              type="number"
              value={formData.salaryMax}
              onChange={(e) => updateFormData({ salaryMax: e.target.value ? parseInt(e.target.value) : '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="80000"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => updateFormData({ currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.equityOffered}
              onChange={(e) => updateFormData({ equityOffered: e.target.checked })}
              className="mr-2"
            />
            Also offering equity/stock options
          </label>

          {formData.equityOffered && (
            <div className="mt-3">
              <input
                type="text"
                value={formData.equityRange}
                onChange={(e) => updateFormData({ equityRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 0.1% - 0.5%"
              />
            </div>
          )}
        </div>
      </div>

      {/* Day-to-day Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          In 2-3 sentences, what does this person actually do day-to-day? *
        </label>
        <textarea
          required
          rows={4}
          value={formData.dayToDayDescription}
          onChange={(e) => updateFormData({ dayToDayDescription: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Focus on the work, not buzzwords. What will fill their calendar?"
          maxLength={400}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Focus on the work, not buzzwords. What will fill their calendar?</span>
          <span>{formData.dayToDayDescription.length}/400</span>
        </div>
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Example:</strong> "This person will build our front-end in React/TypeScript, with occasional back-end work in Node. We're a small team - they'll own features end-to-end, from conception to deployment."
          </p>
        </div>
      </div>
    </div>
  )

  // Progress indicator
  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          {currentSection === 0 ? 'Getting Started' : `Section ${currentSection} of 7`}
        </span>
        <span className="text-sm text-gray-500">
          {sections[currentSection]}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentSection) / (sections.length - 1)) * 100}%`
          }}
        />
      </div>
      {saving && (
        <div className="text-xs text-gray-500 mt-1">Saving...</div>
      )}
      {lastSaved && !saving && (
        <div className="text-xs text-gray-500 mt-1">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  )

  // Navigation buttons
  const renderNavigation = () => (
    <div className="flex justify-between mt-8">
      <button
        onClick={prevSection}
        disabled={currentSection === 0}
        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <div className="flex space-x-3">
        <button
          onClick={autoSave}
          disabled={saving || currentSection === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>

        <button
          onClick={nextSection}
          disabled={currentSection === sections.length - 1}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentSection === sections.length - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </div>
  )

  // Section 2: What You're Really Looking For
  const renderLookingFor = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What You're Really Looking For</h2>
        <p className="text-gray-600">Beyond the resume - who would actually thrive here?</p>
      </div>

      {/* Archetypes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe 2-3 archetypes of people who would excel in this role *
        </label>
        <textarea
          required
          rows={6}
          value={formData.archetypes}
          onChange={(e) => updateFormData({ archetypes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Think about actual people you've worked with or hired before. What patterns do you see?"
          maxLength={1000}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Think about actual people you've worked with or hired before. What patterns do you see?</span>
          <span>{formData.archetypes.length}/1000</span>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">Examples:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• "A startup engineer who's seen what doesn't work and wants to join something with better traction"</p>
            <p>• "Former consultant who's tired of PowerPoint and wants to build real products"</p>
            <p>• "Big tech engineer who builds more interesting things on weekends than at their day job"</p>
          </div>
        </div>
      </div>

      {/* Non-work signals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What non-work experiences or choices signal someone would be a great fit?
        </label>
        <textarea
          rows={4}
          value={formData.nonWorkSignals}
          onChange={(e) => updateFormData({ nonWorkSignals: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="What have your best people done outside work that shows relevant traits?"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>What have your best people done outside work that shows relevant traits?</span>
          <span>{formData.nonWorkSignals.length}/500</span>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">Examples:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• "Moved to a new country to get a fresh perspective"</p>
            <p>• "Gone 'off the rails' to pursue a deep passion (quit a job to hike the PCT)"</p>
            <p>• "Built side projects for fun, not for resume padding"</p>
          </div>
        </div>
      </div>

      {/* Flexible requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What conventional requirement are you willing to be flexible on?
        </label>
        <div className="space-y-3">
          {[
            'Years of experience',
            'Specific technologies/tools',
            'Educational background',
            'Industry experience',
            'Previous company prestige',
            'Other'
          ].map((requirement) => (
            <div key={requirement}>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.flexibleRequirements.includes(requirement)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...formData.flexibleRequirements, requirement]
                      : formData.flexibleRequirements.filter(r => r !== requirement)
                    updateFormData({ flexibleRequirements: updated })
                  }}
                  className="mr-2"
                />
                {requirement}
              </label>
              {formData.flexibleRequirements.includes(requirement) && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    value={formData.flexibleReasons[requirement] || ''}
                    onChange={(e) => updateFormData({
                      flexibleReasons: {
                        ...formData.flexibleReasons,
                        [requirement]: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Why are you flexible here?"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Section 3: Red Flags & Mismatches
  const renderRedFlags = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Red Flags & Mismatches</h2>
        <p className="text-gray-600">Who would struggle here? (This helps us filter better)</p>
      </div>

      {/* Poor fit description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe someone who looks impressive on paper but would actually be a poor fit *
        </label>
        <textarea
          required
          rows={4}
          value={formData.commonMismatches}
          onChange={(e) => updateFormData({ commonMismatches: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Be specific about why they'd struggle, not just what they lack"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Be specific about why they'd struggle, not just what they lack</span>
          <span>{formData.commonMismatches.length}/500</span>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Example:</strong> "A FAANG developer with excellent technical skills but no experience working in scrappy teams or with independent projects"
          </p>
        </div>
      </div>

      {/* Role challenges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What do people underestimate about this role that causes frustration?
        </label>
        <textarea
          rows={4}
          value={formData.roleChallenges}
          onChange={(e) => updateFormData({ roleChallenges: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="What reality check do candidates need?"
          maxLength={400}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>What reality check do candidates need?</span>
          <span>{formData.roleChallenges.length}/400</span>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">Examples:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• "We have almost no process - if you need clear direction, you'll be frustrated"</p>
            <p>• "You'll wear many hats - pure specialists don't thrive here"</p>
            <p>• "High autonomy means high ambiguity"</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Section 4: How You Work
  const renderHowYouWork = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How You Work</h2>
        <p className="text-gray-600">What's it actually like to work here?</p>
      </div>

      {/* Working style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you describe your team's working style? *
        </label>
        <textarea
          required
          rows={4}
          value={formData.workingStyle}
          onChange={(e) => updateFormData({ workingStyle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="What would surprise someone coming from a big company or traditional startup?"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>What would surprise someone coming from a big company or traditional startup?</span>
          <span>{formData.workingStyle.length}/500</span>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Example:</strong> "Extremely limited process. We only have one weekly recurring meeting. We don't let box ticking get in the way of writing code."
          </p>
        </div>
      </div>

      {/* Exciting work */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What kind of problems or projects get you excited?
        </label>
        <textarea
          rows={4}
          value={formData.excitingWork}
          onChange={(e) => updateFormData({ excitingWork: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="This helps candidates understand if they'd find the work energizing"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>This helps candidates understand if they'd find the work energizing</span>
          <span>{formData.excitingWork.length}/500</span>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Example:</strong> "90s-style startup scope – we ship ambitious, large-scale products instead of optimizing the conversion rates of sub-sub-features"
          </p>
        </div>
      </div>
    </div>
  )

  // Section 5: The Upside
  const renderUpside = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">The Upside</h2>
        <p className="text-gray-600">Why should someone join beyond just the salary?</p>
      </div>

      {/* Special opportunity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's the special opportunity here that someone can't get elsewhere? *
        </label>
        <textarea
          required
          rows={4}
          value={formData.specialOpportunity}
          onChange={(e) => updateFormData({ specialOpportunity: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="What makes this role uniquely compelling?"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>What makes this role uniquely compelling?</span>
          <span>{formData.specialOpportunity.length}/500</span>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">Examples:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• "Build in public with a highly engaged community watching your work"</p>
            <p>• "Shape the product direction of something millions of people will use"</p>
            <p>• "Work with bleeding-edge technology before it becomes mainstream"</p>
          </div>
        </div>
      </div>

      {/* Growth path */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's the growth path for this role?
        </label>
        <textarea
          rows={4}
          value={formData.growthPath}
          onChange={(e) => updateFormData({ growthPath: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Where could this role lead? What skills will they develop?"
          maxLength={400}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Where could this role lead? What skills will they develop?</span>
          <span>{formData.growthPath.length}/400</span>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Example:</strong> "This role naturally evolves into leading a small team while remaining hands-on. You'll gain experience in architecture decisions that affect millions of users."
          </p>
        </div>
      </div>
    </div>
  )

  // Section 6: Must-Haves
  const renderMustHaves = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Must-Haves</h2>
        <p className="text-gray-600">What are the actual non-negotiables? (Keep this short)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          List the 3-5 things that are truly non-negotiable *
        </label>
        <textarea
          required
          rows={6}
          value={formData.mustHaves}
          onChange={(e) => updateFormData({ mustHaves: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Focus on what someone actually needs to be successful, not wish-list items"
          maxLength={400}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Focus on what someone actually needs to be successful, not wish-list items</span>
          <span>{formData.mustHaves.length}/400</span>
        </div>
        <div className="mt-3 space-y-3">
          <div className="p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-800">
              <strong>Good examples:</strong> "Can work effectively with minimal direction" or "Comfortable with ambiguous technical requirements"
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Avoid:</strong> Long lists of technologies, years of experience, or degree requirements (unless truly necessary)
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Section 7: Referral Budget
  const renderReferralBudget = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Referral Budget</h2>
        <p className="text-gray-600">How much are you willing to pay for successful referrals?</p>
      </div>

      {/* Referral budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Referral budget (total amount paid for successful hire) *
        </label>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                required
                value={formData.referralBudget}
                onChange={(e) => updateFormData({ referralBudget: e.target.value ? parseInt(e.target.value) : '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5000"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Amount in {formData.currency}</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Typical ranges:</strong> $2,000-$5,000 for mid-level roles, $5,000-$15,000 for senior roles
            </p>
          </div>
        </div>
      </div>

      {/* Referral preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How do you want to handle referrals? *
        </label>
        <div className="space-y-3">
          <label className="flex items-start">
            <input
              type="radio"
              name="referralPreference"
              value="MANUAL_SCREEN"
              checked={formData.referralPreference === 'MANUAL_SCREEN'}
              onChange={(e) => updateFormData({ referralPreference: e.target.value as ReferralPreference })}
              className="mr-3 mt-1"
            />
            <div>
              <div className="font-medium">Manual screening (Recommended)</div>
              <div className="text-sm text-gray-600">We'll send you referral details before reaching out to candidates</div>
            </div>
          </label>
          <label className="flex items-start">
            <input
              type="radio"
              name="referralPreference"
              value="AUTO_EMAIL"
              checked={formData.referralPreference === 'AUTO_EMAIL'}
              onChange={(e) => updateFormData({ referralPreference: e.target.value as ReferralPreference })}
              className="mr-3 mt-1"
            />
            <div>
              <div className="font-medium">Auto-email qualified referrals</div>
              <div className="text-sm text-gray-600">We'll automatically email candidates who match your criteria</div>
            </div>
          </label>
          <label className="flex items-start">
            <input
              type="radio"
              name="referralPreference"
              value="CONFIDENCE_BASED"
              checked={formData.referralPreference === 'CONFIDENCE_BASED'}
              onChange={(e) => updateFormData({ referralPreference: e.target.value as ReferralPreference })}
              className="mr-3 mt-1"
            />
            <div>
              <div className="font-medium">Confidence-based</div>
              <div className="text-sm text-gray-600">High-confidence referrals auto-email, others require approval</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )

  // Review & Publish Section
  const renderReview = () => {
    const handlePublish = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/hiring-manager/jobs${jobId ? `/${jobId}` : ''}`, {
          method: jobId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            status: 'ACTIVE',
            publishedAt: new Date().toISOString()
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (onComplete) {
            onComplete(data.jobId || jobId!)
          } else {
            router.push('/dashboard?view=hiring-manager')
          }
        }
      } catch (error) {
        console.error('Publish error:', error)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Publish</h2>
          <p className="text-gray-600">Almost there! Review your job posting before publishing.</p>
        </div>

        {/* Job Summary */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{formData.title || 'Job Title'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Location:</span>{' '}
                {formData.locationType === 'REMOTE' ? 'Remote' :
                 formData.locationType === 'HYBRID' ? `Hybrid (${formData.locationCity})` :
                 formData.locationCity || 'In-person'}
              </div>
              {(formData.salaryMin || formData.salaryMax) && (
                <div>
                  <span className="font-medium text-gray-700">Salary:</span>{' '}
                  {formData.salaryMin && formData.salaryMax
                    ? `${formData.currency} ${formData.salaryMin.toLocaleString()} - ${formData.salaryMax.toLocaleString()}`
                    : formData.salaryMin
                      ? `${formData.currency} ${formData.salaryMin.toLocaleString()}+`
                      : formData.salaryMax
                        ? `Up to ${formData.currency} ${formData.salaryMax.toLocaleString()}`
                        : 'Competitive'
                  }
                </div>
              )}
              {formData.referralBudget && (
                <div>
                  <span className="font-medium text-gray-700">Referral Budget:</span>{' '}
                  {formData.currency} {formData.referralBudget.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {formData.dayToDayDescription && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Day-to-day work:</h4>
              <p className="text-gray-700 text-sm">{formData.dayToDayDescription}</p>
            </div>
          )}

          {formData.archetypes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Who would excel:</h4>
              <p className="text-gray-700 text-sm">{formData.archetypes}</p>
            </div>
          )}

          {formData.specialOpportunity && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Special opportunity:</h4>
              <p className="text-gray-700 text-sm">{formData.specialOpportunity}</p>
            </div>
          )}
        </div>

        {/* Publish Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentSection(7)}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Edit
          </button>
          <button
            onClick={autoSave}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>

        <div className="p-4 bg-green-50 rounded-md">
          <p className="text-sm text-green-800">
            <strong>What happens next:</strong> Once published, your job will be visible to our network.
            Qualified referrers will start submitting candidates based on your preferences.
          </p>
        </div>
      </div>
    )
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return renderIntroduction()
      case 1:
        return renderBasics()
      case 2:
        return renderLookingFor()
      case 3:
        return renderRedFlags()
      case 4:
        return renderHowYouWork()
      case 5:
        return renderUpside()
      case 6:
        return renderMustHaves()
      case 7:
        return renderReferralBudget()
      case 8:
        return renderReview()
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Section {currentSection}: {sections[currentSection]}
            </h2>
            <p className="text-gray-600">This section is coming soon...</p>
          </div>
        )
    }
  }

  // Show loading screen while fetching existing job data
  if (isLoadingJob) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading job data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {currentSection > 0 && renderProgressIndicator()}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderCurrentSection()}

          {currentSection > 0 && renderNavigation()}
        </div>

        {/* Section Navigation */}
        {currentSection > 0 && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Jump to Section:</h3>
            <div className="flex flex-wrap gap-2">
              {sections.slice(1, -1).map((section, index) => (
                <button
                  key={index + 1}
                  onClick={() => goToSection(index + 1)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    currentSection === index + 1
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}. {section}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}