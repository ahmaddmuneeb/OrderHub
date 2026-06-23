import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { StoreCredentials } from '../types'

const app = initializeApp({
  apiKey: 'AIzaSyAXDnTXh0r3SJ4UyU-wGlJmuXnA1jbGaao',
  authDomain: 'dashboard-41215.firebaseapp.com',
  projectId: 'dashboard-41215',
  storageBucket: 'dashboard-41215.firebasestorage.app',
  messagingSenderId: '841155459822',
  appId: '1:841155459822:web:7e688e27898bca397751ff',
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export const firebaseConfigured = true

async function apiFetch(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'API error')
  }
  return res.json()
}

export const callUpdateOrderStatus = (data: {
  platformOrderId: string
  platform: string
  status: string
  credentials: StoreCredentials
}) => apiFetch('/api/update-order-status', data)
