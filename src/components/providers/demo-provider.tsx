'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import {
  DemoState,
  generateMockDemoState,
  DemoEndorsement,
  DemoTrustAllocation,
  DemoGrant,
  DemoGrantApplication,
} from '@/lib/demo-data'
import { computeDemoEigentrust, EigentrustResult } from '@/lib/demo-eigentrust'

interface DemoContextType {
  state: DemoState
  eigentrustScores: EigentrustResult | null
  isComputingScores: boolean
  addEndorsement: (endorsement: Omit<DemoEndorsement, 'id' | 'createdAt'>) => void
  updateEndorsement: (id: string, updates: Partial<DemoEndorsement>) => void
  updateTrustAllocation: (id: string, allocation: number) => void
  addGrant: (grant: Omit<DemoGrant, 'id' | 'createdAt' | 'applications'>) => void
  updateGrant: (id: string, updates: Partial<DemoGrant>) => void
  addGrantApplication: (application: Omit<DemoGrantApplication, 'id' | 'createdAt'>) => void
  updateGrantApplication: (id: string, updates: Partial<DemoGrantApplication>) => void
  clearDemoData: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => generateMockDemoState())
  const [eigentrustScores, setEigentrustScores] = useState<EigentrustResult | null>(null)
  const [isComputingScores, setIsComputingScores] = useState(false)

  // Compute EigenTrust scores whenever state changes
  useEffect(() => {
    const computeScores = async () => {
      setIsComputingScores(true)
      try {
        const scores = await computeDemoEigentrust(state)
        setEigentrustScores(scores)
      } catch (error) {
        console.error('Error computing EigenTrust scores:', error)
      } finally {
        setIsComputingScores(false)
      }
    }

    computeScores()
  }, [state])

  const addEndorsement = (endorsement: Omit<DemoEndorsement, 'id' | 'createdAt'>) => {
    const newEndorsement: DemoEndorsement = {
      ...endorsement,
      id: `endorsement-${Date.now()}`,
      createdAt: new Date(),
    }
    setState((prev) => ({
      ...prev,
      endorsements: [...prev.endorsements, newEndorsement],
    }))
  }

  const updateEndorsement = (id: string, updates: Partial<DemoEndorsement>) => {
    setState((prev) => ({
      ...prev,
      endorsements: prev.endorsements.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }))
  }

  const updateTrustAllocation = (id: string, allocation: number) => {
    setState((prev) => ({
      ...prev,
      trustAllocations: prev.trustAllocations.map((t) =>
        t.id === id ? { ...t, allocation } : t
      ),
    }))
  }

  const addGrant = (grant: Omit<DemoGrant, 'id' | 'createdAt' | 'applications'>) => {
    const newGrant: DemoGrant = {
      ...grant,
      id: `grant-${Date.now()}`,
      createdAt: new Date(),
      applications: [],
    }
    setState((prev) => ({
      ...prev,
      grants: [...prev.grants, newGrant],
    }))
  }

  const updateGrant = (id: string, updates: Partial<DemoGrant>) => {
    setState((prev) => ({
      ...prev,
      grants: prev.grants.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }))
  }

  const addGrantApplication = (application: Omit<DemoGrantApplication, 'id' | 'createdAt'>) => {
    const newApplication: DemoGrantApplication = {
      ...application,
      id: `app-${Date.now()}`,
      createdAt: new Date(),
    }
    setState((prev) => ({
      ...prev,
      grantApplications: [...prev.grantApplications, newApplication],
      grants: prev.grants.map((g) =>
        g.id === application.grantId
          ? { ...g, applications: [...g.applications, newApplication] }
          : g
      ),
    }))
  }

  const updateGrantApplication = (id: string, updates: Partial<DemoGrantApplication>) => {
    setState((prev) => ({
      ...prev,
      grantApplications: prev.grantApplications.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
      grants: prev.grants.map((g) => ({
        ...g,
        applications: g.applications.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),
    }))
  }

  const clearDemoData = () => {
    setState(generateMockDemoState())
    setEigentrustScores(null)
  }

  return (
    <DemoContext.Provider
      value={{
        state,
        eigentrustScores,
        isComputingScores,
        addEndorsement,
        updateEndorsement,
        updateTrustAllocation,
        addGrant,
        updateGrant,
        addGrantApplication,
        updateGrantApplication,
        clearDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoContext() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemoContext must be used within DemoProvider')
  }
  return context
}
