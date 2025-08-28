'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { useTranslation } from '@/contexts/LanguageContext'
import { User, Users, Eye } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import Link from 'next/link'

interface Worker {
  id: string
  name: string
  email: string
  profilePicture: string | null
  joinDate: string
  todayMinutes: number
  totalMinutes: number
}

export default function MyWorkersPage() {
  const { t } = useTranslation()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [bosses, setBosses] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workers' | 'bosses'>('workers')

  useEffect(() => {
    fetchTeamData()
    
    // Add focus listener to refetch data when user returns to page
    const handleFocus = () => {
      console.log('Page focused, refetching team data...')
      fetchTeamData()
    }
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refetching team data...')
        fetchTeamData()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Set document title
  useEffect(() => {
    document.title = t('myWorkers.title')
  }, [t])

  const fetchTeamData = async () => {
    console.log('Fetching team data...')
    setLoading(true)
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/teamdata?_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Team data received:', data)
        setWorkers(data.workers || [])
        setBosses(data.bosses || [])
      } else {
        console.error('Failed to fetch team data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('myWorkers.title')}</h1>
          <p className="text-gray-600">{t('myWorkers.subtitle')}</p>
        </div>

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
                {t('myWorkers.tabITrack')} ({workers.length})
              </button>
              <button
                onClick={() => setActiveTab('bosses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bosses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('myWorkers.tabTracksMe')} ({bosses.length})
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
                    <p className="text-gray-500">{t('myWorkers.noTeamMembersDesc')}</p>
                    <Link
                      href="/work-requests"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {t('nav.workRequests')}
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
                            {worker.todayMinutes > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                {t('myWorkers.activeToday')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t('myWorkers.inactive')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">{t('myWorkers.hoursWorked')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDuration(worker.totalMinutes)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Tänane aeg</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDuration(worker.todayMinutes)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">{t('myWorkers.memberSince')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(worker.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{t('myWorkers.memberSince')}: {new Date(worker.joinDate).toLocaleDateString()}</span>
                          <Link
                            href={`/team/${worker.id}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {t('myWorkers.viewDetails')}
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
                    <p className="text-gray-500">{t('myWorkers.noTeamMembersDesc')}</p>
                    <Link
                      href="/work-requests"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {t('nav.workRequests')}
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
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{t('myWorkers.memberSince')}: {new Date(boss.joinDate).toLocaleDateString()}</span>
                          <Link
                            href={`/team/${boss.id}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {t('myWorkers.viewProfile')}
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
