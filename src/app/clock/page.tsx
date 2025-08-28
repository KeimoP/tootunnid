'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { useTranslation } from '@/contexts/LanguageContext'
import { Clock, Play, Square, History, Calendar, Edit, X, Trash2 } from 'lucide-react'
import { formatTimeByLanguage, formatDateByLanguage } from '@/lib/utils'

interface ClockStatus {
  activeEntry: {
    id: string
    clockIn: string
    clockOut?: string
  } | null
  isClockedIn: boolean
}

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  duration: number | null
  earnings: number | null
}

export default function ClockPage() {
  const { t, language } = useTranslation()
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editClockOutTime, setEditClockOutTime] = useState('')
  const [removingEntry, setRemovingEntry] = useState<string | null>(null)

  useEffect(() => {
    fetchClockStatus()
    fetchTimeEntries()
    
    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Set document title
  useEffect(() => {
    document.title = t('clock.title')
  }, [t])

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

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch('/api/time/entries?limit=10')
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data.timeEntries || [])
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error)
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
        fetchTimeEntries() // Refresh time entries after clock action
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

  const handleEditTime = (entryId: string, clockOutTime: string | null) => {
    setEditingEntry(entryId)
    if (clockOutTime) {
      // Format the existing clock out time for input
      const date = new Date(clockOutTime)
      const formatted = date.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM format
      setEditClockOutTime(formatted)
    } else {
      // Set current time as default
      const now = new Date()
      const formatted = now.toISOString().slice(0, 16)
      setEditClockOutTime(formatted)
    }
  }

  const handleSaveEditTime = async () => {
    if (!editingEntry || !editClockOutTime) return

    try {
      setLoading(true)
      const response = await fetch(`/api/time/entries/${editingEntry}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clockOut: new Date(editClockOutTime).toISOString()
        }),
        credentials: 'include'
      })

      if (response.ok) {
        alert(t('clock.updateSuccess'))
        setEditingEntry(null)
        setEditClockOutTime('')
        // Refresh data
        fetchClockStatus()
        fetchTimeEntries()
      } else {
        const data = await response.json()
        alert(data.error || t('clock.updateError'))
      }
    } catch (error) {
      console.error('Error updating clock out time:', error)
      alert(t('clock.updateError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    setEditClockOutTime('')
  }

  const handleRemoveEntry = (entryId: string) => {
    setRemovingEntry(entryId)
  }

  const handleConfirmRemove = async () => {
    if (!removingEntry) return

    try {
      setLoading(true)
      const response = await fetch(`/api/time/entries/${removingEntry}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert(t('clock.removeSuccess'))
        setRemovingEntry(null)
        // Refresh data
        fetchClockStatus()
        fetchTimeEntries()
      } else {
        const data = await response.json()
        alert(data.error || t('clock.removeError'))
      }
    } catch (error) {
      console.error('Error removing time entry:', error)
      alert(t('clock.removeError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRemove = () => {
    setRemovingEntry(null)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Current Time Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
          <div className="mb-6">
            <Clock className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('clock.title')}</h1>
            <p className="text-gray-600">{t('clock.subtitle')}</p>
          </div>
          
          <div className="mb-8">
            <div className="text-6xl font-mono font-bold text-gray-900 mb-2">
              {formatTimeByLanguage(currentTime, language)}
            </div>
            <div className="text-lg text-gray-600">
              {formatDateByLanguage(currentTime, language)}
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
              {clockStatus?.isClockedIn ? t('clock.currentlyWorking') : t('clock.notWorking')}
            </div>
          </div>

          {/* Work Duration (if clocked in) */}
          {clockStatus?.isClockedIn && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-2">{t('clock.currentSession')}</h3>
              <div className="text-3xl font-bold text-blue-800 mb-1">
                {getWorkDuration()}
              </div>
              <p className="text-sm text-blue-700">
                {t('clock.startedAt')} {formatTimeByLanguage(clockStatus.activeEntry!.clockIn, language)}
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
                  <span>{loading ? t('clock.clockingOut') : t('clock.clockOut')}</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>{loading ? t('clock.clockingIn') : t('clock.clockIn')}</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('clock.howItWorks')}</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>{t('clock.clockInDesc')}</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>{t('clock.automaticTrackingDesc')}</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>{t('clock.clockOutDesc')}</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>{t('clock.earningsInfo')}</p>
            </div>
          </div>
        </div>

        {/* Recent Time Entries History */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <History className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{t('clock.recentHistory')}</h2>
          </div>
          
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('clock.noTimeEntries')}</p>
              <p className="text-sm">{t('clock.noTimeEntriesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDateByLanguage(entry.clockIn, language)}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {t('clock.in')}: {formatTimeByLanguage(entry.clockIn, language)}
                        </span>
                      </div>
                      {entry.clockOut && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {t('clock.out')}: {formatTimeByLanguage(entry.clockOut, language)}
                          </span>
                        </div>
                      )}
                      {!entry.clockOut && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-sm font-medium text-yellow-600">{t('clock.currentlyWorking')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {entry.duration && (
                        <div className="text-sm font-medium text-gray-900">
                          {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                        </div>
                      )}
                      {entry.earnings && (
                        <div className="text-sm text-green-600 font-medium">
                          €{entry.earnings.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {entry.clockOut && (
                      <button
                        onClick={() => handleEditTime(entry.id, entry.clockOut)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('clock.editTime')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('clock.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Clock Out Time Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('clock.editClockOut')}</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {t('clock.editClockOutDesc')}
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clock.clockOutTime')}
                </label>
                <input
                  type="datetime-local"
                  value={editClockOutTime}
                  onChange={(e) => setEditClockOutTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveEditTime}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? t('clock.saving') : t('clock.save')}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('clock.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Time Entry Confirmation Modal */}
        {removingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('clock.removeEntry')}</h3>
                <button
                  onClick={handleCancelRemove}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  {t('clock.removeConfirm')}
                </p>
                <p className="text-sm text-red-600 font-medium">
                  {t('clock.removeWarning')}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmRemove}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? t('clock.removing') : t('clock.remove')}
                </button>
                <button
                  onClick={handleCancelRemove}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('clock.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
