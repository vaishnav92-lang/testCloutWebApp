'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Small delay to allow localStorage to be available
    setTimeout(() => {
      const token = localStorage.getItem('demoToken')
      if (token) {
        router.replace('/demo/dashboard')
      } else {
        router.replace('/demo/auth/login')
      }
      setIsChecking(false)
    }, 100)
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Clout Careers Demo...</p>
        </div>
      </div>
    )
  }

  return null
}
