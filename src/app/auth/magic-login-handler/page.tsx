'use client'

import { useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

function MagicLoginHandlerContent() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    const handleMagicLogin = async () => {
      // Get the email from cookie
      const email = document.cookie
        .split('; ')
        .find(row => row.startsWith('magic-login-email='))
        ?.split('=')[1]

      if (email) {
        // Clear the email cookie
        document.cookie = 'magic-login-email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        // Sign in with credentials provider using magic link token
        const result = await signIn('credentials', {
          email: decodeURIComponent(email),
          token: 'MAGIC_LINK_AUTO_LOGIN',
          redirect: false
        })

        if (result?.ok) {
          window.location.href = redirect
        } else {
          // Fallback to email provider
          await signIn('email', {
            email: decodeURIComponent(email),
            redirect: false
          })
          // Check for the verification page redirect
          setTimeout(() => {
            window.location.href = redirect
          }, 1000)
        }
      } else {
        // No email cookie found, redirect to signin
        window.location.href = '/auth/signin?error=MagicLinkFailed'
      }
    }

    handleMagicLogin()
  }, [redirect])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Logging you in...</p>
      </div>
    </div>
  )
}

export default function MagicLoginHandler() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MagicLoginHandlerContent />
    </Suspense>
  )
}