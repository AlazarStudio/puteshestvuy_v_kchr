'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal/AuthModal'

const AuthModalContext = createContext(null)

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}

export function AuthModalProvider({ children }) {
  const { toggleFavorite } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingFavorite, setPendingFavorite] = useState(null)

  const openAuthModal = useCallback((payload) => {
    setPendingFavorite(payload || null)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    setPendingFavorite(null)
  }, [])

  const handleSuccess = useCallback(() => {
    if (pendingFavorite?.entityType && pendingFavorite?.entityId) {
      toggleFavorite(pendingFavorite.entityType, pendingFavorite.entityId).catch(() => {})
    }
    closeAuthModal()
  }, [pendingFavorite, toggleFavorite, closeAuthModal])

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeAuthModal}
        onSuccess={handleSuccess}
      />
    </AuthModalContext.Provider>
  )
}
