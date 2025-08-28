'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function DiagnosticPage() {
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(`[DIAGNOSTIC] ${message}`)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const runDiagnostic = async () => {
      try {
        addLog('Starting diagnostic...')
        
        // Test 1: Basic API connectivity
        addLog('Testing basic API connectivity...')
        const healthResponse = await fetch('/api/health', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (healthResponse.ok) {
          addLog('✅ API connectivity works')
        } else {
          addLog(`❌ API connectivity failed: ${healthResponse.status}`)
        }

        // Test 2: Check if we can access profile
        addLog('Testing profile API...')
        const profileResponse = await fetch('/api/user/profile', {
          credentials: 'include'
        })
        
        if (profileResponse.ok) {
          addLog('✅ User is logged in - should redirect to dashboard')
          setStatus('Logged in - redirecting to dashboard...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        } else {
          addLog(`ℹ️ User not logged in (${profileResponse.status}) - should show login`)
          setStatus('Not logged in - redirecting to login...')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        addLog(`❌ Diagnostic failed: ${errorMessage}`)
        setError(errorMessage)
        setStatus('Error occurred - showing login as fallback')
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      }
    }

    // Add delay to ensure app is fully loaded
    setTimeout(() => {
      runDiagnostic()
    }, 500)
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">TimeTracker Diagnostic</h1>
          <p className="text-gray-600">{status}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <h3 className="font-medium">Error Detected:</h3>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Diagnostic Logs:</h3>
          <div className="space-y-1 text-sm text-gray-700 font-mono">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
          
          {logs.length === 0 && (
            <div className="text-gray-500">Initializing diagnostic...</div>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Running diagnostics...</p>
        </div>
      </div>
    </div>
  )
}
