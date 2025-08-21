'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Clock, DollarSign, Calendar, Users } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/utils'

interface ClockStatus {
  activeEntry: {
    id: string
    clockIn: string
    clockOut?: string
  } | null
  isClockedIn: boolean
}

interface TimeEntriesSummary {
  totalMinutes: number
  totalEarnings: number
  completedSessions: number
  totalSessions: number
}

export default function DashboardPage() {
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null)
  const [summary, setSummary] = useState<TimeEntriesSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [clockResponse, entriesResponse] = await Promise.all([
        fetch('/api/time/clock'),
        fetch('/api/time/entries?limit=1')
      ])

      if (clockResponse.ok) {
        const clockData = await clockResponse.json()
        setClockStatus(clockData)
      }

      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json()
        setSummary(entriesData.summary)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockAction = async () => {
    try {
      const method = clockStatus?.isClockedIn ? 'PUT' : 'POST'
      const response = await fetch('/api/time/clock', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchDashboardData() // Refresh data
      } else {
        const data = await response.json()
        alert(data.error || 'An error occurred')
      }
    } catch (error) {
      console.error('Clock action error:', error)
      alert('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to TimeTracker</h1>
          <p className="text-gray-600">Track your work hours, manage your time, and calculate your earnings.</p>
        </div>

        {/* Quick Clock In/Out */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Time Clock</h2>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="text-center">
            <div className="mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                clockStatus?.isClockedIn 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  clockStatus?.isClockedIn ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                {clockStatus?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
              </div>
            </div>
            
            {clockStatus?.isClockedIn && clockStatus.activeEntry && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Started at</p>
                <p className="text-lg font-semibold">
                  {new Date(clockStatus.activeEntry.clockIn).toLocaleTimeString()}
                </p>
              </div>
            )}
            
            <button
              onClick={handleClockAction}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                clockStatus?.isClockedIn
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {clockStatus?.isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(summary.totalMinutes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.completedSessions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalSessions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/profile"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Update Profile</p>
                <p className="text-xs text-gray-500">Set hourly wage & preferences</p>
              </div>
            </a>

            <a
              href="/work-requests"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Clock className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Work Requests</p>
                <p className="text-xs text-gray-500">Send or manage requests</p>
              </div>
            </a>

            <a
              href="/time-entries"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">View History</p>
                <p className="text-xs text-gray-500">See all time entries</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}
