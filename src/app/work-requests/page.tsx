'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { User, Clock, Check, X, Send, UserPlus } from 'lucide-react'

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
  const [sentRequests, setSentRequests] = useState<WorkRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<WorkRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'send'>('received')

  useEffect(() => {
    fetchData()
  }, [])

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Work Requests</h1>
          <p className="text-gray-600">Connect with others to share your time tracking or view others&apos; work hours.</p>
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
                Received ({receivedRequests.filter(r => r.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sent ({sentRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('send')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'send'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Send Request
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Received Requests Tab */}
            {activeTab === 'received' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Requests You&apos;ve Received</h2>
                {receivedRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No work requests received yet.</p>
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
                                  Role: {request.fromUser.role.toLowerCase()}
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
                                  Accept
                                </button>
                                <button
                                  onClick={() => respondToRequest(request.id, 'REJECTED')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Sent on {new Date(request.createdAt).toLocaleDateString()}
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
                <h2 className="text-lg font-semibold text-gray-900">Requests You&apos;ve Sent</h2>
                {sentRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No work requests sent yet.</p>
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
                                  Role: {request.toUser.role.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Sent on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Send Request Tab */}
            {activeTab === 'send' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Send Work Request</h2>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users available to send requests to.</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(user.role)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-400">
                                  Role: {user.role.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => sendWorkRequest(user.id)}
                            disabled={sendingRequest === user.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingRequest === user.id ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Request
                              </>
                            )}
                          </button>
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
