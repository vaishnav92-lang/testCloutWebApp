'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-8">
            Welcome back to Clout Careers
          </h1>
          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to Clout Careers
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Professional referral network for career opportunities
        </p>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center px-6 py-3 border-2 border-indigo-600 text-base font-medium rounded-md text-indigo-600 hover:bg-indigo-50"
            >
              Try Demo
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            Join by invitation only. Ask a current member for a referral link.
            <br />
            <span className="text-indigo-600 font-medium">✨ New: Try the demo version with sample data</span>
          </p>
        </div>
      </div>
    </main>
  )
}