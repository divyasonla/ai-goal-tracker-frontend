'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { DashboardSkeleton, GoalSkeleton, CardSkeleton } from '@/components/LoadingSkeleton'
import { profileApi, UserProfile } from '@/lib/api'

// Lazy load heavy components
const GoalForm = lazy(() => import('@/components/GoalForm'))
const GoalList = lazy(() => import('@/components/GoalList'))
const WeeklyReport = lazy(() => import('@/components/WeeklyReport'))
const AllStudentsView = lazy(() => import('@/components/AllStudentsView'))
const AllStudentsReports = lazy(() => import('@/components/AllStudentsReports'))

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'add' | 'update' | 'report' | 'students' | 'allReports'>('add')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', username: '', phase: '0' })
  const [editMode, setEditMode] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const isTeacher = profile?.role === 'teacher'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const loadProfile = async () => {
      try {
        setProfileLoading(true)
        const data = await profileApi.getProfile()
        setProfile(data)
        setProfileForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
          phase: String(data.phase ?? 0),
        })
      } catch (error: any) {
        toast.error('Please complete your profile')
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [user])

  const refreshGoals = () => {
    // Trigger goal list refresh
    setActiveTab(current => current)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  if (loading || !user) {
    return <DashboardSkeleton />
  }

  if (profileLoading) {
    return <DashboardSkeleton />
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="bg-white shadow rounded-lg p-8 text-center space-y-4 max-w-md w-full">
          <p className="text-lg font-semibold text-gray-900">Profile not found</p>
          <p className="text-sm text-gray-600">Please sign out and sign up again to create your profile.</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  const saveProfile = async () => {
    const trimmedUsername = profileForm.username.trim().toLowerCase()
    if (!trimmedUsername) {
      toast.error('Username is required')
      return
    }

    const numericPhase = Number(profileForm.phase)
    if (Number.isNaN(numericPhase) || numericPhase < 0 || numericPhase > 7) {
      toast.error('Phase must be between 0 and 7')
      return
    }

    try {
      setSavingProfile(true)
      const updated = await profileApi.saveProfile({
        username: trimmedUsername,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phase: numericPhase,
      })
      setProfile(updated)
      setProfileForm({
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        username: updated.username || '',
        phase: String(updated.phase ?? 0),
      })
      setEditMode(false)
      toast.success('Profile updated')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update profile'
      toast.error(message)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">AI</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Dashboard</p>
                <h1 className="text-xl font-bold text-slate-900">AI Daily Goal Tracker</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900">{profile?.firstName || profile?.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : profile?.username ? `@${profile.username}` : user.email}</span>
                <span className="text-xs text-slate-500">Phase {profile?.phase ?? 0}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                  {(profileForm.username || user.email || 'U')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Logged in as</p>
                  <p className="text-base font-semibold text-slate-900">{profile?.username ? `@${profile.username}` : user.email}</p>
                </div>
              </div>

              {!editMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Name</span>
                    <span className="font-semibold text-slate-900">{profile?.firstName || profile?.lastName ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() : 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[160px] text-right">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Role</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      profile?.role === 'teacher' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {profile?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Phase</span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">{profile?.phase ?? 0}</span>
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full mt-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs font-medium text-slate-600">First Name</label>
                    <input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="First name"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs font-medium text-slate-600">Last Name</label>
                    <input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Last name"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs font-medium text-slate-600">Username</label>
                    <input
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="username"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs font-medium text-slate-600">Phase (0-7)</label>
                    <select
                      value={profileForm.phase}
                      onChange={(e) => setProfileForm({ ...profileForm, phase: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {[0,1,2,3,4,5,6,7].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setProfileForm({
                          firstName: profile?.firstName || '',
                          lastName: profile?.lastName || '',
                          username: profile?.username || '',
                          phase: String(profile?.phase ?? 0),
                        })
                      }}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">Daily reminders</p>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                <li>Set 1–3 clear goals each morning.</li>
                <li>Track blockers and reflections as you go.</li>
                <li>Keep phases updated for tailored reports.</li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200">
                {['add','update','report', ...(isTeacher ? ['students', 'allReports'] : [])].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as 'add' | 'update' | 'report' | 'students' | 'allReports')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'add' && '➕ Add Goal'}
                    {tab === 'update' && '📝 Update Status'}
                    {tab === 'report' && '📊 Weekly Report'}
                    {tab === 'students' && '👥 All Students'}
                    {tab === 'allReports' && '📈 All Reports'}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6">
                <Suspense fallback={<GoalSkeleton />}>
                  {activeTab === 'add' && <GoalForm userEmail={user.email!} username={profile?.username} onGoalAdded={refreshGoals} />}
                </Suspense>
                <Suspense fallback={<GoalSkeleton />}>
                  {activeTab === 'update' && <GoalList username={profile?.username} />}
                </Suspense>
                <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <CardSkeleton key={i} />)}</div>}>
                  {activeTab === 'report' && <WeeklyReport />}
                </Suspense>
                <Suspense fallback={<GoalSkeleton />}>
                  {activeTab === 'students' && isTeacher && <AllStudentsView />}
                </Suspense>
                <Suspense fallback={<GoalSkeleton />}>
                  {activeTab === 'allReports' && isTeacher && <AllStudentsReports />}
                </Suspense>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
