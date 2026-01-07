'use client'

import { useState, useEffect, useMemo } from 'react'
import { goalApi, Goal } from '@/lib/api'
import toast from 'react-hot-toast'

const AllStudentsView = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchAllGoals()
  }, [selectedDate])

  const fetchAllGoals = async () => {
    try {
      setLoading(true)
      const data = await goalApi.getGoals(selectedDate)
      setGoals(data)
    } catch (error) {
      toast.error('Failed to load goals')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesSearch = 
        goal.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.goal?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || goal.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [goals, searchQuery, filterStatus])

  const studentStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; partial: number; missed: number }> = {}
    
    goals.forEach((goal) => {
      const key = goal.username || goal.email || 'Unknown'
      if (!stats[key]) {
        stats[key] = { total: 0, completed: 0, partial: 0, missed: 0 }
      }
      stats[key].total++
      if (goal.status === 'Completed') stats[key].completed++
      else if (goal.status === 'Partially Completed') stats[key].partial++
      else if (goal.status === 'Not Completed') stats[key].missed++
    })
    
    return stats
  }, [goals])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✓ Completed</span>
      case 'Partially Completed':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">⚡ Partial</span>
      case 'Not Completed':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">✗ Missed</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">High</span>
      case 'Medium':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700">Medium</span>
      case 'Low':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">Low</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
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
              placeholder="Search by student name, email, or goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Partially Completed">Partial</option>
              <option value="Not Completed">Missed</option>
            </select>
          </div>
        </div>

        {/* Student Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Students</p>
            <p className="text-2xl font-bold text-blue-900">{Object.keys(studentStats).length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Goals</p>
            <p className="text-2xl font-bold text-green-900">{goals.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Showing Results</p>
            <p className="text-2xl font-bold text-purple-900">{filteredGoals.length}</p>
          </div>
        </div>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-slate-600 font-medium">No goals found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                        {(goal.username || goal.email || 'U')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{goal.username || 'No username'}</p>
                        <p className="text-xs text-slate-500">{goal.email}</p>
                      </div>
                    </div>
                    {getPriorityBadge(goal.priority || '')}
                  </div>
                  <p className="text-base font-medium text-slate-800 mb-2">{goal.goal}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    {goal.timeEstimate && (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">⏱</span>
                        {goal.timeEstimate}
                      </span>
                    )}
                    {goal.date && (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">📅</span>
                        {new Date(goal.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {goal.reflection && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-sm text-slate-700">
                      <strong className="text-slate-900">Reflection:</strong> {goal.reflection}
                    </div>
                  )}
                  {goal.blockers && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-sm text-amber-900">
                      <strong>Blockers:</strong> {goal.blockers}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(goal.status || 'Not Completed')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AllStudentsView
