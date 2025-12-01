'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDemoAuth } from '@/hooks/useDemo'

export default function GrantDemoPage() {
  const router = useRouter()
  useDemoAuth()

  useEffect(() => {
    // Redirect to the dual-journey demo
    router.push('/demo/grant-demo/dual-journey')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Loading Grant Allocation Demo...</p>
      </div>
    </div>
  )
}
