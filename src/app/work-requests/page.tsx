'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/contexts/LanguageContext'
import Layout from '@/components/Layout'
import { User, Check, X, UserPlus, Copy, Plus, QrCode } from 'lucide-react'

interface WorkRequest {
  id: string
  fromUser: {
    id: string
    name: string
    email: string
    role: 'WORKER' | 'BOSS'
  }
  toUser: {
    id: string
    name: string
    email: string
    role: 'WORKER' | 'BOSS'
  }
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: 'WORKER' | 'BOSS'
}

export default function WorkRequestsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkRequestsContent />
    </Suspense>
  )
}

function WorkRequestsContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as 'received' | 'sent' | 'share-code' || 'share-code'
  
  const [sentRequests, setSentRequests] = useState<WorkRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<WorkRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'share-code'>(initialTab)
  const [sharingCode, setSharingCode] = useState<string>('')
  const [inputCode, setInputCode] = useState<string>('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [addingConnection, setAddingConnection] = useState(false)

  useEffect(() => {
    fetchData()
    fetchSharingCode()

    // Set up auto-refresh for sharing code every 30 seconds
    // (to ensure we get the new code soon after it rotates every 5 minutes)
    const codeRefreshInterval = setInterval(() => {
      if (activeTab === 'share-code') {
        fetchSharingCode()
      }
    }, 30000) // 30 seconds

    return () => {
      clearInterval(codeRefreshInterval)
    }
  }, [activeTab])

  // Set document title
  useEffect(() => {
    document.title = t('workRequests.title')
  }, [t])

  const fetchSharingCode = async () => {
    try {
      setCodeLoading(true)
      console.log('Fetching sharing code...')
      const response = await fetch('/api/sharing-code', { credentials: 'include' })
      console.log('Sharing code response:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Sharing code data:', data)
        setSharingCode(data.code)
        console.log('Set sharing code to:', data.code)
      } else {
        console.error('Sharing code response not ok:', response.status)
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error fetching sharing code:', error)
    } finally {
      setCodeLoading(false)
    }
  }

  const handleUseCode = async () => {
    if (!inputCode.trim() || inputCode.length !== 6) {
      alert(t('workRequests.validCodeRequired'))
      return
    }

    setAddingConnection(true)
    try {
      const response = await fetch('/api/sharing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCode.trim().toUpperCase() }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        alert(t('workRequests.connectionSuccess', { name: data.user.name }))
        setInputCode('')
        fetchData() // Refresh the connections
      } else {
        const error = await response.json()
        alert(error.error || t('workRequests.connectionFailed'))
      }
    } catch (error) {
      console.error('Error using code:', error)
      alert(t('workRequests.connectionFailed'))
    } finally {
      setAddingConnection(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(t('workRequests.codeCopied'))
    } catch (error) {
      console.error('Failed to copy:', error)
      alert(t('workRequests.failedToCopy'))
    }
  }

  const fetchData = async () => {
    try {
      const [requestsRes, usersRes] = await Promise.all([
        fetch('/api/work-requests', { credentials: 'include' }),
        fetch('/api/user/profile', { credentials: 'include' })
      ])

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setSentRequests(requestsData.sent || [])
        setReceivedRequests(requestsData.received || [])
      }

      if (usersRes.ok) {
        const userData = await usersRes.json()
        // Fetch all users for sending requests
        const allUsersRes = await fetch('/api/users', { credentials: 'include' })
        if (allUsersRes.ok) {
          const allUsersData = await allUsersRes.json()
          setUsers(allUsersData.users || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendWorkRequest = async (toUserId: string) => {
    setSendingRequest(toUserId)
    try {
      const response = await fetch('/api/work-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId }),
        credentials: 'include'
      })

      if (response.ok) {
        fetchData() // Refresh data
        setActiveTab('sent') // Switch to sent tab
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send request')
      }
    } catch (error) {
      console.error('Failed to send request:', error)
      alert('Network error. Please try again.')
    } finally {
      setSendingRequest(null)
    }
  }

  const respondToRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/work-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to respond to request')
      }
    } catch (error) {
      console.error('Failed to respond to request:', error)
      alert('Network error. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'BOSS' ? <UserPlus className="w-4 h-4" /> : <User className="w-4 h-4" />
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
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('workRequests.title')}</h1>
          <p className="text-gray-600">{t('workRequests.subtitle')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('received')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('workRequests.received')} ({receivedRequests.filter(r => r.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('workRequests.sent')} ({sentRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('share-code')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'share-code'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('workRequests.shareCode')}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Received Requests Tab */}
            {activeTab === 'received' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('workRequests.receivedRequests')}</h2>
                {receivedRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t('workRequests.noReceivedRequests')}</p>
                ) : (
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(request.fromUser.role)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{request.fromUser.name}</p>
                                <p className="text-xs text-gray-500">{request.fromUser.email}</p>
                                <p className="text-xs text-gray-400">
                                  {t('workRequests.role')}: {request.fromUser.role.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            
                            {request.status === 'PENDING' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => respondToRequest(request.id, 'ACCEPTED')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  {t('common.accept')}
                                </button>
                                <button
                                  onClick={() => respondToRequest(request.id, 'REJECTED')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  {t('common.reject')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {t('workRequests.sentOn')} {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === 'sent' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('workRequests.sentRequests')}</h2>
                {sentRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t('workRequests.noSentRequests')}</p>
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(request.toUser.role)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{request.toUser.name}</p>
                                <p className="text-xs text-gray-500">{request.toUser.email}</p>
                                <p className="text-xs text-gray-400">
                                  {t('workRequests.role')}: {request.toUser.role.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {t('workRequests.sentOn')} {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Share Code Tab */}
            {activeTab === 'share-code' && (
              <div className="space-y-6">
                {/* Your Sharing Code */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    {t('workRequests.yourSharingCode')}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('workRequests.shareCodeDesc')}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">{t('workRequests.codeRotationNotice')}</span>
                    </p>
                  </div>
                  {codeLoading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : sharingCode ? (
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-4 border">
                      <code className="text-2xl font-mono font-bold text-blue-600 tracking-widest">
                        {sharingCode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(sharingCode)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span>{t('common.copy')}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">{t('workRequests.failedToLoadCode')}</p>
                  )}
                </div>

                {/* Enter Code */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    {t('workRequests.connectToSomeone')}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('workRequests.enterCodeDesc')}
                  </p>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder={t('workRequests.enterCodePlaceholder')}
                      maxLength={6}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono tracking-widest text-lg"
                    />
                    <button
                      onClick={handleUseCode}
                      disabled={addingConnection || inputCode.length !== 6}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {addingConnection ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>{t('common.connect')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
