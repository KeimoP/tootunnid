'use client'

import { useEffect } from 'react'

export default function CodeRotationInitializer() {
  useEffect(() => {
    // Initialize code rotation when the app starts
    const initializeCodeRotation = async () => {
      try {
        // Only run if we're in the browser and have a valid window object
        if (typeof window === 'undefined') return;
        
        const response = await fetch('/api/admin/code-rotation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Code rotation initialized:', data.message)
        } else {
          console.warn('⚠️ Code rotation initialization failed:', response.status)
        }
      } catch (error) {
        // Silently handle errors to prevent app crashes
        console.error('❌ Failed to initialize code rotation:', error)
      }
    }

    // Add a small delay to ensure the app has fully loaded
    const timer = setTimeout(() => {
      initializeCodeRotation()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null // This component doesn't render anything
}
