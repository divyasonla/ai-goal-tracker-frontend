import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
}

// Initialize Firebase (with demo config if needed)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

export { app, auth }
// const firebaseConfig = {
//   apiKey: "AIzaSyAT_C2RWkbJRYFtVJt5rapb4pK--Mfcspk",
//   authDomain: "ai-goal-tracker-feaa6.firebaseapp.com",
//   projectId: "ai-goal-tracker-feaa6",
//   storageBucket: "ai-goal-tracker-feaa6.firebasestorage.app",
//   messagingSenderId: "89026348032",
//   appId: "1:89026348032:web:4663ac0a499cc36f5c84e5",
//   measurementId: "G-N22T3D16XB"
// };