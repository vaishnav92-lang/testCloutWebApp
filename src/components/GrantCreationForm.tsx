'use client'

import { useState } from 'react'

interface Recommender {
  id: string
  email: string
  trustWeight: number
}

interface GrantCreationFormProps {
  onComplete: (grantId: string) => void
}

export default function GrantCreationForm({ onComplete }: GrantCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: ''
  })

  const [recommenders, setRecommenders] = useState<Recommender[]>([])
  const [newRecommenderEmail, setNewRecommenderEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addRecommender = () => {
    if (!newRecommenderEmail.trim()) {
      setErrors({ ...errors, recommender: 'Please enter an email address' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newRecommenderEmail)) {
      setErrors({ ...errors, recommender: 'Please enter a valid email address' })
      return
    }

    if (recommenders.some(r => r.email === newRecommenderEmail)) {
      setErrors({ ...errors, recommender: 'This email is already added as a recommender' })
      return
    }

    const newRecommender: Recommender = {
      id: Date.now().toString(),
      email: newRecommenderEmail.trim(),
      trustWeight: 20 // Default trust weight
    }

    setRecommenders([...recommenders, newRecommender])
    setNewRecommenderEmail('')
    setErrors({ ...errors, recommender: '' })
  }

  const removeRecommender = (id: string) => {
    setRecommenders(recommenders.filter(r => r.id !== id))
  }

  const updateTrustWeight = (id: string, weight: number) => {
    setRecommenders(recommenders.map(r =>
      r.id === id ? { ...r, trustWeight: weight } : r
    ))
  }

  const totalTrustWeight = recommenders.reduce((sum, r) => sum + r.trustWeight, 0)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Grant title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Grant description is required'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Grant amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Grant amount must be a positive number'
      }
    }

    if (recommenders.length === 0) {
      newErrors.recommenders = 'At least one recommender is required'
    }

    if (totalTrustWeight !== 100) {
      newErrors.trustWeights = `Total trust allocation must equal 100% (currently ${totalTrustWeight}%)`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/grantmaker/grants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          recommenders: recommenders.map(r => ({
            email: r.email,
            trustWeight: r.trustWeight
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        onComplete(data.grant.id)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create grant')
      }
    } catch (error) {
      console.error('Error creating grant:', error)
      alert('Failed to create grant. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Grant</h1>
        <p className="text-xl text-gray-600">Set up your grant details and select trusted recommenders</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Grant Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Grant Details</h2>

          <div className="space-y-6">
            {/* Grant Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Grant Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter grant title..."
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Grant Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Grant Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="50000"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            </div>

            {/* Grant Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Grant Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Describe the purpose and goals of this grant..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* Recommender Selection */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trusted Recommenders</h2>
          <p className="text-sm text-gray-600 mb-6">
            Add people you trust to recommend candidates for this grant. Allocate trust weights that total 100%.
          </p>

          {/* Add Recommender */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={newRecommenderEmail}
                  onChange={(e) => setNewRecommenderEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recommender's email address..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addRecommender()
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={addRecommender}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {errors.recommender && <p className="mt-1 text-sm text-red-600">{errors.recommender}</p>}
          </div>

          {/* Recommender List */}
          {recommenders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Recommenders ({recommenders.length})
                <span className={`ml-2 text-sm ${totalTrustWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Total Trust: {totalTrustWeight}%
                </span>
              </h3>

              <div className="space-y-3">
                {recommenders.map((recommender) => (
                  <div key={recommender.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{recommender.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecommender(recommender.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trust Weight: {recommender.trustWeight}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={recommender.trustWeight}
                        onChange={(e) => updateTrustWeight(recommender.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.recommenders && <p className="mt-2 text-sm text-red-600">{errors.recommenders}</p>}
          {errors.trustWeights && <p className="mt-2 text-sm text-red-600">{errors.trustWeights}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || totalTrustWeight !== 100 || recommenders.length === 0}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Grant...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Grant
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-amber-50 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>💡 Trust Allocation:</strong> The trust weights determine how much influence each recommender has in the selection process. Higher trust means their recommendations carry more weight. All trust weights must add up to exactly 100%.
        </p>
      </div>
    </div>
  )
}