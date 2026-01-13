'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { profileApi } from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Logged in successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        toast.error('Email/password sign-in is disabled in Firebase. Enable it in Authentication > Sign-in method.')
      } else if (error?.code === 'auth/user-not-found') {
        toast.error('No user found with this email')
      } else if (error?.code === 'auth/wrong-password') {
        toast.error('Incorrect password')
      } else {
        toast.error(error.message || 'Failed to log in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      // Ensure profile exists/created on backend for new Google users
      try { await profileApi.getProfile() } catch {}
      toast.success('Logged in with Google!')
      router.push('/dashboard')
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        toast.error('Google sign-in is disabled in Firebase. Enable Google provider in Authentication > Sign-in method and add your domain in Authorized domains.')
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast.error('Popup closed before completing sign-in')
      } else if (error?.code === 'auth/popup-blocked') {
        toast.error('Popup blocked by the browser. Allow popups for this site.')
      } else {
        toast.error(error.message || 'Google sign-in failed')
      }
    } finally {
      setGLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to track your daily goals</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={gLoading}
          className="w-full border border-gray-300 bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path fill="#EA4335" d="M24 9.5c3.61 0 6.85 1.24 9.41 3.3l7.09-7.09C36.67 1.9 30.72 0 24 0 14.62 0 6.41 5.36 2.6 13.15l8.63 6.69C13.33 13.98 18.2 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24c0-1.62-.15-3.18-.43-4.68H24v9.1h12.7c-.55 2.97-2.22 5.48-4.73 7.19l7.26 5.63C43.95 37.27 46.5 31.07 46.5 24z"/>
            <path fill="#FBBC05" d="M11.23 19.84l-8.63-6.69C1.04 15.76 0 19.74 0 24c0 4.22 1.02 8.17 2.82 11.7l8.74-6.78C10.7 26.82 10.3 25.45 10.3 24c0-1.5.36-2.93.93-4.16z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.81l-7.26-5.63c-2.02 1.39-4.62 2.2-8.65 2.2-6.06 0-11.2-4.08-13.05-9.6l-8.74 6.78C6.42 42.64 14.63 48 24 48z"/>
          </svg>
          {gLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
