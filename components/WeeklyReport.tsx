'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { goalApi, WeeklyReport as WeeklyReportType } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function WeeklyReport() {
  const { user } = useAuth()
  const [report, setReport] = useState<WeeklyReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')

  // Reliable Saturday check using IST weekday string (no parsing)
  const isSaturdayIST = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata'
  }) === 'Saturday'

  useEffect(() => {
    // Auto-save on Saturday, otherwise just fetch without saving
    loadReport(isSaturdayIST)
  }, [])

  const loadReport = async (save: boolean = false) => {
    try {
      setLoading(true)
      const data = await goalApi.getWeeklyReport({ save })
      setReport(data)
      
      // Get username from profile
      try {
        const profile = await goalApi.getProfile()
        setUsername(profile.username || user?.email?.split('@')[0] || 'Student')
      } catch (err) {
        setUsername(user?.email?.split('@')[0] || 'Student')
      }
    } catch (error) {
      toast.error('Failed to load weekly report')
    } finally {
      setLoading(false)
    }
  }

  // Get current week dates
  const getWeekDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)
    
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    return {
      start: formatDate(monday),
      end: formatDate(saturday),
      generated: new Date().toLocaleString('en-IN', { 
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getPerformanceStatus = (completionRate: number) => {
    if (completionRate >= 80) return { label: '🟢 Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    if (completionRate >= 60) return { label: '🟡 Good', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { label: '🔴 Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const getProgressTrend = (completionRate: number) => {
    if (completionRate >= 80) return 'steady progress with excellent consistency'
    if (completionRate >= 60) return 'improving academic progress'
    return 'needs more consistency and better planning'
  }

  // Render AI insights with bold for Markdown-style headings (**...**)
  const renderAiInsights = (text: string) => {
    if (!text) return null
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, idx) => {
      const isBold = part.startsWith('**') && part.endsWith('**')
      if (isBold) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>
      }
      return <span key={idx}>{part}</span>
    })
  }

  // Compute chart data - hooks must be called before any conditional returns
  const barData = useMemo(() => {
    if (!report) return []
    return [
      { name: 'Completed', value: report.completed, color: '#10b981' },
      { name: 'Partial', value: report.partiallyCompleted, color: '#f59e0b' },
      { name: 'Missed', value: report.notCompleted, color: '#ef4444' },
    ]
  }, [report])

  const pieData = useMemo(() => {
    if (!report) return []
    return [
      { name: 'Completed', value: report.completedPercentage, color: '#10b981' },
      { name: 'Partial', value: report.partialPercentage, color: '#f59e0b' },
      { name: 'Missed', value: report.missedPercentage, color: '#ef4444' },
    ]
  }, [report])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12 text-gray-500">
          No data available for weekly report
        </div>
      </div>
    )
  }

  const weekDates = getWeekDates()
  const performanceStatus = getPerformanceStatus(report.completedPercentage)
  const progressTrend = getProgressTrend(report.completedPercentage)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Weekly Academic Report</h1>
            <p className="text-primary-100">Detailed performance analysis and insights</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Report Generated On</div>
            <div className="font-semibold">{weekDates.generated}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/10 backdrop-blur rounded-xl p-6">
          <div>
            <p className="text-primary-100 text-sm mb-1">Student Name</p>
            <p className="text-xl font-bold">{username}</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm mb-1">Week Duration</p>
            <p className="text-xl font-bold">Monday – Saturday</p>
            <p className="text-sm opacity-90">{weekDates.start} – {weekDates.end}</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm mb-1">Focus Area</p>
            <p className="text-xl font-bold">📚 Academics</p>
          </div>
        </div>
      </div>

      {/* Weekly Summary - Quick Snapshot */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">📈</span>
          Weekly Summary (Quick Snapshot)
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-sm font-medium text-blue-600">Total Goals Set</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{report.totalGoals}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <p className="text-sm font-medium text-green-600">Goals Completed</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{report.completed}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
            <p className="text-sm font-medium text-yellow-600">Partially Completed</p>
            <p className="text-3xl font-bold text-yellow-700 mt-2">{report.partiallyCompleted}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
            <p className="text-sm font-medium text-red-600">Missed Goals</p>
            <p className="text-3xl font-bold text-red-700 mt-2">{report.notCompleted}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
            <p className="text-sm font-medium text-purple-600">Completion Rate</p>
            <p className="text-3xl font-bold text-purple-700 mt-2">{report.completedPercentage.toFixed(0)}%</p>
          </div>
        </div>

        {/* Explanation for Partially Completed */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> <span className="font-medium">Partially Completed</span> ka matlab hai ki aapne apna goal pura nahi kiya, lekin kuch progress zarur ki hai. Yeh count alag se dikhaya jata hai taki aapko apni improvement aur consistency ka sahi feedback mile. Koshish karein ki agle week apne goals ko <span className="font-semibold text-green-700">completely complete</span> karein!
          </p>
        </div>
        {/* Performance Status */}
        <div className={`${performanceStatus.bg} border-2 border-${performanceStatus.color.split('-')[1]}-300 rounded-xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Performance Status</p>
              <p className={`text-2xl font-bold ${performanceStatus.color}`}>{performanceStatus.label}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-800">{report.completedPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Goal Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Completion Rate Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Feedback & Suggestions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="mr-3">🤖</span>
          AI Feedback & Suggestions
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{renderAiInsights(report.aiInsights)}</div>
        </div>
      </div>

      {/* Recommendations */}
      {/* {report.recommendations && report.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">💡</span>
            Key Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start bg-amber-50 border border-amber-200 rounded-lg p-4">
                <span className="text-amber-600 text-xl mr-3">✓</span>
                <span className="text-gray-700 font-medium">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Next Week Improvement Plan */}
      {/* <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <h3 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-3">🎯</span>
          Next Week Improvement Plan (Auto-Suggestions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="text-lg font-semibold mb-2">📋 Carry Forward</div>
            <p className="text-sm opacity-90">Review and carry forward pending goals from this week</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="text-lg font-semibold mb-2">⚖️ Balance Load</div>
            <p className="text-sm opacity-90">Reduce daily overload by setting realistic goals</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="text-lg font-semibold mb-2">📝 Add Practice</div>
            <p className="text-sm opacity-90">Include mock tests and revision goals</p>
          </div>
        </div>
      </div> */}

      {/* Final Remarks */}
      {/* <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="mr-3">📝</span>
          Final Remarks
        </h3>
        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          Overall, this week shows <span className="font-bold text-primary-600">{progressTrend}</span>.
        </p>
        <p className="text-gray-600">
          {report.completedPercentage >= 60 
            ? 'Keep up the great work! With continued consistency and focus, you can achieve even better results next week.' 
            : 'With better consistency, proper planning, and focused effort, your performance can improve significantly next week. Stay motivated!'}
        </p>
      </div> */}

      <div className="flex justify-center">
        <button
          onClick={() => {
            if (!isSaturdayIST) {
              toast.error('Refresh available only on Saturday')
              return
            }
            loadReport(true)
          }}
          disabled={!isSaturdayIST}
          title={isSaturdayIST ? 'Refresh weekly report' : 'Available to refresh only on Saturday'}
          className={`px-8 py-3 text-white text-lg font-semibold rounded-xl focus:outline-none focus:ring-4 transition-all shadow-lg ${
            isSaturdayIST
              ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed opacity-60 pointer-events-none'
          }`}
        >
          🔄 Refresh Report
        </button>
      </div>
    </div>
  )
}

export default memo(WeeklyReport)
