'use client'

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import { getImageUrl } from '@/lib/api'

export default function ServiceCardWithParallax({ 
  service, 
  serviceUrl, 
  isArticle = false,
  styles,
  maxOffset = 10,
  scale = 1.03
}) {
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  const xSpring = useSpring(x, { stiffness: 160, damping: 18, mass: 0.5 })
  const ySpring = useSpring(y, { stiffness: 160, damping: 18, mass: 0.5 })
  const scaleSpring = useSpring(scaleValue, { stiffness: 100, damping: 25, mass: 1 })

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const dx = px - 0.5
    const dy = py - 0.5

    x.set(dx * maxOffset)
    y.set(dy * maxOffset)
  }

  const handleMouseEnter = () => {
    scaleValue.set(scale)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    scaleValue.set(1)
  }

  const hasReviews = !isArticle && (service.reviewsCount ?? 0) > 0
  const displayRating = hasReviews && service.rating != null && service.rating !== '' 
    ? (Number(service.rating) % 1 === 0 ? String(service.rating) : Number(service.rating).toFixed(1))
    : null

  const formatReviews = (n) => {
    if (n === 1) return '1 отзыв'
    if (n >= 2 && n <= 4) return `${n} отзыва`
    return `${n} отзывов`
  }

  return (
    <Link
      ref={cardRef}
      to={serviceUrl}
      className={styles.serviceCard}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.serviceCardImg}>
        <motion.img
          src={getImageUrl(service.image || service.images?.[0]) || '/serviceImg1.png'}
          alt={service.title}
          style={{ 
            x: xSpring, 
            y: ySpring,
            scale: scaleSpring,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      {!isArticle && (
        <div className={styles.serviceCardTopLine} data-no-navigate onClick={(e) => e.preventDefault()}>
          <div className={styles.serviceCardLike}>
            <FavoriteButton entityType="service" entityId={service.id} />
          </div>
        </div>
      )}
      <div className={styles.serviceCardInfo}>
        <div className={styles.serviceCardCategory}>{service.category || 'Услуга'}</div>
        {hasReviews && (
          <div className={styles.serviceCardRating}>
            <div className={styles.serviceCardStars}>
              <img src="/star.png" alt="" />
              {displayRating}
            </div>
            <div className={styles.serviceCardFeedback}>
              {formatReviews(service.reviewsCount ?? 0)}
            </div>
          </div>
        )}
        <div className={styles.serviceCardName}>{service.title}</div>
      </div>
    </Link>
  )
}
