'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useToast } from '@/contexts/ToastContext'
import styles from './FavoriteButton.module.css'

export default function FavoriteButton({ entityType, entityId, className = '' }) {
  const { user, isFavorite, toggleFavorite } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const favorite = isFavorite(entityType, entityId)

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      openAuthModal({ entityType, entityId })
      return
    }
    setLoading(true)
    try {
      const added = await toggleFavorite(entityType, entityId)
      if (added) {
        showToast('Добавлено в избранное')
      } else {
        showToast('Убрано из избранного')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  if (!entityId) return null

  return (
    <div className={`${styles.wrap} ${className}`}>
      <button
        type="button"
        className={styles.btn}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={loading}
        aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        title={favorite ? 'Удалить из избранного' : 'В избранное'}
      >
        {favorite ? (
          <svg className={styles.heartFilled} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          <svg className={styles.heartOutline} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}
      </button>
    </div>
  )
}
