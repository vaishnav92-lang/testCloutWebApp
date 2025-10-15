/**
 * ADMIN INVITE USERS COMPONENT
 *
 * Allows admins to send invitation emails to new users
 * with the message "You're invited to be a member of Vaishnav's trusted network on Clout"
 */

'use client'

import { useState } from 'react'

interface InviteResult {
  email: string
  status: 'invited' | 'already_exists' | 'error'
  message: string
  inviteUrl?: string
}

export default function AdminInviteUsers() {
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<InviteResult[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setResults([])

    try {
      // Parse emails from textarea
      const emailList = emails
        .split(/[\n,]/)
        .map(email => email.trim())
        .filter(email => email.length > 0)

      if (emailList.length === 0) {
        setError('Please enter at least one email address')
        return
      }

      const response = await fetch('/api/admin/invite-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailList })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations')
      }

      setResults(data.results)
      setSuccess(data.message)

      // Clear emails on success
      const successCount = data.results.filter((r: InviteResult) => r.status === 'invited').length
      if (successCount > 0) {
        setEmails('')
      }

    } catch (error) {
      console.error('Invite error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitations')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited': return 'text-green-700 bg-green-50'
      case 'already_exists': return 'text-yellow-700 bg-yellow-50'
      case 'error': return 'text-red-700 bg-red-50'
      default: return 'text-gray-700 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'invited': return '✅'
      case 'already_exists': return '⚠️'
      case 'error': return '❌'
      default: return '?'
    }
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Invite New Users</h3>
        <p className="text-sm text-gray-600 mt-1">
          Send invitations to join Vaishnav's trusted network on Clout
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
              Email Addresses
            </label>
            <textarea
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="Enter email addresses (one per line or comma-separated)&#10;example@company.com&#10;another@company.com"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can enter multiple emails separated by commas or new lines
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !emails.trim()}
              className={`px-6 py-2 rounded-md font-medium ${
                loading || !emails.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Sending Invitations...' : 'Send Invitations'}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Invitation Results ({results.length} processed)
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getStatusIcon(result.status)}</span>
                      <span className="font-medium text-sm">{result.email}</span>
                    </div>
                    <span className="text-xs font-medium">
                      {result.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-75">{result.message}</p>
                  {result.inviteUrl && (
                    <div className="mt-2">
                      <a
                        href={result.inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View invite link
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-bold text-green-600">
                    {results.filter(r => r.status === 'invited').length}
                  </div>
                  <div className="text-gray-600">Invited</div>
                </div>
                <div>
                  <div className="font-bold text-yellow-600">
                    {results.filter(r => r.status === 'already_exists').length}
                  </div>
                  <div className="text-gray-600">Already Exists</div>
                </div>
                <div>
                  <div className="font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-gray-600">Errors</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Preview */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Email Preview</h4>
          <div className="text-sm text-blue-800">
            <div className="font-medium">Subject:</div>
            <div className="mb-2">You're invited to join Vaishnav's trusted network on Clout</div>
            <div className="font-medium">Message includes:</div>
            <div className="text-xs space-y-1 mt-1">
              <div>• "You're invited to be a member of Vaishnav's trusted network on Clout"</div>
              <div>• Description of Clout as a trust-based professional network</div>
              <div>• Unique invitation link for account creation</div>
              <div>• Professional welcome message</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}