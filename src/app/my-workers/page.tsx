'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { User, Users, Clock, DollarSign, Calendar, Eye } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/utils'
import Link from 'next/link'

interface Worker {
  id: string
  name: string
  email: string
  role: 'WORKER' | 'BOSS'
  hourlyWage: number
  createdAt: string
  timeEntries: {
    totalMinutes: number
    totalEarnings: number
    completedSessions: number
    lastActivity: string | null
  }
}

interface TeamStats {
  totalWorkers: number
  totalBosses: number
  totalHoursWorked: number
  totalEarningsPaid: number
}

export default function MyWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [bosses, setBosses] = useState<Worker[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workers' | 'bosses'>('workers')

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/team/members', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setWorkers(data.workers || [])
        setBosses(data.bosses || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    return role === 'BOSS' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No activity
        </span>
      )
    }

    const lastDate = new Date(lastActivity)
    const now = new Date()
    const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Active today
        </span>
      )
    } else if (diffHours < 168) { // 7 days
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Active this week
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      )
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Team</h1>
          <p className="text-gray-600">View your connections and monitor shared work hours.</p>
        </div>

        {/* Team Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Workers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWorkers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Bosses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBosses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(stats.totalHoursWorked)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEarningsPaid)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('workers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'workers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                People Sharing With Me ({workers.length})
              </button>
              <button
                onClick={() => setActiveTab('bosses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bosses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                People I Share With ({bosses.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Workers Tab */}
            {activeTab === 'workers' && (
              <div className="space-y-4">
                {workers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No connections found. Send requests to connect with others.</p>
                    <Link
                      href="/work-requests"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Manage Work Requests
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workers.map((worker) => (
                      <div key={worker.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{worker.name}</h3>
                              <p className="text-xs text-gray-500">{worker.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(worker.role)}`}>
                              {worker.role}
                            </span>
                            {getActivityStatus(worker.timeEntries.lastActivity)}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Hours Worked</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDuration(worker.timeEntries.totalMinutes)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Earnings</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(worker.timeEntries.totalEarnings)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Sessions</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {worker.timeEntries.completedSessions}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Hourly Rate: {formatCurrency(worker.hourlyWage)}/hr</span>
                          <Link
                            href={`/team/worker/${worker.id}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bosses Tab */}
            {activeTab === 'bosses' && (
              <div className="space-y-4">
                {bosses.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bosses found. Send work requests to connect with supervisors.</p>
                    <Link
                      href="/work-requests"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Manage Work Requests
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bosses.map((boss) => (
                      <div key={boss.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{boss.name}</h3>
                              <p className="text-xs text-gray-500">{boss.email}</p>
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(boss.role)}`}>
                            {boss.role}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Member since: {new Date(boss.createdAt).toLocaleDateString()}</span>
                          <Link
                            href={`/team/boss/${boss.id}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
