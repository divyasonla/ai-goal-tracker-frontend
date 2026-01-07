'use client'

import { useState, memo, useCallback } from 'react'
import { goalApi, Goal } from '@/lib/api'
import toast from 'react-hot-toast'

interface GoalFormProps {
  userEmail: string
  username?: string
  onGoalAdded?: () => void
}

function GoalForm({ userEmail, username, onGoalAdded }: GoalFormProps) {
  const [formData, setFormData] = useState({
    goal: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    timeEstimate: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      const newGoal: Goal = {
        email: userEmail,
        username,
        date: today,
        goal: formData.goal,
        priority: formData.priority,
        timeEstimate: formData.timeEstimate || undefined,
        status: 'Not Completed',
      }

      await goalApi.addGoal(newGoal)
      toast.success('Goal added successfully!')
      
      // Reset form
      setFormData({
        goal: '',
        priority: 'Medium',
        timeEstimate: '',
      })

      // Notify parent to refresh
      onGoalAdded?.()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add goal')
    } finally {
      setLoading(false)
    }
  }, [userEmail, username, formData, onGoalAdded])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Daily Goal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
            Goal Description *
          </label>
          <textarea
            id="goal"
            required
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Describe your goal for today..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              id="priority"
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label htmlFor="timeEstimate" className="block text-sm font-medium text-gray-700 mb-2">
              Time Estimate (optional)
            </label>
            <input
              id="timeEstimate"
              type="text"
              value={formData.timeEstimate}
              onChange={(e) => setFormData({ ...formData, timeEstimate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 2 hours"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Goal'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default memo(GoalForm)
