

import styles from './ServiceCard.module.css'
import AppImage from '@/components/ui/AppImage'
import { formatRating, formatReviews, hasRating } from '@/utils/rating'

export default function ServiceCard({ img, name, rating = '—', reviewsCount = 0, isVerified = false }) {
  const hasReviews = (reviewsCount ?? 0) > 0
  const showRating = hasRating(rating)
  const displayRating = showRating ? formatRating(rating) : null

  return (
    <div className={styles.card}>
      <div className={styles.img}><AppImage src={img} alt={name || ''} /></div>
      <div className={styles.topLine}>
        {isVerified && (
          <div className={styles.verification}><img src="/verification.png" alt="" /></div>
        )}
        <div className={styles.like}><img src="/like.png" alt="" /></div>
      </div>
      <div className={styles.info}>
        <div className={styles.rating}>
          {showRating ? (
            <div className={styles.stars}><img src="/star.png" alt="" />{displayRating}</div>
          ) : (
            <div className={styles.stars} style={{ visibility: 'hidden' }} aria-hidden="true">&nbsp;</div>
          )}
          {hasReviews ? (
            <div className={styles.feedback}>{formatReviews(reviewsCount)}</div>
          ) : (
            <div className={styles.feedback} style={{ visibility: 'hidden' }} aria-hidden="true">&nbsp;</div>
          )}
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </div>
  )
}
