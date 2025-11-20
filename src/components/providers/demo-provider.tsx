'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import {
  DemoState,
  generateMockDemoState,
  DemoEndorsement,
  DemoTrustAllocation,
} from '@/lib/demo-data'
import { computeDemoEigentrust, EigentrustResult } from '@/lib/demo-eigentrust'

interface DemoContextType {
  state: DemoState
  eigentrustScores: EigentrustResult | null
  isComputingScores: boolean
  addEndorsement: (endorsement: Omit<DemoEndorsement, 'id' | 'createdAt'>) => void
  updateEndorsement: (id: string, updates: Partial<DemoEndorsement>) => void
  updateTrustAllocation: (id: string, allocation: number) => void
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
