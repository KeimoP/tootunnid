'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Clock, Play, Square } from 'lucide-react'

interface ClockStatus {
  activeEntry: {
    id: string
    clockIn: string
    clockOut?: string
  } | null
  isClockedIn: boolean
}

export default function ClockPage() {
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClockStatus()
    
    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchClockStatus = async () => {
    try {
      const response = await fetch('/api/time/clock')
      if (response.ok) {
        const data = await response.json()
        setClockStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch clock status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockAction = async () => {
    setLoading(true)
    try {
      const method = clockStatus?.isClockedIn ? 'PUT' : 'POST'
      const response = await fetch('/api/time/clock', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchClockStatus()
      } else {
        const data = await response.json()
        alert(data.error || 'An error occurred')
      }
    } catch (error) {
      console.error('Clock action error:', error)
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getWorkDuration = () => {
    if (!clockStatus?.activeEntry?.clockIn) return '0h 0m'
    
    const start = new Date(clockStatus.activeEntry.clockIn)
    const now = currentTime
    const diffMs = now.getTime() - start.getTime()
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Current Time Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
          <div className="mb-6">
            <Clock className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Clock</h1>
            <p className="text-gray-600">Track your work hours</p>
          </div>
          
          <div className="mb-8">
            <div className="text-6xl font-mono font-bold text-gray-900 mb-2">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-lg text-gray-600">
              {currentTime.toLocaleDateString([], { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mb-8">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium ${
              clockStatus?.isClockedIn 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full mr-3 ${
                clockStatus?.isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              {clockStatus?.isClockedIn ? 'Currently Working' : 'Not Working'}
            </div>
          </div>

          {/* Work Duration (if clocked in) */}
          {clockStatus?.isClockedIn && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Current Session</h3>
              <div className="text-3xl font-bold text-blue-800 mb-1">
                {getWorkDuration()}
              </div>
              <p className="text-sm text-blue-700">
                Started at {new Date(clockStatus.activeEntry!.clockIn).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Clock In/Out Button */}
          <button
            onClick={handleClockAction}
            disabled={loading}
            className={`px-12 py-6 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              clockStatus?.isClockedIn
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              {clockStatus?.isClockedIn ? (
                <>
                  <Square className="w-6 h-6" />
                  <span>{loading ? 'Clocking Out...' : 'Clock Out'}</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>{loading ? 'Clocking In...' : 'Clock In'}</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>Click &quot;Clock In&quot; when you start working</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>Your time will be tracked automatically</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>Click &quot;Clock Out&quot; when you finish working</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>Your earnings will be calculated based on your hourly wage</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
