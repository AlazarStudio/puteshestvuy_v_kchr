'use client'

import styles from './ServiceCard.module.css'

function formatReviews(n) {
  if (n === 1) return '1 отзыв'
  if (n >= 2 && n <= 4) return `${n} отзыва`
  return `${n} отзывов`
}

export default function ServiceCard({ img, name, rating = '—', reviewsCount = 0, isVerified = false }) {
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
          <div className={styles.stars}><img src="/star.png" alt="" />{rating}</div>
          <div className={styles.feedback}>{formatReviews(reviewsCount)}</div>
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </div>
  )
}
