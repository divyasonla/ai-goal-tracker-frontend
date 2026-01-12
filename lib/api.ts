import axios from 'axios'
import { auth } from '@/lib/firebase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Request cache for deduplication
const requestCache = new Map<string, Promise<any>>()
const cacheTimeout = 2000 // 2 seconds

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response cache for GET requests
api.interceptors.response.use(
  (response) => {
    // Clear cache entry after successful response
    const cacheKey = `${response.config.method}:${response.config.url}`
    setTimeout(() => requestCache.delete(cacheKey), cacheTimeout)
    return response
  },
  (error) => {
    // Clear cache on error
    if (error.config) {
      const cacheKey = `${error.config.method}:${error.config.url}`
      requestCache.delete(cacheKey)
    }
    return Promise.reject(error)
  }
)

// Deduplicate concurrent requests
const deduplicateRequest = async <T,>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  if (requestCache.has(key)) {
    return requestCache.get(key)!
  }
  
  const promise = requestFn()
  requestCache.set(key, promise)
  
  try {
    const result = await promise
    return result
  } finally {
    // Clear after a short delay
    setTimeout(() => requestCache.delete(key), cacheTimeout)
  }
}

export interface Goal {
  id?: string
  email: string
  username?: string
  date: string
  goal: string
  priority: 'High' | 'Medium' | 'Low'
  timeEstimate?: string
  status?: 'Completed' | 'Partially Completed' | 'Not Completed'
  reflection?: string
  blockers?: string
}

export interface UserProfile {
  email: string
  username: string
  firstName?: string
  lastName?: string
  phase?: number
  role?: 'student' | 'teacher'
  updatedAt?: string
}

export interface WeeklyReport {
  totalGoals: number
  completed: number
  partiallyCompleted: number
  notCompleted: number
  completedPercentage: number
  partialPercentage: number
  missedPercentage: number
  aiInsights: string
  recommendations: string[]
}

export const goalApi = {
  addGoal: async (goal: Goal) => {
    const response = await api.post('/goals', goal)
    return response.data
  },

  getGoals: async (date?: string) => {
    const cacheKey = `GET:/goals?date=${date || 'all'}`
    return deduplicateRequest(cacheKey, async () => {
      const params = date ? { date } : {}
      const response = await api.get('/goals', { params })
      return response.data
    })
  },

  updateGoal: async (id: string, updates: Partial<Goal>) => {
    const response = await api.patch(`/goals/${id}`, updates)
    return response.data
  },

  getWeeklyReport: async (options?: { save?: boolean }) => {
    const save = options?.save === true
    const cacheKey = `GET:/weekly-report?save=${save}`
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<WeeklyReport>('/weekly-report', { params: { save } })
      return response.data
    })
  },

  getProfile: async () => {
    const cacheKey = 'GET:/profile'
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<UserProfile>('/profile')
      return response.data
    })
  },
}

export const profileApi = {
  saveProfile: async (profile: Partial<UserProfile> & { username: string }) => {
    const response = await api.post<UserProfile>('/profile', profile)
    return response.data
  },
  getProfile: async () => {
    const cacheKey = 'GET:/profile'
    return deduplicateRequest(cacheKey, async () => {
      const response = await api.get<UserProfile>('/profile')
      return response.data
    })
  },
}

export default api
