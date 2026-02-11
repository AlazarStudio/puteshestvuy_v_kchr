'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import RouteConstructorButton from '@/components/RouteConstructorButton/RouteConstructorButton'
import styles from './PlaceBlock.module.css'

function formatRating(value) {
  if (value == null || value === '' || value === '—') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return num % 1 === 0 ? String(num) : num.toFixed(1)
}

export default function PlaceBlock({ img, place, title, desc, rating, feedback, reviewsCount = 0, width = '330px', onClick, placeId, maxOffset = 5, scale = 1.03 }) {
  const hasReviews = (reviewsCount ?? 0) > 0
  const displayRating = hasReviews ? formatRating(rating) : null

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

  return (
    <div
      className={styles.placeWrap}
      style={{ width: `${width} !important` }}
    >
      {placeId && (
        <div className={styles.favoriteWrap} onClick={(e) => e.stopPropagation()}>
          <RouteConstructorButton placeId={placeId} />
          <FavoriteButton entityType="place" entityId={placeId} />
        </div>
      )}
      <div
        ref={cardRef}
        className={styles.place}
        style={{ width: '100%' }}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      <div className={styles.img}>
        <motion.img 
          src={img || '/placeholder.jpg'} 
          alt="" 
          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.jpg' }}
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
      <div className={styles.info}>
        <div className={styles.ratingFeedback}>
          {hasReviews ? (
            <>
              <div className={styles.rating}>
                <img src="/star.png" alt="" />
                {displayRating}
              </div>
              <div className={styles.feedback}>{feedback}</div>
            </>
          ) : (
            <>
              <div className={styles.rating} style={{ visibility: 'hidden' }} aria-hidden="true">&nbsp;</div>
              <div className={styles.feedback} style={{ visibility: 'hidden' }} aria-hidden="true">&nbsp;</div>
            </>
          )}
        </div>
        <div className={styles.text}>
          <div className={styles.placeName}>{place}</div>
          <div className={styles.title}>{title}</div>
          <div className={styles.desc}>
            <div className={styles.descText} dangerouslySetInnerHTML={{ __html: desc || '' }} />
            <div className={styles.readMore}>
              <img src="/readMore.png" alt="" />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.text_hide}></div>
    </div>
    </div>
  )
}
