'use client'

import { useNavigate } from 'react-router-dom'
import styles from './RouteBlock.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation, Autoplay } from 'swiper/modules'
import { Link } from 'react-router-dom'
import { getImageUrl } from '@/lib/api'
import { generateSlug } from '@/utils/transliterate'

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function RouteBlock({ route: routeProp, title: titleProp }) {
  const route = routeProp || (titleProp ? { title: titleProp, slug: generateSlug(titleProp) } : null)
  if (!route) return null

  const navigate = useNavigate()
  const slug = route.slug || (route.title ? generateSlug(route.title) : route.id)
  const title = route.title || ''
  const imageUrl = getImageUrl(route.images?.[0])
  const shortDesc = route.shortDescription || ''
  const duration = route.duration ?? ''
  const distance = route.distance != null && route.distance !== '' ? `${route.distance} км` : ''
  const difficulty = route.difficulty != null ? String(route.difficulty) : ''
  const places = Array.isArray(route.places) ? route.places : []

  const slides = route.images?.length > 0
    ? route.images.map((src, i) => (
        <SwiperSlide key={i}>
          <div className={styles.routeSlide}>
            <img src={getImageUrl(src)} alt={title} />
          </div>
        </SwiperSlide>
      ))
    : [
        <SwiperSlide key={0}>
          <div className={styles.routeSlide}>
            <img src={imageUrl || '/routeSlide1.png'} alt={title} />
          </div>
        </SwiperSlide>,
      ]

  const handleCardClick = (e) => {
    if (e.target.closest('[data-no-navigate]') || e.target.closest('a')) return
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('navigate-start'))
    navigate(`/routes/${slug}`)
  }

  return (
    <div
      className={styles.route}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!e.target.closest('a')) {
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('navigate-start'))
            navigate(`/routes/${slug}`)
          }
        }
      }}
    >
      <div className={styles.routeSlider} data-no-navigate>
        <Swiper
          navigation={true}
          loop={slides.length > 1}
          autoplay={slides.length > 1 ? { delay: getRandomInt(10000, 15000), disableOnInteraction: false } : false}
          modules={[Navigation, Autoplay]}
          className="routeSlider"
        >
          {slides}
        </Swiper>
      </div>

      <div className={styles.routeInfo}>
        <div className={styles.params}>
          <div className={styles.routeTags}>
            <div className={styles.tag} title="Время в пути">
              <img src="/routeTagTime.png" alt="" aria-hidden />
              <div className={styles.typeText}>{duration || '—'}</div>
            </div>
            {distance && (
              <div className={styles.tag}>
                <img src="/routeTagLength.png" alt="" />
                <div className={styles.typeText}>{distance}</div>
              </div>
            )}
          </div>
          {difficulty && (
            <div className={styles.tag}>
              <div className={styles.typeLight}></div>
              <div className={styles.typeText}>Сложность {difficulty}</div>
              <span
                className={styles.tooltipWrap}
                onClick={(e) => e.preventDefault()}
                onMouseDown={(e) => e.stopPropagation()}
                role="img"
                aria-label="Пояснение уровней сложности"
              >
                <span className={styles.typeQuestion}>?</span>
                <div className={styles.tooltipBlock}>
                  <div className={styles.tooltipTitle}>Уровни сложности</div>
                  <div className={styles.tooltipList}>
                    <span>1 — лёгкий</span>
                    <span>2 — простой</span>
                    <span>3 — средний</span>
                    <span>4 — сложный</span>
                    <span>5 — очень сложный</span>
                  </div>
                </div>
              </span>
            </div>
          )}
        </div>
        <div className={styles.title}>{title}</div>
        {shortDesc && (
          <div className={styles.desc} dangerouslySetInnerHTML={{ __html: shortDesc }} />
        )}
        {places.length > 0 && (
          <div className={styles.routePlaces}>
            <div className={styles.title}>Маршрут:</div>
            <div className={styles.places}>
              {places.map((place, i) => (
                <span key={place.id}>
                  {i > 0 && ' → '}
                  <Link to={`/places/${place.slug}`} className={styles.placeLink} onClick={(e) => e.stopPropagation()}>
                    {place.title}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
