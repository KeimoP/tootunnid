'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'
import CodeRotationInitializer from './CodeRotationInitializer'
import ClientOnly from './ClientOnly'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LanguageProvider>
        <CodeRotationInitializer />
        {children}
      </LanguageProvider>
    </ClientOnly>
  )
}
