'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './RouteDetail.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Link from 'next/link'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import YandexMapRoute from '@/components/YandexMapRoute/YandexMapRoute'
import { publicRoutesAPI, getImageUrl } from '@/lib/api'

function parseWhatToBring(str) {
  if (!str || typeof str !== 'string') return []
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function RouteDetail({ routeSlug }) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [similarRoutes, setSimilarRoutes] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeDay, setActiveDay] = useState(1)
  const [rating, setRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [expandedReviews, setExpandedReviews] = useState({})
  const [activeAnchor, setActiveAnchor] = useState('main')
  const [reviews, setReviews] = useState([])
  const swiperRef = useRef(null)
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    if (!routeSlug) {
      setLoading(false)
      setError('Маршрут не указан')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    publicRoutesAPI.getByIdOrSlug(routeSlug)
      .then(({ data }) => {
        if (!cancelled) {
          setRoute(data)
          setReviews(Array.isArray(data.reviews) ? data.reviews.map((r, i) => ({
            id: r.id || i,
            name: r.authorName || '',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
            rating: r.rating || 0,
            text: r.text || '',
            avatar: r.authorAvatar || '',
            isLong: (r.text || '').length > 200,
          })) : [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.status === 404 ? 'Маршрут не найден' : 'Ошибка загрузки маршрута')
          setRoute(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [routeSlug])

  useEffect(() => {
    if (route?.points?.length) setActiveDay(1)
  }, [route?.id])

  useEffect(() => {
    const ids = route?.similarRouteIds
    if (!Array.isArray(ids) || ids.length === 0) {
      setSimilarRoutes([])
      return
    }
    let cancelled = false
    Promise.all(ids.map((id) => publicRoutesAPI.getByIdOrSlug(id).then((r) => r.data).catch(() => null)))
      .then((list) => {
        if (!cancelled) setSimilarRoutes(list.filter(Boolean))
      })
    return () => { cancelled = true }
  }, [route?.similarRouteIds])

  const photos = route?.images?.length
    ? route.images.map((src) => ({ src: getImageUrl(src) }))
    : [{ src: '/routeGalery1.png' }]

  const visiblePhotos = photos.slice(0, 5)
  const remainingCount = photos.length - 5
  const showMoreButton = photos.length > 5

  const openModal = (index) => {
    setActiveIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSlideChange = (swiper) => {
    // Используем realIndex для корректной работы с loop
    setActiveIndex(swiper.realIndex)
  }

  // Обновляем слайдер при изменении activeIndex
  useEffect(() => {
    if (isModalOpen && swiperRef.current) {
      // Используем slideToLoop для корректной работы с loop
      swiperRef.current.swiper.slideToLoop(activeIndex)
    }
  }, [isModalOpen, activeIndex])

  // Навигация клавиатурой
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e) => {
      if (!swiperRef.current) return

      if (e.key === 'ArrowLeft') {
        swiperRef.current.swiper.slidePrev()
      } else if (e.key === 'ArrowRight') {
        swiperRef.current.swiper.slideNext()
      } else if (e.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  // Управление скроллом страницы при открытии/закрытии модалки
  useEffect(() => {
    if (isModalOpen) {
      // Сохраняем текущую позицию скролла
      scrollPositionRef.current = window.scrollY
      // Блокируем скролл
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Восстанавливаем скролл
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      // Восстанавливаем позицию скролла
      window.scrollTo(0, scrollPositionRef.current)
    }

    // Очистка при размонтировании
    return () => {
      if (!isModalOpen) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
      }
    }
  }, [isModalOpen])

  const slides = [
    {
      id: 1,
      href: '/#',
      imgSrc: '/helpfull1.png',
      title: 'Этикет региона: дресс-код и культура',
    },
    {
      id: 2,
      href: '/#',
      imgSrc: '/helpfull2.png',
      title: 'Дресс-код гор Карачаево-Черкесии',
    },
    {
      id: 3,
      href: '/#',
      imgSrc: '/helpfull1.png',
      title: 'Этикет региона: дресс-код и культура',
    },
    {
      id: 4,
      href: '/#',
      imgSrc: '/helpfull2.png',
      title: 'Дресс-код гор Карачаево-Черкесии',
    },
  ]

  const toggleReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }))
  }

  const handleStarClick = (starIndex) => {
    setRating(starIndex + 1)
  }

  const formatDate = (date) => {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const handleSubmitReview = (e) => {
    e.preventDefault()

    if (!reviewName.trim() || !reviewText.trim() || rating === 0) {
      alert('Пожалуйста, заполните все поля и выберите рейтинг')
      return
    }

    const newReview = {
      id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
      name: reviewName.trim(),
      date: formatDate(new Date()),
      rating: rating,
      text: reviewText.trim(),
      avatar: '/profile.png',
      isLong: reviewText.trim().length > 200
    }

    setReviews(prev => [newReview, ...prev])

    // Очистка формы
    setReviewName('')
    setReviewText('')
    setRating(0)
  }

  const anchors = [
    { id: 'main', label: 'Основное' },
    { id: 'route', label: 'Маршрут' },
    { id: 'map', label: 'Как добраться' },
    { id: 'what-to-take', label: 'Что взять с собой' },
    { id: 'description', label: 'Описание маршрута' },
    { id: 'important', label: 'Важно знать' },
    { id: 'guides', label: 'Гиды' },
    { id: 'reviews', label: 'Отзывы' },
    { id: 'places', label: 'Места рядом с этим маршрутом' },
    { id: 'similar', label: 'Похожие маршруты' }
  ]

  const scrollToAnchor = (anchorId) => {
    const element = document.getElementById(anchorId)
    if (element) {
      const offset = 100 // Отступ сверху для sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Отслеживание активного якоря при прокрутке
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150 // Отступ для учета sticky header

      for (let i = anchors.length - 1; i >= 0; i--) {
        const element = document.getElementById(anchors[i].id)
        if (element) {
          const elementTop = element.offsetTop
          if (scrollPosition >= elementTop) {
            setActiveAnchor(anchors[i].id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Вызываем сразу для установки начального активного якоря

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <main className={styles.main}>
        <CenterBlock>
          <div className={styles.routePage} style={{ padding: '2rem', textAlign: 'center' }}>Загрузка маршрута...</div>
        </CenterBlock>
      </main>
    )
  }
  if (error || !route) {
    return (
      <main className={styles.main}>
        <CenterBlock>
          <div className={styles.routePage} style={{ padding: '2rem', textAlign: 'center' }}>
            {error || 'Маршрут не найден'}
            <br />
            <Link href="/routes">Вернуться к списку маршрутов</Link>
          </div>
        </CenterBlock>
      </main>
    )
  }

  const points = Array.isArray(route.points) ? route.points : []
  const routePlaces = Array.isArray(route.places) ? route.places : []
  const whatToBringItems = parseWhatToBring(route.whatToBring)
  const seasonDisplay = Array.isArray(route.customFilters?.seasons) && route.customFilters.seasons.length > 0
    ? route.customFilters.seasons.join(', ')
    : (route.season || '')

  console.log(routePlaces)

  return (
    <main className={styles.main}>
      <CenterBlock>
        <div className={styles.routePage}>
          <div className={styles.bread_crumbs}>
            <Link href="/">Главная</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link href="/routes">Маршруты</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{route.title}</span>
          </div>

          <div className={styles.gallery}>
            <div
              className={styles.galleryMain}
              onClick={() => openModal(0)}
            >
              <img src={photos[0]?.src} alt={`Фото 1`} />
            </div>

            <div className={styles.galleryGrid}>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(1, 3).map((photo, index) => {
                  const photoIndex = index + 1

                  return (
                    <div
                      key={photoIndex}
                      className={styles.galleryItem}
                      onClick={() => openModal(photoIndex)}
                    >
                      <img src={photo.src} alt={`Фото ${photoIndex + 1}`} />
                    </div>
                  )
                })}
              </div>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(3, 5).map((photo, index) => {
                  const photoIndex = index + 3
                  const isLast = photoIndex === 4 && showMoreButton

                  return (
                    <div
                      key={photoIndex}
                      className={`${styles.galleryItem} ${isLast ? styles.galleryItemLast : ''}`}
                      onClick={() => openModal(photoIndex)}
                    >
                      <img src={photo.src} alt={`Фото ${photoIndex + 1}`} />
                      {isLast && (
                        <div
                          className={styles.moreButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal(5)
                          }}
                        >
                          <img src="/morePhoto.png" alt="" />
                          <span>Еще {remainingCount} фото</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className={styles.routeBlock}>
            <div className={styles.routeBlock_content}>
              <div id="main" className={styles.title}>{route.title}</div>
              <div className={styles.information}>
                {route.distance != null && route.distance !== '' && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon1.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>Расстояние</div>
                      <div className={styles.textDesc}>{route.distance} км</div>
                    </div>
                  </div>
                )}
                {seasonDisplay && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon2.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>Сезон</div>
                      <div className={styles.textDesc}>{seasonDisplay}</div>
                    </div>
                  </div>
                )}
                {route.elevationGain != null && route.elevationGain !== '' && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon3.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>Перепад высот</div>
                      <div className={styles.textDesc}>{route.elevationGain} м</div>
                    </div>
                  </div>
                )}
                {route.hasOvernight && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon4.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>С ночевкой</div>
                    </div>
                  </div>
                )}
                {route.difficulty != null && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon5.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>
                        Сложность
                        <span className={styles.difficultyHintWrap} aria-label="Пояснение уровней сложности">
                          <span className={styles.difficultyHint}>?</span>
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
                      <div className={styles.textDesc}>{route.difficulty}</div>
                    </div>
                  </div>
                )}
                {route.duration && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon6.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>Время прохождения</div>
                      <div className={styles.textDesc}>{route.duration}</div>
                    </div>
                  </div>
                )}
                {route.isFamily && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon7.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>Семейный маршрут</div>
                    </div>
                  </div>
                )}
                {route.transport && (
                  <div className={styles.item}>
                    <img src="/routeInfoContentIcon8.png" alt="" />
                    <div className={styles.text}>
                      <div className={styles.textTitle}>Способ передвижения</div>
                      <div className={styles.textDesc}>{route.transport}</div>
                    </div>
                  </div>
                )}
              </div>

              <div id="route" className={styles.title}>Маршрут</div>
              <div className={styles.forSlider}>
                <div className={styles.slider}>
                  <Swiper
                    navigation={true}
                    modules={[Navigation]}
                    slidesPerView={1}
                    className="mySwiperRoute"
                  >
                    {routePlaces.length > 0 ? routePlaces.map((place, i) => {
                      const mainImage = place.images?.[0] ?? place.image
                      const placeHref = `/places/${place.slug || place.id}`
                      return (
                        <SwiperSlide key={place.id}>
                          <div className={styles.slide}>
                            <div className={styles.slideTitle}>{place.title || `Место ${i + 1}`}</div>
                            <div className={styles.slideSubTitle}>место {i + 1}</div>
                            <div className={styles.routeLine}><img src="/routeLine.png" alt="" /></div>
                            <div className={styles.slideBlock}>
                              <div className={styles.slideDesc} dangerouslySetInnerHTML={{ __html: place.description || '' }} />
                              <div className={styles.slideImg}>
                                {mainImage ? (
                                  <img src={getImageUrl(mainImage)} alt={place.title} />
                                ) : null}
                              </div>
                            </div>
                            <Link href={placeHref} className={styles.slideBtn}>
                              Подробнее
                            </Link>
                          </div>
                        </SwiperSlide>
                      )
                    }) : (
                      <SwiperSlide>
                        <div className={styles.slide}>
                          <div className={styles.slideDesc}>В маршрут пока не добавлены места.</div>
                        </div>
                      </SwiperSlide>
                    )}
                  </Swiper>
                </div>
              </div>

              <div id="map" className={styles.title}>Как добраться</div>
              <div className={styles.map}>
                <YandexMapRoute
                  places={routePlaces.map((p) => ({
                    id: p.id,
                    title: p.title,
                    latitude: p.latitude,
                    longitude: p.longitude,
                  }))}
                  height={400}
                  className={styles.mapYandex}
                  showRouteFromMe
                />
              </div>

              <div id="what-to-take" className={styles.title}>Что взять с собой</div>
              <div className={styles.infoTable}>
                {whatToBringItems.length > 0 ? (
                  <div className={styles.infoTable_blocks}>
                    {whatToBringItems.map((item, i) => (
                      <div key={i} className={styles.infoTable_blocks_block}>
                        <div className={styles.infoTable_blocks_block_img}>
                          <img src="/infoTable_icon1.png" alt="" />
                        </div>
                        {item.text || '—'}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.text}>Список не добавлен.</div>
                )}
              </div>

              <div id="description" className={styles.title}>Описание маршрута</div>
              <div className={styles.tabs}>
                {points.length > 0 ? (
                  <>
                    <div className={styles.tabsList}>
                      {points.map((point, i) => (
                        <button
                          key={point.id || i}
                          className={`${styles.tab} ${activeDay === i + 1 ? styles.tabActive : ''}`}
                          onClick={() => setActiveDay(i + 1)}
                        >
                          {i + 1} {point.title ? (point.title.length > 15 ? point.title.slice(0, 15) + '…' : point.title) : `день`}
                        </button>
                      ))}
                    </div>
                    <div className={styles.tabsContent}>
                      <div className={styles.tabsContentTitle}>{points[activeDay - 1]?.title || `${activeDay} день`}</div>
                      <div className={styles.tabsContentList} dangerouslySetInnerHTML={{ __html: points[activeDay - 1]?.description || '' }} />
                    </div>
                  </>
                ) : (
                  <div className={styles.text}>Описание по дням не добавлено.</div>
                )}
              </div>

              <div id="important" className={styles.title}>Важно знать</div>
              <div className={styles.text}>
                {route.importantInfo || 'Дополнительная информация не добавлена.'}
              </div>

              <div id="guides" className={styles.title}>Помогут покорить маршрут</div>
              <div className={styles.guides}>
                <Link href={'/#'} className={styles.guide_man}>
                  <div className={styles.guide_man_img}>
                    <img src="/serviceImg1.png" alt="" className={styles.guide_man_img_avatar} />
                    <img src="/verification.png" alt="" className={styles.guide_man_img_verification} />
                  </div>
                  <div className={styles.guide_man_desc}>
                    <div className={styles.guide_man_title}>
                      Хубиев Артур Арсенович
                    </div>
                    <div className={styles.guide_man_rating_feedback}>
                      <div className={styles.guide_man_rating_feedback_item}><img src="/star.png" alt="" /> 5.0</div>
                      <div className={styles.guide_man_rating_feedback_item}>4 отзыва</div>
                    </div>
                  </div>
                </Link>

                <Link href={'/#'} className={styles.guide_man}>
                  <div className={styles.guide_man_img}>
                    <img src="/serviceImg2.png" alt="" className={styles.guide_man_img_avatar} />
                    <img src="/verification.png" alt="" className={styles.guide_man_img_verification} />
                  </div>
                  <div className={styles.guide_man_desc}>
                    <div className={styles.guide_man_title}>
                      Долаев Артур Нурмагомедович
                    </div>
                    <div className={styles.guide_man_rating_feedback}>
                      <div className={styles.guide_man_rating_feedback_item}><img src="/star.png" alt="" /> 5.0</div>
                      <div className={styles.guide_man_rating_feedback_item}>4 отзыва</div>
                    </div>
                  </div>
                </Link>

                <Link href={'/#'} className={styles.guide_man}>
                  <div className={styles.guide_man_img}>
                    <img src="/serviceImg3.png" alt="" className={styles.guide_man_img_avatar} />
                    <img src="/verification.png" alt="" className={styles.guide_man_img_verification} />
                  </div>
                  <div className={styles.guide_man_desc}>
                    <div className={styles.guide_man_title}>
                      Шаманов Руслан Владимирович
                    </div>
                    <div className={styles.guide_man_rating_feedback}>
                      <div className={styles.guide_man_rating_feedback_item}><img src="/star.png" alt="" /> 5.0</div>
                      <div className={styles.guide_man_rating_feedback_item}>4 отзыва</div>
                    </div>
                  </div>
                </Link>

                <Link href={'/#'} className={styles.guide_man}>
                  <div className={styles.guide_man_img}>
                    <img src="/serviceImg4.png" alt="" className={styles.guide_man_img_avatar} />
                    <img src="/verification.png" alt="" className={styles.guide_man_img_verification} />
                  </div>
                  <div className={styles.guide_man_desc}>
                    <div className={styles.guide_man_title}>
                      Дотдаев Магомет Сеит-Мазанович
                    </div>
                    <div className={styles.guide_man_rating_feedback}>
                      <div className={styles.guide_man_rating_feedback_item}><img src="/star.png" alt="" /> 5.0</div>
                      <div className={styles.guide_man_rating_feedback_item}>4 отзыва</div>
                    </div>
                  </div>
                </Link>
              </div>

              <div id="reviews" className={styles.title}>Отзывы</div>
              <div className={styles.feedback}>
                <form className={styles.feedbackForm} onSubmit={handleSubmitReview}>
                  <div className={styles.feedbackFormRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={styles.starButton}
                        onClick={() => handleStarClick(star - 1)}
                        onMouseEnter={() => { }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill={star <= rating ? "#FFD700" : "none"}
                          stroke={star <= rating ? "#FFD700" : "#CCCCCC"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className={styles.feedbackFormInput}
                    placeholder="Ваше имя"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                  />
                  <textarea
                    className={styles.feedbackFormTextarea}
                    placeholder="Ваш отзыв"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows="4"
                  />
                  <button type="submit" className={styles.feedbackSubmitButton}>
                    Оставить отзыв
                  </button>
                </form>

                <div className={styles.feedbackList}>
                  {reviews.map((review) => {
                    const isExpanded = expandedReviews[review.id]
                    const shortText = review.text.length > 200 ? review.text.substring(0, 200) + '...' : review.text
                    const showExpandButton = review.text.length > 200 && !isExpanded

                    return (
                      <div key={review.id} className={styles.feedbackItem}>
                        <div className={styles.feedbackItemHeader}>
                          <div className={styles.feedbackItemLeft}>
                            <img 
                              src={review.avatar || '/no-avatar.png'} 
                              alt={review.name} 
                              className={styles.feedbackAvatar}
                              onError={(e) => { e.target.src = '/no-avatar.png' }}
                            />
                            <div className={styles.feedbackItemInfo}>
                              <div className={styles.feedbackItemNameRow}>
                                <div className={styles.feedbackItemName}>{review.name}</div>
                                <div className={styles.feedbackItemDate}>{review.date}</div>
                              </div>
                              <div className={styles.feedbackItemRating}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="#FFD700"
                                  stroke="#FFD700"
                                  strokeWidth="2"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                <span>{review.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.feedbackItemText}>
                          {isExpanded ? review.text : shortText}
                        </div>
                        {showExpandButton && (
                          <button
                            className={styles.feedbackExpandButton}
                            onClick={() => toggleReview(review.id)}
                          >
                            Показать полностью
                          </button>
                        )}
                        {isExpanded && review.text.length > 200 && (
                          <button
                            className={styles.feedbackExpandButton}
                            onClick={() => toggleReview(review.id)}
                          >
                            Свернуть
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className={styles.feedbackShowAll}>
                  <button className={styles.feedbackShowAllButton}>Показать все отзывы</button>
                </div>
              </div>

              <div id="places" className={styles.title}>Места рядом с этим маршрутом</div>
              <div className={styles.places}>
                <PlaceBlock width='336px' rating={"5.0"} feedback={"1 отзыв"} place={"Теберда"} title={"Центральная усадьба Тебердинского национального парка"} desc={"Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;"} link={"/#"} img={'/placeImg1.png'} />
                <PlaceBlock width='336px' rating={"5.0"} feedback={"2 отзыва"} place={"Теберда"} title={"Центральная усадьба Тебердинского национального парка"} desc={"Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;"} link={"/#"} img={'/placeImg1.png'} />
              </div>

              <div id="similar" className={styles.title}>Похожие маршруты</div>
              <div className={styles.anotherRoutes}>
                {similarRoutes.length > 0 ? (
                  similarRoutes.map((r) => <RouteBlock key={r.id} route={r} />)
                ) : (
                  <div className={styles.text}>Нет похожих маршрутов.</div>
                )}
              </div>
            </div>

            <div className={styles.routeBlock_anchors}>
              <div className={styles.anchorsList}>
                {anchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    className={`${styles.anchorItem} ${activeAnchor === anchor.id ? styles.anchorItemActive : ''}`}
                    onClick={() => scrollToAnchor(anchor.id)}
                  >
                    {anchor.label}
                  </button>
                ))}
              </div>
              <div className={styles.anchorsButtons}>
                <button className={styles.anchorButton}>
                  Скачать маршрут в PDF
                </button>
                <button className={styles.anchorButton}>
                  Забронировать
                </button>
              </div>
            </div>
          </div>
        </div>
      </CenterBlock>

      {/* Модалка со слайдером */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.modalMain}>
                <Swiper
                  ref={swiperRef}
                  modules={[Navigation]}
                  navigation={true}
                  loop={true}
                  spaceBetween={20}
                  slidesPerView={1}
                  initialSlide={activeIndex}
                  onSlideChange={handleSlideChange}
                  className={styles.modalSwiper}
                >
                  {photos.map((photo, index) => (
                    <SwiperSlide key={index}>
                      <div className={styles.modalSlide}>
                        <img src={photo.src} alt={`Фото ${index + 1}`} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Миниатюры */}
              <div className={styles.modalThumbnails}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ''}`}
                    onClick={() => {
                      setActiveIndex(index)
                      if (swiperRef.current) {
                        swiperRef.current.swiper.slideToLoop(index)
                      }
                    }}
                  >
                    <img src={photo.src} alt={`Миниатюра ${index + 1}`} />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
