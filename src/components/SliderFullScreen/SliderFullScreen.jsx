

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import styles from './SliderFullScreen.module.css'
import { publicPlacesAPI, publicHomeAPI, getImageUrl } from '@/lib/api'
import RichTextContent from '@/components/RichTextContent/RichTextContent'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import RouteConstructorButton from '@/components/RouteConstructorButton/RouteConstructorButton'

const SLIDER_LIMIT = 6
const TIME_RUNNING = 500
const IMAGE_DELAY_MS = 2000
const FADE_DURATION_MS = 400
const VIDEO_READY_DELAY_MS = 1000

function ThumbnailItem({ slide, placeHref, styles, maxOffset = 10, scale = 1.02 }) {
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  const xSpring = useSpring(x, { stiffness: 160, damping: 18, mass: 0.5 })
  const ySpring = useSpring(y, { stiffness: 160, damping: 18, mass: 0.5 })
  const scaleSpring = useSpring(scaleValue, { stiffness: 80, damping: 25, mass: 1 })

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
    <Link
      ref={cardRef}
      to={placeHref(slide)}
      className={styles.link}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <motion.img
          src={slide.image}
          alt={slide.title}
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
      <div className={styles.content}>
        <div className={styles.place}><img src="/place.png" alt="" />{slide.place}</div>
        <div className={styles.title}>{slide.title}</div>
      </div>
    </Link>
  )
}

function makeIntroSlide(bgImage = '/mountainBG.png') {
  return {
    id: 'intro',
    isIntro: true,
    image: bgImage,
    video: null,
    place: 'Путешествие по Карачаево-Черкесии начинается здесь',
    title: 'Карачаево-Черкесская Республика',
    description: 'Удивительные места, захватывающие маршруты и яркие точки притяжения региона.',
    rating: null,
    reviewsCount: 0,
  }
}

function placeToSlide(place) {
  const description = place.shortDescription || place.description || ''
  const mainImage = place.images?.[0] ?? place.image
  const sliderVideo = place.sliderVideo || null
  const reviewsCount = place.reviewsCount ?? 0
  const hasReviews = reviewsCount > 0
  const rating = hasReviews && place.rating != null && place.rating !== ''
    ? (Number(place.rating) % 1 === 0 ? String(place.rating) : Number(place.rating).toFixed(1))
    : null
  return {
    id: place.id,
    slug: place.slug,
    image: getImageUrl(mainImage),
    video: sliderVideo ? getImageUrl(sliderVideo) : null,
    place: place.location || '',
    title: place.title || '',
    rating,
    reviewsCount,
    description,
  }
}

export default function SliderFullScreen({
  thumbnailMaxOffset = 5,
  thumbnailScale = 1.03,
  sliderPlacesOverride = null,
  introSlideOverride = null,
  scrollTargetId = 'firstTime',
}) {
  const [slides, setSlides] = useState([])
  const initialSlidesRef = useRef([])
  const [isLoading, setIsLoading] = useState(true)
  const [direction, setDirection] = useState(null)
  const [showVideoOnCurrentSlide, setShowVideoOnCurrentSlide] = useState(false)
  const [currentSlideVideoLoaded, setCurrentSlideVideoLoaded] = useState(false)
  const [outgoingVideoVisible, setOutgoingVideoVisible] = useState(true)
  const outgoingWasShowingVideoRef = useRef(false)
  const currentSlideIdRef = useRef(slides[0]?.id)
  currentSlideIdRef.current = slides[0]?.id

  const currentSlideHasVideo = slides[0]?.video
  const outgoingSlideHasVideo =
    (direction === 'prev' && slides[1]?.video) ||
    (direction === 'next' && slides[slides.length - 1]?.video)

  const resolveSliderPlaces = (sliderPlaces, introSlide, cancelled, setLoadingFalse) => {
    const placeIds = sliderPlaces.map(p => p.placeId || p.id).filter(Boolean)
    if (placeIds.length === 0) {
      setSlides([introSlide])
      initialSlidesRef.current = [introSlide]
      setLoadingFalse()
      return
    }
    publicPlacesAPI.getAll({ limit: 500 })
      .then((res) => {
        if (cancelled.value) return
        const allPlaces = res.data?.items || res.data || []
        const placesMap = new Map(allPlaces.map(p => [p.id, p]))
        const list = sliderPlaces
          .map((savedPlace) => {
            const placeId = savedPlace.placeId || savedPlace.id
            const fullPlace = placesMap.get(placeId)
            if (fullPlace) return placeToSlide(fullPlace)
            const ratingValue = savedPlace.rating != null && savedPlace.rating !== '' ? Number(savedPlace.rating) : null
            const hasReviews = (savedPlace.reviewsCount ?? 0) > 0
            return {
              id: placeId,
              slug: savedPlace.slug || placeId,
              image: getImageUrl(savedPlace.image),
              video: savedPlace.sliderVideo ? getImageUrl(savedPlace.sliderVideo) : null,
              place: savedPlace.location || '',
              title: savedPlace.title || '',
              rating: hasReviews && ratingValue != null ? (ratingValue % 1 === 0 ? String(ratingValue) : ratingValue.toFixed(1)) : null,
              reviewsCount: savedPlace.reviewsCount ?? 0,
              description: savedPlace.shortDescription || '',
            }
          })
          .filter(Boolean)
        const finalSlides = list.length > 0 ? [introSlide, ...list] : [introSlide]
        setSlides(finalSlides)
        initialSlidesRef.current = finalSlides
      })
      .catch(() => {
        if (!cancelled.value) {
          setSlides([introSlide])
          initialSlidesRef.current = [introSlide]
        }
      })
      .finally(() => {
        if (!cancelled.value) setLoadingFalse()
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const cancelled = { value: false }
    setIsLoading(true)

    if (sliderPlacesOverride !== null) {
      const introSlide = introSlideOverride || makeIntroSlide()
      if (sliderPlacesOverride.length === 0) {
        setSlides([introSlide])
        initialSlidesRef.current = [introSlide]
        setIsLoading(false)
      } else {
        resolveSliderPlaces(sliderPlacesOverride, introSlide, cancelled, () => setIsLoading(false))
      }
      return () => { cancelled.value = true }
    }

    let introSlide = makeIntroSlide()

    publicHomeAPI.get()
      .then(({ data }) => {
        if (cancelled.value) return
        const bgImage = data?.backgroundImage ? getImageUrl(data.backgroundImage) : '/mountainBG.png'
        introSlide = makeIntroSlide(bgImage)
        const sliderPlaces = data?.sliderPlaces || []

        if (sliderPlaces.length > 0) {
          const placeIds = sliderPlaces.map(p => p.placeId || p.id).filter(Boolean)
          if (placeIds.length > 0) {
            return publicPlacesAPI.getAll({ limit: 500 })
              .then((res) => {
                if (cancelled.value) return
                const allPlaces = res.data?.items || res.data || []
                const placesMap = new Map(allPlaces.map(p => [p.id, p]))

                const list = sliderPlaces
                  .map((savedPlace) => {
                    const placeId = savedPlace.placeId || savedPlace.id
                    const fullPlace = placesMap.get(placeId)

                    if (fullPlace) {
                      return placeToSlide(fullPlace)
                    }

                    const ratingValue = savedPlace.rating != null && savedPlace.rating !== '' ? Number(savedPlace.rating) : null
                    const hasReviews = (savedPlace.reviewsCount ?? 0) > 0
                    return {
                      id: placeId,
                      slug: savedPlace.slug || placeId,
                      image: getImageUrl(savedPlace.image),
                      video: savedPlace.sliderVideo ? getImageUrl(savedPlace.sliderVideo) : null,
                      place: savedPlace.location || '',
                      title: savedPlace.title || '',
                      rating: hasReviews && ratingValue != null ? (ratingValue % 1 === 0 ? String(ratingValue) : ratingValue.toFixed(1)) : null,
                      reviewsCount: savedPlace.reviewsCount ?? 0,
                      description: savedPlace.shortDescription || '',
                    }
                  })
                  .filter(Boolean)

                if (list.length > 0) {
                  setSlides([introSlide, ...list])
                  initialSlidesRef.current = [introSlide, ...list]
                  setIsLoading(false)
                  return Promise.resolve()
                }
              })
          }
        }

        return publicPlacesAPI.getAll({ limit: SLIDER_LIMIT })
          .then((res) => {
            if (cancelled.value) return
            const items = res.data?.items || res.data || []
            const list = items.map(placeToSlide)
            if (list.length > 0) {
              setSlides([introSlide, ...list])
              initialSlidesRef.current = [introSlide, ...list]
            }
          })
      })
      .catch(() => {
        if (!cancelled.value) {
          publicPlacesAPI.getAll({ limit: SLIDER_LIMIT })
            .then((res) => {
              if (cancelled.value) return
              const items = res.data?.items || res.data || []
              const list = items.map(placeToSlide)
              if (list.length > 0) {
                setSlides([introSlide, ...list])
                initialSlidesRef.current = [introSlide, ...list]
              }
            })
            .catch(() => {
              if (!cancelled.value) setSlides([introSlide])
            })
            .finally(() => {
              if (!cancelled.value) setIsLoading(false)
            })
        }
      })
      .finally(() => {
        if (!cancelled.value) setIsLoading(false)
      })
    return () => { cancelled.value = true }
  }, [])

  const doPrevTransition = () => {
    setSlides((prev) => {
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, prev.length - 1)
      return [last, ...rest]
    })
    setDirection('prev')
  }

  const handleNext = () => {
    outgoingWasShowingVideoRef.current = !!(currentSlideHasVideo && showVideoOnCurrentSlide)
    if (outgoingWasShowingVideoRef.current) {
      setOutgoingVideoVisible(true)
    }
    setSlides((prev) => {
      const [first, ...rest] = prev
      return [...rest, first]
    })
    setDirection('next')
  }

  const handlePrev = () => {
    outgoingWasShowingVideoRef.current = !!(currentSlideHasVideo && showVideoOnCurrentSlide)
    if (outgoingWasShowingVideoRef.current) {
      setOutgoingVideoVisible(true)
    }
    doPrevTransition()
  }

  // Сбрасываем направление через TIME_RUNNING
  useEffect(() => {
    if (!direction) return
    const timeout = setTimeout(() => {
      setDirection(null)
      setOutgoingVideoVisible(true)
      outgoingWasShowingVideoRef.current = false
    }, TIME_RUNNING)
    return () => clearTimeout(timeout)
  }, [direction])

  // Запускаем затухание видео на уходящем слайде (только если показывали видео)
  const shouldFadeOutgoingVideo = outgoingSlideHasVideo && outgoingWasShowingVideoRef.current
  useEffect(() => {
    if (!shouldFadeOutgoingVideo || !outgoingVideoVisible) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOutgoingVideoVisible(false))
    })
    return () => cancelAnimationFrame(id)
  }, [shouldFadeOutgoingVideo, outgoingVideoVisible])

  // При смене слайда с видео: сбрасываем состояние
  const [delayPassed, setDelayPassed] = useState(false)
  useEffect(() => {
    if (!currentSlideHasVideo) {
      setShowVideoOnCurrentSlide(false)
      setCurrentSlideVideoLoaded(false)
      setDelayPassed(false)
      return
    }
    setShowVideoOnCurrentSlide(false)
    setCurrentSlideVideoLoaded(false)
    setDelayPassed(false)
    const t = setTimeout(() => setDelayPassed(true), IMAGE_DELAY_MS)
    return () => clearTimeout(t)
  }, [slides[0]?.id])

  // Показываем видео только когда прошла задержка И видео загружено
  const canShowVideo = currentSlideHasVideo && delayPassed && currentSlideVideoLoaded
  useEffect(() => {
    setShowVideoOnCurrentSlide(canShowVideo)
  }, [canShowVideo])

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

  const placeHref = (slide) => slide.isIntro ? '/' : `/places/${slide.slug || slide.id}`

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
        {slides.map((slide, index) => (
          <div key={slide.id} className={styles.item}>
            <div className={styles.image}>
              {slide.video && index === 0 ? (
                <>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={styles.mediaLayer}
                    style={{ opacity: showVideoOnCurrentSlide ? 0 : 1 }}
                  />
                  <video
                    src={slide.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className={styles.mediaLayer}
                    style={{ opacity: showVideoOnCurrentSlide ? 1 : 0 }}
                    onCanPlayThrough={() => {
                      if (currentSlideIdRef.current === slide.id) {
                        setTimeout(() => {
                          if (currentSlideIdRef.current === slide.id) setCurrentSlideVideoLoaded(true)
                        }, VIDEO_READY_DELAY_MS)
                      }
                    }}
                  />
                </>
              ) : slide.video && outgoingWasShowingVideoRef.current && ((index === 1 && direction === 'prev') || (index === slides.length - 1 && direction === 'next')) ? (
                <>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={styles.mediaLayer}
                    style={{ opacity: outgoingVideoVisible ? 0 : 1 }}
                  />
                  <video
                    src={slide.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={styles.mediaLayer}
                    style={{ opacity: outgoingVideoVisible ? 1 : 0 }}
                  />
                </>
              ) : (
                <img src={slide.image} alt={slide.title} />
              )}
            </div>
            <div className={styles.content}>
              <div className={styles.place}>
                {!slide.isIntro && <img src="/place.png" alt="" />}
                {slide.place}
              </div>
              <div className={styles.title}>{slide.title}</div>
              {!slide.isIntro && slide.rating != null && (
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
              )}
              <div className={styles.des}>
                {slide.isIntro ? (
                  slide.description
                ) : slide.description ? (
                  <RichTextContent html={slide.description} />
                ) : (
                  'Интересное место в Карачаево-Черкесии.'
                )}
              </div>
              <div className={styles.buttons}>
                {slide.isIntro ? (
                  <button
                    onClick={() => {
                      const el = document.getElementById(scrollTargetId)
                      if (el) {
                        const top = el.getBoundingClientRect().top + window.pageYOffset - 80
                        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
                      }
                    }}
                    className={styles.ctaLinkIntro}
                  >
                    Начать путешествие
                  </button>
                ) : (
                  <Link to={placeHref(slide)} className={styles.ctaLink}>
                    Начать путешествие
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Превью (thumbnail) */}
      <div className={styles.thumbnail}>
        {thumbnailSlides.map((slide) => (
          <div key={slide.id} className={styles.item}>
            {!slide.isIntro && (
              <div className={styles.favoriteWrap} onClick={(e) => e.stopPropagation()}>
                <RouteConstructorButton placeId={slide.id} />
                <FavoriteButton entityType="place" entityId={slide.id} />
              </div>
            )}
            <ThumbnailItem
              slide={slide}
              placeHref={placeHref}
              styles={styles}
              maxOffset={thumbnailMaxOffset}
              scale={thumbnailScale}
            />
          </div>
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
