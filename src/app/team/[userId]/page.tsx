'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useTranslation } from '@/contexts/LanguageContext'
import { Calendar, Users, ArrowLeft, EyeOff } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  hourlyWage: number
  createdAt: string
  updatedAt: string
  workerRelations?: Array<{
    boss: {
      id: string
      name: string
      email: string
    }
  }>
  bossRelations?: Array<{
    worker: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function TeamProfilePage() {
  const { t } = useTranslation()
  const { userId } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/user/profile/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data.user)
        } else if (response.status === 404) {
          setError(t('team.userNotFound'))
        } else if (response.status === 403) {
          setError(t('team.profileNotVisible'))
        } else {
          setError(t('team.failedToLoad'))
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        setError(t('auth.networkError'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, t])

  // Set document title
  useEffect(() => {
    document.title = profile ? `${profile.name} - ${t('team.profile')}` : t('team.profile')
  }, [profile, t])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </button>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <EyeOff className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">{t('team.cannotViewProfile')}</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </button>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">{t('team.profileNotFound')}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <div className="mr-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.charAt(0)}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Join Date */}
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-700">{t('profile.memberSince')}</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Relationships */}
        <div className="space-y-6">
          {/* Team Members (if this person is a boss) */}
          {profile.bossRelations && profile.bossRelations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{t('team.teamMembers')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.bossRelations.map((relation) => (
                  <div key={relation.worker.id} className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {relation.worker.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{relation.worker.name}</p>
                      <p className="text-sm text-gray-500">{relation.worker.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Managers (if this person is a worker) */}
          {profile.workerRelations && profile.workerRelations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{t('team.managers')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.workerRelations.map((relation) => (
                  <div key={relation.boss.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {relation.boss.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{relation.boss.name}</p>
                      <p className="text-sm text-gray-500">{relation.boss.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
