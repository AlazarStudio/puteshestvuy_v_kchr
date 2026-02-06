'use client'

import styles from './ServiceCard.module.css'

function formatReviews(n) {
  if (n === 1) return '1 отзыв'
  if (n >= 2 && n <= 4) return `${n} отзыва`
  return `${n} отзывов`
}

function formatRating(value) {
  if (value == null || value === '' || value === '—') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return num % 1 === 0 ? String(num) : num.toFixed(1)
}

export default function ServiceCard({ img, name, rating = '—', reviewsCount = 0, isVerified = false }) {
  const hasReviews = (reviewsCount ?? 0) > 0
  const displayRating = hasReviews ? formatRating(rating) : null

  return (
    <div className={styles.card}>
      <div className={styles.img}><img src={img} alt="" /></div>
      <div className={styles.topLine}>
        {isVerified && (
          <div className={styles.verification}><img src="/verification.png" alt="" /></div>
        )}
        <div className={styles.like}><img src="/like.png" alt="" /></div>
      </div>
      <div className={styles.info}>
        <div className={styles.rating}>
          {hasReviews ? (
            <>
              <div className={styles.stars}><img src="/star.png" alt="" />{displayRating}</div>
              <div className={styles.feedback}>{formatReviews(reviewsCount)}</div>
            </>
          ) : (
            <>
              <div className={styles.stars} style={{ visibility: 'hidden' }} aria-hidden="true">&nbsp;</div>
              <div className={styles.feedback} style={{ visibility: 'hidden' }} aria-hidden="true">&nbsp;</div>
            </>
          )}
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </div>
  )
}
