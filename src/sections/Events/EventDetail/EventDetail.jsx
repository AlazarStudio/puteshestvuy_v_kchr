import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import EventBlocks from '@/components/EventBlocks/EventBlocks'
import YandexMapPlace from '@/components/YandexMapPlace'
import Seo from '@/components/Seo/Seo'
import { breadcrumbList } from '@/lib/seo/schema'
import { absoluteUrl, truncate } from '@/lib/seo/config'
import { publicEventsAPI, getImageUrl } from '@/lib/api'
import { formatEventDate } from '@/utils/eventDate'
import styles from './EventDetail.module.css'

const BreadcrumbArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function EventDetail({ slug }) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [slug])

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await publicEventsAPI.getByIdOrSlug(slug)
        if (cancelled) return
        setEvent(data)
      } catch (err) {
        // Прошедшее и неактивное событие бэкенд отдаёт как 404 — та же заглушка,
        // что и у несуществующего
        if (!cancelled) {
          setError(err.response?.status === 404 ? 'Событие не найдено' : 'Ошибка загрузки')
          setEvent(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <main className={styles.main}>
        <Seo noindex title="Событие — Путешествуй КЧР" />
        <div className={styles.content}>
          <CenterBlock>
            <div className={styles.loading}>Загрузка...</div>
          </CenterBlock>
        </div>
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className={styles.main}>
        <Seo noindex title="Событие — Путешествуй КЧР" />
        <div className={styles.content}>
          <CenterBlock>
            <div className={styles.error}>{error || 'Событие не найдено'}</div>
            <Link to="/events" className={styles.backLink}>← Вернуться к афише</Link>
          </CenterBlock>
        </div>
      </main>
    )
  }

  const date = formatEventDate(event.startAt, event.endAt)
  const hasCoords =
    event.latitude != null && event.longitude != null && Number(event.latitude) && Number(event.longitude)
  const seoDesc = truncate(event.shortDescription || [date, event.location].filter(Boolean).join(', ') || event.title, 160)

  const meta = [
    date,
    event.location,
    event.price,
    event.organizer ? `Организатор: ${event.organizer}` : '',
  ].filter(Boolean)

  return (
    <main className={styles.main}>
      <Seo
        title={`${event.title} — афиша событий КЧР`}
        description={seoDesc}
        path={`/events/${event.slug}`}
        type="article"
        image={event.image ? getImageUrl(event.image) : undefined}
        jsonLd={[
          breadcrumbList([
            { name: 'Главная', url: absoluteUrl('/') },
            { name: 'Афиша событий', url: absoluteUrl('/events') },
            { name: event.title, url: absoluteUrl(`/events/${event.slug}`) },
          ]),
        ]}
      />

      <div className={styles.content}>
        <CenterBlock>
          <div className={styles.breadCrumbs}>
            <Link to="/">Главная</Link>
            <BreadcrumbArrow />
            <Link to="/events">Афиша событий</Link>
            <BreadcrumbArrow />
            <span>{event.title}</span>
          </div>

          <article className={styles.article}>
            {event.image && (
              <div className={styles.cover}>
                <img src={getImageUrl(event.image)} alt={event.title} />
              </div>
            )}

            <h1 className={styles.title}>{event.title}</h1>

            {meta.length > 0 && (
              <div className={styles.meta}>
                {meta.map((item, i) => (
                  <span key={i} className={styles.metaItem}>{item}</span>
                ))}
              </div>
            )}

            {event.registrationUrl && (
              <a
                className={styles.registerBtn}
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Зарегистрироваться
              </a>
            )}

            <EventBlocks blocks={event.blocks || []} poster={event.image} />

            {hasCoords && (
              <section className={styles.mapSection}>
                <h2 className={styles.sectionTitle}>Как добраться</h2>
                <YandexMapPlace
                  latitude={event.latitude}
                  longitude={event.longitude}
                  title={event.title}
                  location={event.location}
                  image={event.image}
                />
              </section>
            )}

            {event.place && (
              <section className={styles.placeSection}>
                <h2 className={styles.sectionTitle}>Событие проходит здесь</h2>
                <Link to={`/places/${event.place.slug || event.place.id}`} className={styles.placeCard}>
                  {event.place.image && (
                    <div className={styles.placeImage}>
                      <img src={getImageUrl(event.place.image)} alt={event.place.title} />
                    </div>
                  )}
                  <div className={styles.placeInfo}>
                    <div className={styles.placeTitle}>{event.place.title}</div>
                    {event.place.location && (
                      <div className={styles.placeLocation}>{event.place.location}</div>
                    )}
                  </div>
                </Link>
              </section>
            )}
          </article>
        </CenterBlock>
      </div>
    </main>
  )
}
