'use client'

import HiringManagerDashboard from '@/components/HiringManagerDashboard'
import { useSession } from 'next-auth/react'

export default function HiringManagerPage() {
    const { data: session } = useSession()

    if (!session) return null

    return (
        <HiringManagerDashboard 
            userInfo={{
                firstName: session.user.firstName || '',
                lastName: session.user.lastName || '',
                email: session.user.email
              }}
              isAdmin={session.user.isAdmin}
        />
    )
}
