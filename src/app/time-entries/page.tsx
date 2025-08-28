'use client'

import { useEffect, useState, useCallback } from 'react'
import Layout from '@/components/Layout'
import { useTranslation } from '@/contexts/LanguageContext'
import { Clock, Calendar, DollarSign, Filter, Download, Edit, Trash2, X } from 'lucide-react'
import { formatCurrency, formatDuration, formatTimeByLanguage, formatDateByLanguage } from '@/lib/utils'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  duration: number | null
  earnings: number | null
  user: {
    id: string
    name: string
    email: string
    hourlyWage: number
  }
}

interface TimeEntriesSummary {
  totalMinutes: number
  totalEarnings: number
  completedSessions: number
  totalSessions: number
}

export default function TimeEntriesPage() {
  const { t, language } = useTranslation()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [summary, setSummary] = useState<TimeEntriesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editClockOutTime, setEditClockOutTime] = useState('')
  const [removingEntry, setRemovingEntry] = useState<string | null>(null)

  const fetchTimeEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter)
      if (statusFilter !== 'all') params.set('statusFilter', statusFilter)
      
      const response = await fetch(`/api/time/entries?${params.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data.timeEntries || [])
        setSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error)
    } finally {
      setLoading(false)
    }
  }, [dateFilter, statusFilter])

  useEffect(() => {
    fetchTimeEntries()
  }, [fetchTimeEntries])

  // Set document title
  useEffect(() => {
    document.title = t('timeEntries.title')
  }, [t])

  const exportData = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter)
      if (statusFilter !== 'all') params.set('statusFilter', statusFilter)
      params.set('export', 'csv')
      
      const response = await fetch(`/api/time/entries?${params.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      alert(t('timeEntries.exportFailed'))
    }
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

  const getStatusBadge = (entry: TimeEntry) => {
    if (!entry.clockOut) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          {t('timeEntries.active')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {t('timeEntries.completed')}
      </span>
    )
  }

  const formatDateRange = (filter: string) => {
    const today = new Date()
    switch (filter) {
      case 'today':
        return today.toLocaleDateString()
      case 'week':
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6))
        return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
      case 'month':
        return today.toLocaleDateString('default', { month: 'long', year: 'numeric' })
      default:
        return t('timeEntries.allTime')
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('timeEntries.title')}</h1>
              <p className="text-gray-600">{t('timeEntries.subtitle')}</p>
            </div>
            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('timeEntries.exportCsv')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('timeEntries.dateRange')}</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('timeEntries.allTime')}</option>
                  <option value="today">{t('timeEntries.today')}</option>
                  <option value="week">{t('timeEntries.thisWeek')}</option>
                  <option value="month">{t('timeEntries.thisMonth')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('timeEntries.status')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('timeEntries.all')}</option>
                  <option value="active">{t('timeEntries.active')}</option>
                  <option value="completed">{t('timeEntries.completed')}</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">
                {t('timeEntries.showingEntriesFor')} <span className="font-medium">{formatDateRange(dateFilter)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('timeEntries.totalTime')}</p>
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
                  <p className="text-sm font-medium text-gray-500">{t('timeEntries.totalEarnings')}</p>
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
                  <p className="text-sm font-medium text-gray-500">{t('timeEntries.completed')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.completedSessions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('timeEntries.totalSessions')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalSessions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Entries Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('timeEntries.recentEntries')}</h2>
          </div>
          
          {timeEntries.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('timeEntries.noEntriesFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.clockIn')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.clockOut')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.duration')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.earnings')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('timeEntries.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateByLanguage(entry.clockIn, language)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimeByLanguage(entry.clockIn, language)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.clockOut ? formatTimeByLanguage(entry.clockOut, language) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.duration ? formatDuration(entry.duration) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.earnings ? formatCurrency(entry.earnings) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(entry)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
