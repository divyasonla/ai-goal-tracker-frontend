'use client'

import { useState, useEffect, useMemo } from 'react'
import { WeeklyReport } from '@/lib/api'
import toast from 'react-hot-toast'

interface StudentReport {
  email: string
  username: string
  weekStart: string
  weekEnd: string
  totalGoals: number
  completed: number
  partiallyCompleted: number
  notCompleted: number
  completionRate: number
  performanceStatus: string
  aiFeedback: string
  finalRemarks: string
  recordedAt: string
}

const AllStudentsReports = () => {
  const [reports, setReports] = useState<StudentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWeekStart, setSelectedWeekStart] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchAllReports()
  }, [])

  const fetchAllReports = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/weekly-report/all`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      })
      
      if (response.status === 403) {
        toast.error('Access denied. Teacher account required.')
        setReports([])
        return
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch reports: ${response.status}`)
      }
      
      const data = await response.json()
      setReports(data)
      
      if (data.length === 0) {
        toast('No weekly reports found yet')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reports')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async () => {
    const { auth } = await import('@/lib/firebase')
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return ''
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = 
        report.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesWeek = !selectedWeekStart || report.weekStart === selectedWeekStart
      
      const matchesStatus = filterStatus === 'all' || report.performanceStatus === filterStatus
      
      return matchesSearch && matchesWeek && matchesStatus
    })
  }, [reports, searchQuery, selectedWeekStart, filterStatus])

  const uniqueWeeks = useMemo(() => {
    const weeks = new Set(reports.map(r => r.weekStart))
    return Array.from(weeks).sort((a, b) => b.localeCompare(a))
  }, [reports])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Excellent':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">🟢 Excellent</span>
      case 'Good':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">🟡 Good</span>
      case 'Needs Improvement':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">🔴 Needs Improvement</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Weeks</option>
              {uniqueWeeks.map((week) => (
                <option key={week} value={week}>
                  Week of {new Date(week).toLocaleDateString()}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Performance</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Reports</p>
            <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Excellent</p>
            <p className="text-2xl font-bold text-green-900">
              {reports.filter(r => r.performanceStatus === 'Excellent').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Good</p>
            <p className="text-2xl font-bold text-yellow-900">
              {reports.filter(r => r.performanceStatus === 'Good').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Needs Improvement</p>
            <p className="text-2xl font-bold text-red-900">
              {reports.filter(r => r.performanceStatus === 'Needs Improvement').length}
            </p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-slate-600 font-medium">No reports found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, idx) => (
            <div
              key={`${report.email}-${report.weekStart}-${idx}`}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-all"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                    {(report.username || report.email || 'U')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{report.username || 'No username'}</p>
                    <p className="text-sm text-slate-500">{report.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      📅 Week: {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  {getStatusBadge(report.performanceStatus)}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{report.totalGoals}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{report.completed}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-600 mb-1">Partial</p>
                  <p className="text-2xl font-bold text-yellow-900">{report.partiallyCompleted}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600 mb-1">Missed</p>
                  <p className="text-2xl font-bold text-red-900">{report.notCompleted}</p>
                </div>
                <div className="bg-primary-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-primary-600 mb-1">Rate</p>
                  <p className={`text-2xl font-bold ${getCompletionColor(report.completionRate)}`}>
                    {report.completionRate.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              {report.aiFeedback && (
                <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900 mb-2">🤖 AI Feedback</p>
                  <p className="text-sm text-slate-700">{report.aiFeedback}</p>
                </div>
              )}

              {/* Final Remarks */}
              {report.finalRemarks && (
                <div className="p-4 rounded-lg bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900 mb-2">📝 Final Remarks</p>
                  <p className="text-sm text-slate-700">{report.finalRemarks}</p>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                  Report generated: {new Date(report.recordedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AllStudentsReports
