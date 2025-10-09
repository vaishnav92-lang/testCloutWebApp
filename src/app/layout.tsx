import type { Metadata } from 'next'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'

export const metadata: Metadata = {
  title: 'Clout Careers',
  description: 'Professional referral network for career opportunities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}