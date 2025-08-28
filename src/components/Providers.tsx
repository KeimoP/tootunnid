'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'
import CodeRotationInitializer from './CodeRotationInitializer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CodeRotationInitializer />
      {children}
    </LanguageProvider>
  )
}
