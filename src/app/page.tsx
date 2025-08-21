'use client'

import { useEffect } from 'react'

export default function HomePage() {

  useEffect(() => {
    // Check if user is logged in by trying to access profile
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include'
        })
        if (response.ok) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/login'
        }
      } catch (err) {
        console.error('Auth check error:', err)
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}
