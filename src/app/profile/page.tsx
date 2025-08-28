'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { useTranslation } from '@/contexts/LanguageContext'
import { User, DollarSign, Save, Mail, Calendar, Users, Camera, Upload } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  hourlyWage: number
  profilePicture?: string
  createdAt: string
  updatedAt: string
  workerRelations: Array<{
    boss: {
      id: string
      name: string
      email: string
    }
  }>
  bossRelations: Array<{
    worker: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function ProfilePage() {
  const { t, language } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    hourlyWage: 0,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  // Set document title
  useEffect(() => {
    document.title = t('profile.title')
  }, [t])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          name: data.user.name,
          hourlyWage: data.user.hourlyWage,
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchProfile() // Refresh profile data
        alert(t('profile.profileUpdatedSuccess'))
      } else {
        const data = await response.json()
        alert(data.error || t('profile.failedToUpdate'))
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert(t('auth.networkError'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'hourlyWage' ? parseFloat(value) || 0 : value,
    })
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('Selected file:', file.name, file.type, file.size)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('profile.invalidFileType'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('profile.fileTooLarge'))
      return
    }

    setUploadingPicture(true)
    
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)

      console.log('Sending request to /api/user/profile-picture')

      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Upload successful:', data)
        setProfile(prev => prev ? { ...prev, profilePicture: data.profilePicture } : null)
        alert(t('profile.profilePictureUpdated'))
      } else {
        const data = await response.json()
        console.error('Upload failed:', data)
        alert(data.error || t('profile.failedToUpdatePicture'))
      }
    } catch (error) {
      console.error('Profile picture upload error:', error)
      alert(t('profile.failedToUpdatePicture'))
    } finally {
      setUploadingPicture(false)
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
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <div className="relative mr-4">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name.charAt(0)}
                </div>
              )}
              
              {/* Profile picture upload overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingPicture}
                />
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              
              {uploadingPicture && (
                <div className="absolute inset-0 bg-blue-600 bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-gray-600">{profile?.email}</p>
              <p className="text-sm text-blue-600 mt-1 cursor-pointer hover:text-blue-800">
                {t('profile.changePicture')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-700">{t('profile.email')}</p>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-700">{t('profile.hourlyWage')}</p>
                <p className="font-medium text-gray-900">€{profile?.hourlyWage}/hour</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-700">{t('profile.memberSince')}</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile?.createdAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Profile Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{t('profile.editProfile')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.fullName')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="hourlyWage" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.hourlyWage')}
                </label>
                <input
                  type="number"
                  id="hourlyWage"
                  name="hourlyWage"
                  value={formData.hourlyWage}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                                {saving ? t('profile.updating') : t('profile.update')}
              </button>
            </form>
          </div>

          {/* Relationships */}
          <div className="space-y-6">
            {/* My Bosses */}
            {profile?.workerRelations && profile.workerRelations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.myManagers')}</h2>
                </div>
                
                <div className="space-y-3">
                  {profile.workerRelations.map((relation) => (
                    <div key={relation.boss.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {relation.boss.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{relation.boss.name}</p>
                        <p className="text-sm text-gray-600">{relation.boss.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Workers */}
            {profile?.bossRelations && profile.bossRelations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.myTeam')}</h2>
                </div>
                
                <div className="space-y-3">
                  {profile.bossRelations.map((relation) => (
                    <div key={relation.worker.id} className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {relation.worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{relation.worker.name}</p>
                        <p className="text-sm text-gray-600">{relation.worker.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No relationships */}
            {(!profile?.workerRelations?.length && !profile?.bossRelations?.length) && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('profile.noWorkRelationships')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('profile.noWorkRelationshipsDesc')}
                  </p>
                  <a
                    href="/work-requests"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    {t('profile.sendWorkRequest')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
