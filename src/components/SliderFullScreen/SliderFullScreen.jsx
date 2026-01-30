'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './SliderFullScreen.module.css'
import { publicPlacesAPI, getImageUrl } from '@/lib/api'
import RichTextContent from '@/components/RichTextContent/RichTextContent'

const SLIDER_LIMIT = 6
const TIME_RUNNING = 500

function placeToSlide(place) {
  const description = place.shortDescription || place.description || ''
  return {
    id: place.id,
    slug: place.slug,
    image: getImageUrl(place.image),
    place: place.location || '',
    title: place.title || '',
    rating: place.rating != null && place.rating !== '' ? String(place.rating) : '—',
    description,
  }
}

export default function SliderFullScreen() {
  const [slides, setSlides] = useState([])
  const initialSlidesRef = useRef([])
  const [isLoading, setIsLoading] = useState(true)
  const [direction, setDirection] = useState(null)

  useEffect(() => {
    let cancelled = false
    publicPlacesAPI.getAll({ limit: SLIDER_LIMIT })
      .then((res) => {
        if (cancelled) return
        const items = res.data?.items || res.data || []
        const list = items.map(placeToSlide)
        if (list.length > 0) {
          setSlides(list)
          initialSlidesRef.current = list
        }
      })
      .catch(() => {
        if (!cancelled) setSlides([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleNext = () => {
    setSlides((prev) => {
      const [first, ...rest] = prev
      return [...rest, first]
    })
    setDirection('next')
  }

  const handlePrev = () => {
    setSlides((prev) => {
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, prev.length - 1)
      return [last, ...rest]
    })
    setDirection('prev')
  }

  // Сбрасываем направление через TIME_RUNNING, чтобы анимационный класс убирался
  useEffect(() => {
    if (!direction) return
    const timeout = setTimeout(() => setDirection(null), TIME_RUNNING)
    return () => clearTimeout(timeout)
  }, [direction])

  // Отдельный список для thumbnail:
  // первый элемент основного списка показываем в конце,
  // чтобы в превью порядок был: [2, 3, 4, 1]
  const thumbnailSlides =
    slides.length > 0 ? [...slides.slice(1), slides[0]] : []

  const carouselClassNames = [
    styles.carousel,
    direction === 'next' ? styles.next : '',
    direction === 'prev' ? styles.prev : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Номер текущего слайда (первый в массиве slides) по исходному списку
  const initialList = initialSlidesRef.current
  const currentSlideIndex = initialList.findIndex((s) => s.id === slides[0]?.id)
  const currentSlideNumber = currentSlideIndex >= 0 ? currentSlideIndex + 1 : 1
  const formattedSlideNumber = String(currentSlideNumber).padStart(2, '0')

  const placeHref = (slide) => `/places/${slide.slug || slide.id}`

  if (isLoading) {
    return (
      <section className={styles.carousel}>
        <div className={styles.list}>
          <div className={styles.item}>
            <div className={styles.image} />
            <div className={styles.content}>
              <div className={styles.place} />
              <div className={styles.title} style={{ width: '60%', height: '2rem', background: 'rgba(255,255,255,0.2)', borderRadius: 4 }} />
              <div className={styles.des} style={{ width: '80%', height: '4rem', background: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: 12 }} />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (slides.length === 0) {
    return (
      <section className={styles.carousel}>
        <div className={styles.list}>
          <div className={styles.item}>
            <div className={styles.image} />
            <div className={styles.content}>
              <div className={styles.title}>Интересные места не найдены</div>
              <div className={styles.des}>Попробуйте обновить страницу позже.</div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={carouselClassNames}>
      {/* Основной список */}
      <div className={styles.list}>
        {slides.map((slide) => (
          <div key={slide.id} className={styles.item}>
            <div className={styles.image}>
              <img src={slide.image} alt={slide.title} />
            </div>
            <div className={styles.content}>
              <div className={styles.place}><img src="/place.png" alt="" />{slide.place}</div>
              <div className={styles.title}>{slide.title}</div>
              <div className={styles.topic}>
                <div className={styles.stars}>
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                </div>
                <div className={styles.rating}>
                  {slide.rating}
                </div>
              </div>
              <div className={styles.des}>
                {slide.description ? (
                  <RichTextContent html={slide.description} />
                ) : (
                  'Интересное место в Карачаево-Черкесии.'
                )}
              </div>
              <div className={styles.buttons}>
                <Link href={placeHref(slide)} className={styles.ctaLink}>
                  Начать путешествие
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Превью (thumbnail) */}
      <div className={styles.thumbnail}>
        {thumbnailSlides.map((slide) => (
          <Link href={placeHref(slide)} key={slide.id} className={styles.item}>
            <img src={slide.image} alt={slide.title} />
            <div className={styles.content}>
              <div className={styles.place}><img src="/place.png" alt="" />{slide.place}</div>
              <div className={styles.title}>{slide.title}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Кнопки навигации */}
      <div className={styles.arrows}>
        <div className={styles.buttons}>
          <button onClick={handlePrev}>
            <img src="/slider-arrow-left.png" alt="Prev slide" />
          </button>
          <button onClick={handleNext}>
            <img src="/slider-arrow-right.png" alt="Next slide" />
          </button>
        </div>
        <div className={styles.line}>
          <div className={styles.time}></div>
        </div>
        <div className={styles.slidesNum}>{formattedSlideNumber}</div>
      </div>

      {/* Полоса времени/анимация — можно анимировать через CSS по классу .next/.prev */}

    </section>
  )
}
