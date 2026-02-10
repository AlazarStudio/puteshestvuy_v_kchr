'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useRouteConstructor } from '@/contexts/RouteConstructorContext'
import { useToast } from '@/contexts/ToastContext'
import styles from './RouteConstructorButton.module.css'

export default function RouteConstructorButton({ placeId, place, className = '' }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { addPlace, removePlace, isInConstructor } = useRouteConstructor()
  const { showToast } = useToast()

  const active = placeId ? isInConstructor(placeId) : false

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      openAuthModal({ entityType: 'place', entityId: placeId })
      return
    }
    if (active) {
      removePlace(placeId)
      showToast('Убрано из конструктора')
    } else {
      const toAdd = place || { id: placeId }
      addPlace(toAdd)
      showToast('Добавлено в конструктор')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  if (!placeId) return null

  return (
    <div className={`${styles.wrap} ${className}`}>
      <button
        type="button"
        className={`${styles.btn}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={active ? 'Убрать из конструктора маршрутов' : 'Добавить в конструктор маршрутов'}
        title={active ? 'В конструкторе' : 'В конструктор маршрутов'}
      >
        <img
          src={active ? '/konst_tours_added.png' : '/konst_tours.png'}
          alt=""
          className={styles.icon}
          width={20}
          height={21}
          aria-hidden
        />
      </button>
    </div>
  )
}
