import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useToast } from '@/contexts/ToastContext'
import styles from './VisitedButton.module.css'

// Маршрут «проходят», место «посещают» — тексты различаются по типу,
// как и подписи групп в личном кабинете
const LABELS = {
  route: {
    on: 'Отмечено как пройденное',
    off: 'Отметить как пройденное',
    added: 'Отмечено как пройденное',
    removed: 'Отметка о прохождении снята',
  },
  place: {
    on: 'Отмечено как посещённое',
    off: 'Отметить как посещённое',
    added: 'Отмечено как посещённое',
    removed: 'Отметка о посещении снята',
  },
}

export default function VisitedButton({ entityType, entityId, className = '' }) {
  const { user, isVisited, toggleVisited } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const labels = LABELS[entityType] || LABELS.place
  const visited = isVisited(entityType, entityId)

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      openAuthModal({ entityType, entityId })
      return
    }
    setLoading(true)
    try {
      const added = await toggleVisited(entityType, entityId)
      if (added === null) return
      showToast(added ? labels.added : labels.removed)
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
        aria-label={visited ? labels.on : labels.off}
        title={visited ? labels.on : labels.off}
      >
        {visited ? (
          <svg className={styles.markFilled} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.6l-4-4 1.4-1.4 2.6 2.6 5.4-5.4 1.4 1.4-6.8 6.8z" />
          </svg>
        ) : (
          <svg className={styles.markOutline} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
          </svg>
        )}
      </button>
    </div>
  )
}
