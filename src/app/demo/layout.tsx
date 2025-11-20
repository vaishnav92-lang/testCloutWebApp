'use client'

import { DemoProvider } from '@/components/providers/demo-provider'

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DemoProvider>
      {children}
    </DemoProvider>
  )
}
