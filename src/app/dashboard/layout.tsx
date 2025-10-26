'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Welcome{session.user.firstName ? `, ${session.user.firstName}` : ''}!</h1>
                <div className="flex items-center space-x-3">
                  <button onClick={() => router.push('/onboard')} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100">
                    {session.user.isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
                  </button>
                  {session.user.isAdmin && (
                    <button onClick={() => router.push('/admin')} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700">
                      Admin Dashboard
                    </button>
                  )}
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <Link href="/dashboard"
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      pathname === '/dashboard'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}>
                    Dashboard
                  </Link>
                  <Link href="/jobs"
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      pathname === '/jobs'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}>
                    Jobs on Clout
                  </Link>
                  {session.user.isHiringManager && (
                     <Link href="/dashboard/hiring-manager"
                     className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                       pathname === '/dashboard/hiring-manager'
                         ? 'border-indigo-500 text-indigo-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}>
                     Hiring Manager
                   </Link>
                  )}
                </nav>
              </div>
            </div>
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
