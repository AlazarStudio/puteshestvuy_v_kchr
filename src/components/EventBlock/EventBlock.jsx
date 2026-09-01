import { Link } from 'react-router-dom'
import AppImage from '@/components/ui/AppImage'
import { formatEventDateShort } from '@/utils/eventDate'
import styles from './EventBlock.module.css'

export default function EventBlock({ event }) {
  if (!event) return null
  const date = formatEventDateShort(event.startAt, event.endAt)

  return (
    <Link to={`/events/${event.slug}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {event.image && <AppImage src={event.image} alt={event.title} />}
        {event.category && <span className={styles.category}>{event.category}</span>}
      </div>
      <div className={styles.body}>
        {date && <div className={styles.date}>{date}</div>}
        <div className={styles.title}>{event.title}</div>
        {event.location && (
          <div className={styles.location}>
            <img src="/place_black.png" alt="" />
            {event.location}
          </div>
        )}
      </div>
    </Link>
  )
}
