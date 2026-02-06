'use client'

import { motion } from 'framer-motion'
import styles from './PlaceBlock.module.css'

function formatRating(value) {
  if (value == null || value === '' || value === '—') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return num % 1 === 0 ? String(num) : num.toFixed(1)
}

export default function PlaceBlock({ img, place, title, desc, rating, feedback, reviewsCount = 0, width = '330px', onClick }) {
  const hasReviews = (reviewsCount ?? 0) > 0
  const displayRating = hasReviews ? formatRating(rating) : null

  return (
    <div
      className={styles.place}
      style={{ width: `${width} !important` }}
      onClick={onClick}
    >
      <div className={styles.img}>
        <img src={img} alt="" />
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
            <div className={styles.descText}>
              {desc}
            </div>
            <div className={styles.readMore}>
              <img src="/readMore.png" alt="" />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.text_hide}></div>
    </div>
  )
}
