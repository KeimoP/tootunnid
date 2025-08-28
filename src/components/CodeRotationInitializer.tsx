'use client'

import { useEffect } from 'react'

export default function CodeRotationInitializer() {
  useEffect(() => {
    // Initialize code rotation when the app starts
    const initializeCodeRotation = async () => {
      try {
        const response = await fetch('/api/admin/code-rotation', {
          method: 'POST'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Code rotation initialized:', data.message)
        } else {
          console.warn('⚠️ Code rotation initialization failed')
        }
      } catch (error) {
        console.error('❌ Failed to initialize code rotation:', error)
      }
    }

    // Only run on client side and only once
    initializeCodeRotation()
  }, [])

  return null // This component doesn't render anything
}
