'use client'

import { useState, useEffect, useMemo } from 'react'

interface NetworkMember {
  id: string
  relationshipId: string
  name: string
  email: string
  status: 'CONFIRMED' | 'PENDING' | 'INVITED'
  currentAllocation: number
}

interface TrustNetworkManagerProps {
  onRefresh: () => void
}

export default function TrustNetworkManager({ onRefresh }: TrustNetworkManagerProps) {
  const [members, setMembers] = useState<NetworkMember[]>([])
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)

  // Calculate totals (only count explicit allocations to network members)
  const totalAllocatedToNetwork = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0)
  }, [allocations])

  const remainingTrust = 100 - totalAllocatedToNetwork

  // Note: Remaining trust automatically goes to admin in backend, but user sees it as "unallocated"

  // Load network data
  useEffect(() => {
    fetchNetworkData()
  }, [])

  const fetchNetworkData = async () => {
    try {
      setLoading(true)

      // Fetch relationships
      const relResponse = await fetch('/api/user/relationships')
      const relData = await relResponse.json()

      // Fetch current trust allocations from the new API
      const allocResponse = await fetch('/api/trust-allocations')
      const allocData = await allocResponse.json()

      if (relResponse.ok && allocResponse.ok) {
        // Combine confirmed relationships and pending invitations
        const networkMembers: NetworkMember[] = []
        const initialAllocations: Record<string, number> = {}

        // Create a map of user ID to current allocation (convert back to 0-100 scale)
        const currentAllocMap: Record<string, number> = {}
        if (allocData.currentAllocations) {
          allocData.currentAllocations.forEach((alloc: any) => {
            currentAllocMap[alloc.receiverId] = Math.round(alloc.proportion * 100)
          })
        }

        // Process existing relationships
        relData.connections.forEach((conn: any) => {
          const memberId = conn.connectedUser.id
          const currentAllocation = currentAllocMap[memberId] || 0

          networkMembers.push({
            id: memberId,
            relationshipId: conn.id,
            name: conn.connectedUser.name || 'Unknown',
            email: conn.connectedUser.email,
            status: conn.status,
            currentAllocation: currentAllocation
          })
          initialAllocations[memberId] = currentAllocation
        })

        // Process pending invitations
        relData.pendingInvitations?.forEach((inv: any) => {
          const tempId = `pending_${inv.id}`
          networkMembers.push({
            id: tempId,
            relationshipId: inv.id,
            name: 'Pending User',
            email: inv.email,
            status: 'INVITED',
            currentAllocation: 0
          })
          initialAllocations[tempId] = 0
        })

        setMembers(networkMembers)
        setAllocations(initialAllocations)
      }
    } catch (error) {
      console.error('Error fetching network data:', error)
      setMessage('Failed to load network data')
    } finally {
      setLoading(false)
    }
  }

  const handleAllocationChange = (memberId: string, newValue: number) => {
    // Ensure value is between 0 and 100
    const value = Math.max(0, Math.min(100, newValue))

    // Check if this would exceed 100 total
    const otherAllocations = Object.entries(allocations)
      .filter(([id]) => id !== memberId)
      .reduce((sum, [_, val]) => sum + val, 0)

    if (otherAllocations + value > 100) {
      // Adjust to maximum allowed
      const maxAllowed = 100 - otherAllocations
      setAllocations(prev => ({ ...prev, [memberId]: maxAllowed }))
      setMessage(`Maximum allocation for this member is ${maxAllowed} points`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      setAllocations(prev => ({ ...prev, [memberId]: value }))
    }
  }

  const handleRebalance = () => {
    const confirmedMembers = members.filter(m => m.status === 'CONFIRMED')
    if (confirmedMembers.length === 0) return

    // Distribute 100 points equally among CONFIRMED members only
    const perMember = Math.floor(100 / confirmedMembers.length)
    const remainder = 100 % confirmedMembers.length

    const newAllocations: Record<string, number> = { ...allocations }

    // Reset all confirmed members
    confirmedMembers.forEach((member, idx) => {
      newAllocations[member.id] = perMember + (idx < remainder ? 1 : 0)
    })

    // Keep pending/invited members at 0
    members.filter(m => m.status !== 'CONFIRMED').forEach(member => {
      newAllocations[member.id] = 0
    })

    setAllocations(newAllocations)
    setMessage('Trust rebalanced equally across confirmed relationships')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSaveAllocations = async () => {
    setSaving(true)
    setMessage('')

    try {
      // Convert allocations to the new format expected by /api/trust-allocations
      const trustAllocations = members
        .filter(member => member.status === 'CONFIRMED') // Only confirmed members
        .map(member => ({
          receiverId: member.id,
          proportion: (allocations[member.id] || 0) / 100 // Convert from 0-100 to 0-1 scale
        }))
        .filter(alloc => alloc.proportion > 0) // Only include non-zero allocations

      const response = await fetch('/api/trust-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocations: trustAllocations
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save allocations')
      }

      setMessage('Trust allocations saved successfully!')
      setTimeout(() => setMessage(''), 3000)

      // Refresh data
      fetchNetworkData()
      onRefresh()
    } catch (error) {
      console.error('Error saving allocations:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to save allocations')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail) return

    try {
      const defaultAllocation = Math.min(10, remainingTrust)

      const response = await fetch('/api/relationships/establish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail,
          trustAllocation: defaultAllocation
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Member added successfully!')
        setNewMemberEmail('')
        setShowAddMember(false)
        fetchNetworkData()
        onRefresh()
      } else {
        setMessage(data.error || 'Failed to add member')
      }
    } catch (error) {
      setMessage('Failed to add member')
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8 text-gray-500">Loading trust network...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Build Your Inner Circle - Who Shares your Standards, Taste and Judgement? </h2>
            <p className="text-sm text-gray-600 mt-1">
              Allocate your 100 trust points across your network
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{totalAllocatedToNetwork}/100</div>
            <div className="text-sm text-gray-500">Points Allocated to Network</div>
          </div>
        </div>

        {/* Trust Overview Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Trust Distribution</span>
            <span className="text-sm font-medium text-gray-900">
              {remainingTrust} points available
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                totalAllocatedToNetwork === 100 ? 'bg-green-500' :
                totalAllocatedToNetwork > 100 ? 'bg-red-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, totalAllocatedToNetwork)}%` }}
            />
          </div>
          {totalAllocatedToNetwork > 100 && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Over-allocated by {totalAllocatedToNetwork - 100} points. Please adjust.
            </p>
          )}
          {remainingTrust > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              💡 {remainingTrust} points remaining 
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            + Add Member
          </button>
          <button
            onClick={handleRebalance}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            Rebalance Equally
          </button>
          <button
            onClick={handleSaveAllocations}
            disabled={saving || totalAllocatedToNetwork > 100}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddMember && (
        <div className="p-4 bg-indigo-50 border-b border-indigo-200">
          <form onSubmit={handleAddMember} className="flex gap-3">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              Add to Network
            </button>
            <button
              type="button"
              onClick={() => setShowAddMember(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 ${
          message.includes('success') ? 'bg-green-50 text-green-800' :
          message.includes('Failed') || message.includes('Maximum') ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Network Members List */}
      <div className="divide-y divide-gray-200">
        {members.filter(member => member.status !== 'DECLINED').length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No network members yet. Add someone to get started!
          </div>
        ) : (
          members.filter(member => member.status !== 'DECLINED').map((member) => (
            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      member.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      member.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {member.status === 'INVITED' ? 'Invitation Sent' : member.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-6">
                  <div className="w-64">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Trust Points</span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {allocations[member.id] || 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={allocations[member.id] || 0}
                      onChange={(e) => handleAllocationChange(member.id, parseInt(e.target.value))}
                      disabled={member.status !== 'CONFIRMED'}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={allocations[member.id] || 0}
                    onChange={(e) => handleAllocationChange(member.id, parseInt(e.target.value) || 0)}
                    disabled={member.status !== 'CONFIRMED'}
                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              {member.status === 'PENDING' && (
                <p className="text-xs text-amber-600 mt-2 ml-0">
                  ⏳ Pending confirmation - trust will be allocated after they accept
                </p>
              )}
              {member.status === 'INVITED' && (
                <p className="text-xs text-blue-600 mt-2 ml-0">
                  📧 Invitation sent - trust will be allocated after they join and accept
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
