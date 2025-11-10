'use client'

import GrantmakerDashboard from '@/components/GrantmakerDashboard'
import { useSession } from 'next-auth/react'

export default function GrantmakerPage() {
    const { data: session } = useSession()

    if (!session) return null

    return (
        <GrantmakerDashboard
            userInfo={{
                firstName: session.user.firstName || '',
                lastName: session.user.lastName || '',
                email: session.user.email
              }}
        />
    )
}