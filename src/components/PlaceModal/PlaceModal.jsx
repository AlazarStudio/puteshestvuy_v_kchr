'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import styles from './PlaceModal.module.css'
import CenterBlock from '../CenterBlock/CenterBlock'
import YandexMapPlace from '../YandexMapPlace'
import RichTextContent from '../RichTextContent'
import RouteConstructorButton from '../RouteConstructorButton/RouteConstructorButton'
import FavoriteButton from '../FavoriteButton/FavoriteButton'
import ParallaxImage from '../ParallaxImage'
import { getImageUrl, publicPlacesAPI } from '@/lib/api'

const formatReviewDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const hasTextContent = (html) => {
  if (!html || typeof html !== 'string') return false
  // Удаляем HTML-теги и проверяем, остался ли текст
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 0
}

export default function PlaceModal({ isOpen, place, onClose, onOpenPlace, isLoading = false }) {

  const photos = useMemo(() => {
    if (!place?.images?.length) return [{ src: getImageUrl(place?.images?.[0]) || '/placeholder.jpg' }]
    return place.images.map((url) => ({ src: getImageUrl(url) }))
  }, [place?.images])

  const nearbyPlaces = useMemo(() => place?.nearbyPlaces ?? [], [place?.nearbyPlaces])

  const reviewsFromApi = useMemo(() => {
    if (!place?.reviews?.length) return []
    return place.reviews.map((r) => ({
      id: r.id,
      name: r.authorName || 'Гость',
      date: formatReviewDate(r.createdAt),
      rating: r.rating,
      text: r.text,
      avatar: r.authorAvatar ? getImageUrl(r.authorAvatar) : '',
    }))
  }, [place?.reviews])

  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [expandedReviews, setExpandedReviews] = useState({})
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState('idle') // idle | sending | success | error
  const reviews = reviewsFromApi

  useEffect(() => {
    setReviewSubmitStatus('idle')
  }, [place?.id])

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

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    if (!reviewName.trim() || !reviewText.trim() || rating === 0) {
      alert('Пожалуйста, заполните все поля и выберите рейтинг')
      return
    }
    if (!place?.id) return

    setReviewSubmitStatus('sending')
    try {
      await publicPlacesAPI.createReview(place.id, {
        authorName: reviewName.trim(),
        rating,
        text: reviewText.trim(),
      })
      setReviewSubmitStatus('success')
      setReviewName('')
      setReviewText('')
      setRating(0)
    } catch (err) {
      console.error(err)
      setReviewSubmitStatus('error')
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (place || isLoading) && (
          <motion.div
            key="modal"
            className={styles.modal}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
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
                {isLoading ? (
                  <div className={styles.modalLoading}>Загрузка...</div>
                ) : place ? (
                  <>
                {/* Главное изображение */}
                <div className={styles.modalImage}>
                  <img src={getImageUrl(place.images?.[0])} alt={place.title} />
                  {place?.id && (
                    <div className={styles.modalImageActions}>
                      <div className={styles.modalImageIcons} onClick={(e) => e.stopPropagation()}>
                        <RouteConstructorButton placeId={place.id} place={place} />
                        <FavoriteButton entityType="place" entityId={place.id} />
                      </div>
                    </div>
                  )}
                  <div className={styles.modalImage_text}>
                    <CenterBlock>
                      <div className={styles.modalImage_text_block}>
                        {place.location && (
                          <Link 
                            to={`/places?search=${encodeURIComponent(place.location)}`}
                            className={styles.modalImage_text_place}
                            onClick={onClose}
                            style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                          >
                            <img src="/place.png" alt="" />
                            {place.location}
                          </Link>
                        )}
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
                        <div className={`${styles.gallery} ${photos.length === 1 ? styles.galleryCount1 : photos.length === 2 ? styles.galleryCount2 : photos.length === 3 ? styles.galleryCount3 : ''}`}>
                          {photos.length === 1 && (
                            <div className={styles.galleryFull} onClick={() => openGallery(0)}>
                              <ParallaxImage
                                src={photos[0]?.src}
                                alt="Фото 1"
                                maxOffset={5}
                                scale={1.03}
                                style={{ width: '100%', height: '100%' }}
                                imgStyle={{ objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          {photos.length === 2 && (
                            <>
                              <div className={styles.galleryHalf} onClick={() => openGallery(0)}>
                                <ParallaxImage
                                  src={photos[0]?.src}
                                  alt="Фото 1"
                                  maxOffset={5}
                                  scale={1.03}
                                  style={{ width: '100%', height: '100%' }}
                                  imgStyle={{ objectFit: 'cover' }}
                                />
                              </div>
                              <div className={styles.galleryHalf} onClick={() => openGallery(1)}>
                                <ParallaxImage
                                  src={photos[1]?.src}
                                  alt="Фото 2"
                                  maxOffset={5}
                                  scale={1.03}
                                  style={{ width: '100%', height: '100%' }}
                                  imgStyle={{ objectFit: 'cover' }}
                                />
                              </div>
                            </>
                          )}
                          {photos.length === 3 && (
                            <>
                              <div className={styles.galleryThirdLeft} onClick={() => openGallery(0)}>
                                <ParallaxImage
                                  src={photos[0]?.src}
                                  alt="Фото 1"
                                  maxOffset={5}
                                  scale={1.03}
                                  style={{ width: '100%', height: '100%' }}
                                  imgStyle={{ objectFit: 'cover' }}
                                />
                              </div>
                              <div className={styles.galleryThirdRight}>
                                <div className={styles.galleryThirdRightItem} onClick={() => openGallery(1)}>
                                  <ParallaxImage
                                    src={photos[1]?.src}
                                    alt="Фото 2"
                                    maxOffset={5}
                                    scale={1.03}
                                    style={{ width: '100%', height: '100%' }}
                                    imgStyle={{ objectFit: 'cover' }}
                                  />
                                </div>
                                <div className={styles.galleryThirdRightItem} onClick={() => openGallery(2)}>
                                  <ParallaxImage
                                    src={photos[2]?.src}
                                    alt="Фото 3"
                                    maxOffset={5}
                                    scale={1.03}
                                    style={{ width: '100%', height: '100%' }}
                                    imgStyle={{ objectFit: 'cover' }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {photos.length >= 4 && (
                            <>
                              <div className={styles.galleryMain} onClick={() => openGallery(0)}>
                                <ParallaxImage
                                  src={photos[0]?.src}
                                  alt="Фото 1"
                                  maxOffset={5}
                                  scale={1.03}
                                  style={{ width: '100%', height: '100%' }}
                                  imgStyle={{ objectFit: 'cover' }}
                                />
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
                                        <ParallaxImage
                                          src={photo.src}
                                          alt={`Фото ${photoIndex + 1}`}
                                          maxOffset={5}
                                          scale={1.03}
                                          style={{ width: '100%', height: '100%' }}
                                          imgStyle={{ objectFit: 'cover' }}
                                        />
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
                                        <ParallaxImage
                                          src={photo.src}
                                          alt={`Фото ${photoIndex + 1}`}
                                          maxOffset={5}
                                          scale={1.03}
                                          style={{ width: '100%', height: '100%' }}
                                          imgStyle={{ objectFit: 'cover' }}
                                        />
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
                            </>
                          )}
                        </div>

                        {/* Описание */}
                        <div className={styles.title}>Описание</div>
                        <RichTextContent html={place.description} className={styles.descriptionText} />

                        {/* Как добраться */}
                        {hasTextContent(place.howToGet) && (
                          <>
                            <div className={styles.title}>Как добраться</div>
                            <RichTextContent html={place.howToGet} className={styles.descriptionText} />
                          </>
                        )}

                        {/* Карта */}
                        {place.latitude != null && place.longitude != null && Number(place.latitude) && Number(place.longitude) ? (
                          <YandexMapPlace
                            latitude={place.latitude}
                            longitude={place.longitude}
                            title={place.title}
                            location={place.location}
                            image={place.image || place.images?.[0]}
                          />
                        ) : (
                          <>
                            {place.mapUrl && (
                              <div className={styles.mapImage}>
                                <img src={place.mapUrl} alt="Карта" />
                              </div>
                            )}
                            {place.location && (
                              <a
                                href={`https://yandex.ru/maps/?text=${encodeURIComponent(place.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.mapLinkButton}
                              >
                                Открыть в Яндекс.Картах
                              </a>
                            )}
                            {!place.mapUrl && !place.location && (
                              <div className={styles.mapImage}>
                                <img src="/map.png" alt="Карта" />
                              </div>
                            )}
                          </>
                        )}

                        {/* Важно знать */}
                        {hasTextContent(place.importantInfo) && (
                          <>
                            <div className={styles.title}>Важно знать</div>
                            <RichTextContent html={place.importantInfo} className={styles.descriptionText} />
                          </>
                        )}

                        {/* Аудиогид — встраивание Яндекс.Музыки */}
                        {place?.audioGuide && (
                          <>
                            <div className={styles.title}>Аудиогид</div>
                            <div className={styles.audioEmbed}>
                              <iframe
                                title="Аудиогид — Яндекс.Музыка"
                                src={place.audioGuide}
                                frameBorder="0"
                                allow="clipboard-write"
                                style={{ border: 'none', width: '100%', maxWidth: '100%', height: 556 }}
                              />
                            </div>
                          </>
                        )}

                        {/* Видео — встраивание VK Video */}
                        {place?.video && (
                          <>
                            <div className={styles.title}>Видео</div>
                            <div className={styles.videoEmbed}>
                              <iframe
                                title="Видео — VK Video"
                                src={place.video}
                                frameBorder="0"
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                                allowFullScreen
                                style={{ border: 'none', width: '100%', maxWidth: 1280, aspectRatio: '16/9', height: 'auto' }}
                              />
                            </div>
                          </>
                        )}

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
                            <button
                              type="submit"
                              className={styles.feedbackSubmitButton}
                              disabled={reviewSubmitStatus === 'sending'}
                            >
                              {reviewSubmitStatus === 'sending' ? 'Отправка...' : 'Оставить отзыв'}
                            </button>
                            {reviewSubmitStatus === 'success' && (
                              <p className={styles.feedbackSuccess}>Спасибо! Отзыв отправлен на модерацию и появится на сайте после проверки.</p>
                            )}
                            {reviewSubmitStatus === 'error' && (
                              <p className={styles.feedbackError}>Не удалось отправить отзыв. Попробуйте позже.</p>
                            )}
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

                      </div>

                      {/* Правая колонка - места рядом (всегда видна) */}
                      <div className={styles.sidebar}>
                        <div className={styles.sidebarTitle}>Места рядом</div>
                        {nearbyPlaces.length > 0 ? (
                          <div className={styles.sidebarPlaces}>
                            {nearbyPlaces.map((nearbyPlace) => (
                              <div
                                key={nearbyPlace.id}
                                className={styles.sidebarPlaceCard}
                                onClick={() => onOpenPlace?.(nearbyPlace.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenPlace?.(nearbyPlace.id); } }}
                                aria-label={`Открыть: ${nearbyPlace.title}`}
                              >
                                <img src={getImageUrl(nearbyPlace.image)} alt={nearbyPlace.title} className={styles.sidebarPlaceImg} />
                                <div className={styles.sidebarPlaceInfo}>
                                  {/* <div className={styles.sidebarPlaceRating}>
                                    <img src="/star.png" alt="" />
                                    {nearbyPlace.rating}
                                  </div> */}
                                  <div className={styles.sidebarPlaceTitle}>{nearbyPlace.title}</div>
                                  <div className={styles.sidebarPlaceLocation}>
                                    <img src="/place_black.png" alt="" />
                                    {nearbyPlace.location}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.sidebarEmpty}>Места рядом не найдены</p>
                        )}
                      </div>
                    </div>
                  </CenterBlock>
                </div>
              </>
                ) : null}
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
