/**
 * GRANT APPLICATION FORM
 *
 * Multi-step form for applying to grants and listing contributions
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GrantTrustAllocatorV2 from '@/components/GrantTrustAllocatorV2'

interface Contribution {
  id?: string
  title: string
  description: string
  url?: string
  yourContribution?: string
  proofOfWork?: string
  isProposal: boolean
}

interface ApplicationForm {
  grantRoundId: string
  utilityFunction?: string
  statement?: string
  contributions: Contribution[]
}

function GrantApplicationContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const grantRoundId = searchParams.get('roundId')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showStructuredSection, setShowStructuredSection] = useState(false)

  const [form, setForm] = useState<ApplicationForm>({
    grantRoundId: grantRoundId || '',
    utilityFunction: '',
    statement: '',
    contributions: [],
  })

  const [newContribution, setNewContribution] = useState<Contribution>({
    title: '',
    description: '',
    isProposal: false,
  })

  useEffect(() => {
    if (!session) {
      router.push('/api/auth/signin')
      return
    }

    if (!grantRoundId) {
      setError('No grant round selected')
      return
    }

    fetchApplication()
  }, [session, grantRoundId])

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/grants/applications?roundId=${grantRoundId}`)
      if (res.ok) {
        const data = await res.json()
        setForm({
          grantRoundId: data.grantRoundId,
          utilityFunction: data.utilityFunction || '',
          contributions: data.contributions || [],
        })
      }
    } catch (err) {
      console.error('Error fetching application:', err)
    } finally {
      setLoading(false)
    }
  }

  const addContribution = () => {
    if (!newContribution.title || !newContribution.description) {
      setError('Title and description are required')
      return
    }

    setForm({
      ...form,
      contributions: [...form.contributions, { ...newContribution, id: Date.now().toString() }],
    })

    setNewContribution({
      title: '',
      description: '',
      isProposal: false,
    })

    setError('')
  }

  const removeContribution = (id: string | undefined) => {
    setForm({
      ...form,
      contributions: form.contributions.filter((c) => c.id !== id),
    })
  }

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED' = 'DRAFT') => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/grants/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save application')
      }

      setSuccess(status === 'SUBMITTED' ? 'Application submitted successfully!' : 'Application saved as draft!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving application')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to apply for grants</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading application...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/grants" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block">
            ← Back to Grants
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Grant Application</h1>
          <p className="text-gray-600 mt-1">Submit your work and allocate trust to other applicants</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            {[
              { num: 1, label: 'Your Work' },
              { num: 2, label: 'Trust Allocation' },
              { num: 3, label: 'Review & Submit' },
            ].map((item, idx) => (
              <div key={item.num} className="flex flex-col items-center flex-1">
                <button
                  onClick={() => setStep(item.num)}
                  className={`w-10 h-10 rounded-full font-medium mb-2 flex items-center justify-center ${
                    item.num <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {item.num}
                </button>
                <span className={`text-sm text-center ${item.num === step ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {/* Progress line */}
          <div className="flex gap-4 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`flex-1 h-1 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Your Application */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tell Us About Your Work</h2>
            <p className="text-gray-600 text-sm mb-6">
              Share your vision, what you've accomplished, and what you plan to do. You can include links and details, or keep it free-form.
            </p>

            {/* Primary: Free-text Statement */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Application Statement
              </label>
              <textarea
                value={form.statement || ''}
                onChange={(e) => setForm({ ...form, statement: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-sans"
                placeholder={`Share your work and vision. For example:

What have you been working on?
What are you proud of accomplishing?
What's your next big project?
How does this grant help you achieve your goals?

Feel free to include links to your work, past projects, or evidence of your capabilities.`}
              />
              <p className="text-xs text-gray-500 mt-2">
                {(form.statement || '').length} characters
              </p>
            </div>

            {/* Secondary: Structured Contributions (Collapsible) */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowStructuredSection(!showStructuredSection)}
                className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                <span className={`transition-transform ${showStructuredSection ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                Add Structured Contributions (Optional)
              </button>

              {showStructuredSection && (
                <div className="mt-6 space-y-6">
                  {/* Existing Contributions */}
                  {form.contributions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Your Contributions</h3>
                      <div className="space-y-3">
                        {form.contributions.map((contrib) => (
                          <div
                            key={contrib.id}
                            className="p-4 border border-gray-200 rounded-lg flex justify-between items-start bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{contrib.title}</h4>
                                {contrib.isProposal && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    Proposal
                                  </span>
                                )}
                                {!contrib.isProposal && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Past Work
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{contrib.description}</p>
                              {contrib.url && (
                                <a
                                  href={contrib.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                                >
                                  View →
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => removeContribution(contrib.id)}
                              className="text-red-600 hover:text-red-700 font-medium text-sm ml-4"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Contribution */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Add a Structured Item</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newContribution.title}
                          onChange={(e) =>
                            setNewContribution({ ...newContribution, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Research Paper on Climate Policy"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={newContribution.description}
                          onChange={(e) =>
                            setNewContribution({ ...newContribution, description: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="What you did and why it matters"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL (optional)
                        </label>
                        <input
                          type="url"
                          value={newContribution.url || ''}
                          onChange={(e) =>
                            setNewContribution({ ...newContribution, url: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com"
                        />
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newContribution.isProposal}
                          onChange={(e) =>
                            setNewContribution({
                              ...newContribution,
                              isProposal: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          This is a future proposal (requires proof of capability)
                        </span>
                      </label>

                      {newContribution.isProposal && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proof of Capability Link
                          </label>
                          <input
                            type="url"
                            value={newContribution.proofOfWork || ''}
                            onChange={(e) =>
                              setNewContribution({
                                ...newContribution,
                                proofOfWork: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Link showing you can do this"
                          />
                        </div>
                      )}

                      <button
                        onClick={addContribution}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Link
                href="/grants"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={() => setStep(2)}
                disabled={!form.statement || form.statement.trim().length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Trust Allocation
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Trust Allocation */}
        {step === 2 && (
          <div>
            <GrantTrustAllocatorV2
              grantRoundId={grantRoundId || ''}
              applicants={[]}
            />

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Submit</h2>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Contributions ({form.contributions.length})</h3>
              <div className="space-y-2">
                {form.contributions.map((contrib) => (
                  <div key={contrib.id} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                    {contrib.title}
                    {contrib.isProposal && <span className="ml-2 text-xs text-yellow-600">(proposal)</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <p className="text-sm text-green-900">
                ✓ You're ready to submit! Your application will enter the review phase.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => handleSave('DRAFT')}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSave('SUBMITTED')}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GrantApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <GrantApplicationContent />
    </Suspense>
  )
}
