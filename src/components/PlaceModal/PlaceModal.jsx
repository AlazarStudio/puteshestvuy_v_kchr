'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import styles from './PlaceModal.module.css'
import CenterBlock from '../CenterBlock/CenterBlock'
import PlaceBlock from '../PlaceBlock/PlaceBlock'
import RouteBlock from '../RouteBlock/RouteBlock'

export default function PlaceModal({ isOpen, place, onClose }) {
  const photos = [
    { src: "/routeGalery1.png" },
    { src: "/routeGalery2.png" },
    { src: "/routeGalery3.png" },
    { src: "/routeGalery4.png" },
    { src: "/routeGalery5.png" },
    { src: "/routeGalery6.png" },
    { src: "/routeGalery7.png" },
    { src: "/routeGalery8.png" },
  ]

  const nearbyPlaces = [
    {
      id: 1,
      rating: "5.0",
      feedback: "3 отзыва",
      place: "Архыз",
      title: "Озеро Любви",
      desc: "Живописное горное озеро",
      img: "/routeGalery3.png"
    },
    {
      id: 2,
      rating: "4.9",
      feedback: "5 отзывов",
      place: "Домбай",
      title: "Алибекский водопад",
      desc: "Красивейший водопад региона",
      img: "/routeGalery4.png"
    },
    {
      id: 3,
      rating: "4.8",
      feedback: "2 отзыва",
      place: "Теберда",
      title: "Бадукские озёра",
      desc: "Каскад горных озёр",
      img: "/routeGalery5.png"
    },
  ]

  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [expandedReviews, setExpandedReviews] = useState({})
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Михаил',
      date: '12 сентября 2025',
      rating: 5.0,
      text: 'Остался в полном восторге от экскурсии «На границе регионов: Кисловодск — Медовые водопады»! Маршрут продуман идеально: сначала прогулка по Кисловодску с его целебным воздухом и архитектурными жемчужинами, а потом — резкий переход к дикой природе. Медовые водопады поразили мощью и красотой: шум воды, брызги, изумрудные оттенки реки — словно другая планета.Особенно запомнился самый высокий из каскадов: стоя у подножия, чувствуешь себя крошечным перед силой природы.Гид рассказывал увлекательно, не перегружая датами, но делясь интересными легендами.Время пролетело незаметно, а впечатлений — на год вперёд.Однозначно рекомендую тем, кто хочет увидеть контраст курортной элегантности и первозданной природы!',
      avatar: '/avatar_feedback.png',
    },
    {
      id: 2,
      name: 'Андрей',
      date: '10 сентября 2025',
      rating: 5.0,
      text: 'Отличное место для отдыха! Красивые пейзажи, свежий воздух. Дорога к месту немного сложная, но оно того стоит. Взяли с собой термос с чаем и бутерброды — провели замечательный день. Советую приезжать утром, пока мало туристов.',
      avatar: '',
    },
  ])
  const swiperRef = useRef(null)
  const modalBodyRef = useRef(null)

  const visiblePhotos = photos.slice(0, 5)
  const remainingCount = photos.length - 5
  const showMoreButton = photos.length > 5

  const openGallery = (index) => {
    setActiveIndex(index)
    setIsGalleryOpen(true)
  }

  const closeGallery = () => {
    setIsGalleryOpen(false)
  }

  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.realIndex)
  }

  useEffect(() => {
    if (isGalleryOpen && swiperRef.current) {
      swiperRef.current.swiper.slideToLoop(activeIndex)
    }
  }, [isGalleryOpen, activeIndex])

  useEffect(() => {
    if (!isGalleryOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        closeGallery()
        return
      }

      if (!swiperRef.current) return

      if (e.key === 'ArrowLeft') {
        swiperRef.current.swiper.slidePrev()
      } else if (e.key === 'ArrowRight') {
        swiperRef.current.swiper.slideNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isGalleryOpen])

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
    }

    setReviews(prev => [newReview, ...prev])
    setReviewName('')
    setReviewText('')
    setRating(0)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && place && (
          <motion.div
            key="modal"
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.modalBody} ref={modalBodyRef}>
                {/* Главное изображение */}
                <div className={styles.modalImage}>
                  <img src={place.img} alt={place.title} />
                  <div className={styles.modalImage_text}>
                    <CenterBlock>
                      <div className={styles.modalImage_text_block}>
                        <div className={styles.modalImage_text_place}>
                          <img src="/place.png" alt="" />
                          {place.place}
                        </div>
                        <div className={styles.modalImage_text_title}>
                          {place.title}
                        </div>
                      </div>
                    </CenterBlock>
                  </div>
                </div>

                {/* Контент */}
                <div className={styles.modalInfo}>
                  <CenterBlock>
                    <div className={styles.contentWrapper}>
                      {/* Левая колонка - основной контент */}
                      <div className={styles.contentMain}>
                        {/* Фотогалерея */}
                        <div className={styles.title}>Фотогалерея</div>
                        <div className={styles.gallery}>
                          <div
                            className={styles.galleryMain}
                            onClick={() => openGallery(0)}
                          >
                            <img src={photos[0]?.src} alt="Фото 1" />
                          </div>
                          <div className={styles.galleryGrid}>
                            <div className={styles.galleryGridRow}>
                              {visiblePhotos.slice(1, 3).map((photo, index) => {
                                const photoIndex = index + 1
                                return (
                                  <div
                                    key={photoIndex}
                                    className={styles.galleryItem}
                                    onClick={() => openGallery(photoIndex)}
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
                                    onClick={() => openGallery(photoIndex)}
                                  >
                                    <img src={photo.src} alt={`Фото ${photoIndex + 1}`} />
                                    {isLast && (
                                      <div
                                        className={styles.moreButton}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openGallery(5)
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

                        {/* Описание */}
                        <div className={styles.title}>Описание</div>
                        <div className={styles.descriptionText}>
                          {place.fullDesc}
                        </div>
                        <div className={styles.descriptionText}>
                          Это место привлекает туристов со всего мира своей уникальной природой и живописными видами.
                          Здесь можно насладиться чистым горным воздухом, полюбоваться панорамами и сделать незабываемые фотографии.
                          Рекомендуем посещать в утренние или вечерние часы, когда освещение особенно красивое.
                        </div>

                        {/* Как добраться */}
                        <div className={styles.title}>Как добраться</div>
                        <div className={styles.mapImage}>
                          <img src="/map.png" alt="Карта" />
                        </div>

                        {/* Аудио */}
                        <div className={styles.title}>Аудио</div>
                        <div className={styles.audioBlock}>
                          <div className={styles.audioItem}>
                            <div className={styles.audioIcon}>🎧</div>
                            <div className={styles.audioInfo}>
                              <div className={styles.audioTitle}>Аудиогид</div>
                              <div className={styles.audioDesc}>Слушать аудио экскурсию по месту</div>
                            </div>
                            <button className={styles.audioButton}>▶</button>
                          </div>
                        </div>

                        {/* Видео */}
                        <div className={styles.title}>Видео</div>
                        <div className={styles.videoBlock}>
                          <img src="/routeGalery6.png" alt="Видео" />
                          <div className={styles.videoPlay}>▶</div>
                        </div>

                        {/* Отзывы */}
                        <div className={styles.title}>Отзывы</div>
                        <div className={styles.feedback}>
                          <form className={styles.feedbackForm} onSubmit={handleSubmitReview}>
                            <div className={styles.feedbackFormRating}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={styles.starButton}
                                  onClick={() => handleStarClick(star - 1)}
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
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
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
                                    <button className={styles.feedbackExpandButton} onClick={() => toggleReview(review.id)}>
                                      Показать полностью
                                    </button>
                                  )}
                                  {isExpanded && review.text.length > 200 && (
                                    <button className={styles.feedbackExpandButton} onClick={() => toggleReview(review.id)}>
                                      Свернуть
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Отели по близости */}
                        <div className={styles.title}>Отели по близости</div>
                        <div className={styles.hotelsGrid}>
                          <div className={styles.hotelCard}>
                            <img src="/routeGalery7.png" alt="Отель" />
                            <div className={styles.hotelInfo}>
                              <div className={styles.hotelName}>Гостиница "Горная"</div>
                              <div className={styles.hotelPrice}>от 3 500 ₽/ночь</div>
                            </div>
                          </div>
                          <div className={styles.hotelCard}>
                            <img src="/routeGalery8.png" alt="Отель" />
                            <div className={styles.hotelInfo}>
                              <div className={styles.hotelName}>Отель "Архыз"</div>
                              <div className={styles.hotelPrice}>от 4 200 ₽/ночь</div>
                            </div>
                          </div>
                          <div className={styles.hotelCard}>
                            <img src="/routeGalery6.png" alt="Отель" />
                            <div className={styles.hotelInfo}>
                              <div className={styles.hotelName}>Гостиница "Бермамыт"</div>
                              <div className={styles.hotelPrice}>от 6 500 ₽/ночь</div>
                            </div>
                          </div>
                        </div>

                        {/* Маршруты с этим местом */}
                        <div className={styles.title}>Маршруты с этим местом</div>
                        <div className={styles.routesList}>
                          <RouteBlock title="На границе регионов: Кисловодск - Медовые водопады" />
                        </div>
                      </div>

                      {/* Правая колонка - места рядом */}
                      <div className={styles.sidebar}>
                        <div className={styles.sidebarTitle}>Места рядом</div>
                        <div className={styles.sidebarPlaces}>
                          {nearbyPlaces.map((nearbyPlace) => (
                            <div key={nearbyPlace.id} className={styles.sidebarPlaceCard}>
                              <img src={nearbyPlace.img} alt={nearbyPlace.title} className={styles.sidebarPlaceImg} />
                              <div className={styles.sidebarPlaceInfo}>
                                <div className={styles.sidebarPlaceRating}>
                                  <img src="/star.png" alt="" />
                                  {nearbyPlace.rating}
                                </div>
                                <div className={styles.sidebarPlaceTitle}>{nearbyPlace.title}</div>
                                <div className={styles.sidebarPlaceLocation}>
                                  <img src="/place_black.png" alt="" />
                                  {nearbyPlace.place}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CenterBlock>
                </div>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка галереи - полностью отдельная от AnimatePresence */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            key="gallery-modal"
            className={styles.galleryModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              closeGallery()
            }}
          >
            <motion.div
              className={styles.galleryModalContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <button
                className={styles.galleryModalClose}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  closeGallery()
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.galleryModalMain}>
                <Swiper
                  ref={swiperRef}
                  modules={[Navigation]}
                  navigation={true}
                  loop={true}
                  spaceBetween={20}
                  slidesPerView={1}
                  initialSlide={activeIndex}
                  onSlideChange={handleSlideChange}
                  className={styles.galleryModalSwiper}
                >
                  {photos.map((photo, index) => (
                    <SwiperSlide key={index}>
                      <div className={styles.galleryModalSlide}>
                        <img src={photo.src} alt={`Фото ${index + 1}`} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div className={styles.galleryModalThumbnails}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
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
    </>
  )
}
