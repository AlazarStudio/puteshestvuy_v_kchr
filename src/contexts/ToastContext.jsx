'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import styles from './ToastContext.module.css'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const TOAST_DURATION_MS = 2500

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div key={toast.id} className={styles.toast} role="status">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
