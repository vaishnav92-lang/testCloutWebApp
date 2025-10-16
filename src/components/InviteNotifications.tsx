/**
 * INVITE NOTIFICATIONS COMPONENT
 *
 * Displays notifications when people you invited accept and join Clout
 * Shows recent acceptances and new connections
 */

'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface Notification {
  id: string
  type: 'invite_accepted' | 'relationship_confirmed'
  message: string
  user: User
  timestamp: string
  isNew: boolean
}

interface NotificationData {
  notifications: Notification[]
  counts: {
    new: number
    total: number
  }
}

export default function InviteNotifications() {
  const [data, setData] = useState<NotificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/invite-acceptances')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch notifications')
      }

      setData(result)
      setError('')
    } catch (error) {
      console.error('Notifications fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return then.toLocaleDateString()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'invite_accepted':
        return '🎉'
      case 'relationship_confirmed':
        return '🤝'
      default:
        return '📬'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return null // Silently fail for notifications
  }

  if (!data || data.notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={fetchNotifications}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        <p className="text-gray-500 text-sm">
          No recent activity. When people accept your invitations, you'll see updates here!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {data.counts.new > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {data.counts.new} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchNotifications}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? 'Show less' : `Show all (${data.counts.total})`}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {data.notifications
            .slice(0, isExpanded ? 10 : 3)
            .map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  notification.isNew
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 text-2xl">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    {notification.isNew && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {!isExpanded && data.notifications.length > 3 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View {data.notifications.length - 3} more notifications
            </button>
          </div>
        )}
      </div>
    </div>
  )
}