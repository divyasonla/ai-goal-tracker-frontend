'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { goalApi, Goal } from '@/lib/api'
import toast from 'react-hot-toast'

interface GoalListProps {
  username?: string
}

function GoalList({ username }: GoalListProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')  // Empty = all goals
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formState, setFormState] = useState({ status: 'Not Completed', reflection: '', blockers: '', goal: '' })

  useEffect(() => {
    loadGoals()
  }, [selectedDate])

  const loadGoals = async () => {
    try {
      setLoading(true)
      // If no date selected, get all goals. Otherwise filter by date
      const data = await goalApi.getGoals(selectedDate || undefined)
      setGoals(data)
    } catch (error) {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const openEditor = (goal: Goal) => {
    setEditingGoal(goal)
    setFormState({
      status: goal.status || 'Not Completed',
      reflection: goal.reflection || '',
      blockers: goal.blockers || '',
      goal: goal.goal || '',
    })
  }

  const handleUpdateStatus = async (goal: Goal) => {
    try {
      await goalApi.updateGoal(goal.id!, {
        status: formState.status as any,
        reflection: formState.reflection,
        blockers: formState.blockers,
        goal: formState.goal,
      })
      toast.success('Goal updated successfully!')
      setEditingGoal(null)
      loadGoals()
    } catch (error) {
      toast.error('Failed to update goal')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100'
      case 'Partially Completed': return 'text-yellow-600 bg-yellow-100'
      case 'Not Completed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredGoals = useMemo(() => goals, [goals])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{username ? `@${username}'s Goals` : 'Your Goals'}</h2>
          <p className="text-sm text-slate-500">Track and update today’s progress.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-slate-600">Filter by date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Show All
            </button>
          )}
        </div>
      </div>


      {goals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {selectedDate ? 'No goals found for this date' : 'No goals yet. Add your first goal!'}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{goal.goal}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                    {goal.timeEstimate && (
                      <span className="px-2 py-1 text-xs font-medium rounded text-gray-600 bg-gray-100">
                        {goal.timeEstimate}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(goal.status || 'Not Completed')}`}>
                      {goal.status || 'Not Completed'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openEditor(goal)}
                  className="ml-4 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Update
                </button>
              </div>

              {editingGoal?.id === goal.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal description
                    </label>
                    <textarea
                      value={formState.goal}
                      onChange={(e) => setFormState({ ...formState, goal: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formState.status || 'Not Completed'}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Partially Completed">Partially Completed</option>
                      <option value="Not Completed">Not Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What went well?
                    </label>
                    <textarea
                      value={formState.reflection}
                      onChange={(e) => setFormState({ ...formState, reflection: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Optional reflection..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What blocked progress?
                    </label>
                    <textarea
                      value={formState.blockers}
                      onChange={(e) => setFormState({ ...formState, blockers: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Optional blockers..."
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingGoal(null)}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(goal)}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(GoalList)
