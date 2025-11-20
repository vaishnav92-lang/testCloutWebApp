import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook to protect demo pages
 * Redirects to login if demo token not found
 */
export function useDemoAuth() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('demoToken')
    if (!token) {
      router.replace('/demo/auth/login')
    }
  }, [router])
}
