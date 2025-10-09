/**
 * EDIT JOB POSTING PAGE
 *
 * This page allows hiring managers to edit existing job postings
 * using the JobPostingQuestionnaire component.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import JobPostingQuestionnaire from '@/components/JobPostingQuestionnaire'

interface EditJobPageProps {
  params: {
    id: string
  }
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is a hiring manager
    if (!session.user?.isHiringManager) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session?.user?.isHiringManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need hiring manager permissions to edit job postings.</p>
        </div>
      </div>
    )
  }

  const handleComplete = (jobId: string) => {
    router.push('/dashboard?view=hiring-manager')
  }

  return (
    <JobPostingQuestionnaire
      jobId={params.id}
      onComplete={handleComplete}
    />
  )
}