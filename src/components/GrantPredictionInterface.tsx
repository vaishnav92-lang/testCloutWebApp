/**
 * GRANT PREDICTION INTERFACE
 *
 * Interface for making predictions about other applicants
 */

'use client'

import { useState, useEffect } from 'react'

interface Applicant {
  id: string
  firstName?: string
  lastName?: string
  email: string
}

interface Prediction {
  id: string
  predictionText: string
  category?: string
  reinforcementCount: number
  byApplication: {
    applicant: Applicant
  }
}

interface GrantPredictionInterfaceProps {
  grantRoundId: string
  currentUserId: string
  applicants: Array<{
    id: string
    applicant: Applicant
  }>
}

export default function GrantPredictionInterface({
  grantRoundId,
  currentUserId,
  applicants,
}: GrantPredictionInterfaceProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<string>('')
  const [predictionText, setPredictionText] = useState('')
  const [category, setCategory] = useState('planned')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const categories = ['planned', 'follow-through', 'reliability', 'innovation', 'collaboration']

  useEffect(() => {
    fetchPredictions()
  }, [grantRoundId])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/grants/predictions?roundId=${grantRoundId}`)
      if (res.ok) {
        const data = await res.json()
        setPredictions(data)
      }
    } catch (err) {
      console.error('Error fetching predictions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPrediction = async () => {
    if (!selectedApplicant || !predictionText.trim()) {
      setError('Please select an applicant and enter a prediction')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/grants/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantRoundId,
          aboutApplicationId: selectedApplicant,
          predictionText,
          category,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create prediction')
      }

      setSuccess('Prediction added!')
      setPredictionText('')
      setCategory('planned')
      setTimeout(() => setSuccess(''), 3000)

      // Refresh predictions
      fetchPredictions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating prediction')
    } finally {
      setSaving(false)
    }
  }

  const otherApplicants = applicants.filter(
    (app) => app.id !== currentUserId
  )

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Predictions</h3>
        <p className="text-sm text-blue-800">
          Make conditional statements about other applicants using the format: "If [condition], then [prediction]".
          <br />
          Example: "If you ask them to lead a project, then they will deliver it on time"
        </p>
        <p className="text-sm text-blue-800 mt-2">
          Only positive predictions are allowed. Don't predict negative outcomes.
        </p>
      </div>

      {/* Create Prediction Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Make a Prediction</h3>

        <div className="space-y-4">
          {/* Select Applicant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Applicant *
            </label>
            <select
              value={selectedApplicant}
              onChange={(e) => setSelectedApplicant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an applicant...</option>
              {otherApplicants.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.applicant.firstName} {app.applicant.lastName} ({app.applicant.email})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Prediction Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Prediction *
            </label>
            <textarea
              value={predictionText}
              onChange={(e) => setPredictionText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="If [condition], then [prediction]..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Keep it positive and specific. Avoid negative predictions.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitPrediction}
            disabled={saving}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Submitting...' : 'Submit Prediction'}
          </button>
        </div>
      </div>

      {/* Existing Predictions */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Predictions ({predictions.length})
          </h3>

          <div className="space-y-3">
            {predictions.map((pred) => (
              <div
                key={pred.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {pred.byApplication.applicant.firstName}{' '}
                      {pred.byApplication.applicant.lastName}
                    </p>
                    {pred.category && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
                        {pred.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    🤝 {pred.reinforcementCount} reinforcements
                  </span>
                </div>
                <p className="text-sm text-gray-700">{pred.predictionText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && predictions.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No predictions yet</p>
        </div>
      )}
    </div>
  )
}
