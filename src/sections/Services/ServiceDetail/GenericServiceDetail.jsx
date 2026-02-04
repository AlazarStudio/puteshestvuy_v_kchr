'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ServiceDetail.module.css'
import common from './ServiceDetailCommon.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'
import { publicServicesAPI } from '@/lib/api'
import YandexMapPlace from '@/components/YandexMapPlace'

const DEFAULT_PHOTOS = [
  { src: '/routeGalery1.png' },
  { src: '/routeGalery2.png' },
  { src: '/routeGalery3.png' },
  { src: '/routeGalery4.png' },
  { src: '/routeGalery5.png' },
]

const BreadcrumbArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const StarIcon = ({ filled, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FFD700' : 'none'} stroke={filled ? '#FFD700' : '#CCCCCC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

/**
 * Общий layout страницы услуги: галерея, шапка, якорные блоки, контакты, отзывы, сайдбар.
 * config: { breadcrumbTitle, categoryLabel, serviceName, tags[], aboutTitle, aboutContent, sections: [{ id, title, content }], contacts: [{ label, value, href? }], primaryButtonText, reviewPlaceholder, showReviews?, avatarImg?, photos, reviews?, rating?, reviewsCount? }
 */
export default function GenericServiceDetail({ config, specificStyles = {}, serviceId, serviceSlug }) {
  const {
    breadcrumbTitle,
    categoryLabel,
    serviceName,
    tags = [],
    aboutTitle,
    aboutContent,
    sections = [],
    contacts = [],
    mapData = null,
    primaryButtonText = 'Связаться',
    reviewPlaceholder = 'Ваш отзыв',
    showReviews = true,
    avatarImg = '/serviceImg1.png',
    rating: configRating = null,
    reviewsCount: configReviewsCount = null,
    rooms = [],
  } = config

  const photos = config.photos || DEFAULT_PHOTOS
  const mappedReviews = useMemo(() => {
    return Array.isArray(config.reviews) ? config.reviews : []
  }, [config.reviews])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [expandedReviews, setExpandedReviews] = useState({})
  const [activeAnchor, setActiveAnchor] = useState('main')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState(null)
  const swiperRef = useRef(null)
  const scrollPositionRef = useRef(0)

  const visiblePhotos = photos.slice(0, 5)
  const remainingCount = photos.length - 5
  const showMoreButton = photos.length > 5

  const openModal = (index) => { setActiveIndex(index); setIsModalOpen(true) }
  const closeModal = () => setIsModalOpen(false)
  const handleSlideChange = (swiper) => setActiveIndex(swiper.realIndex)
  const toggleReview = (reviewId) => setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }))
  const handleStarClick = (starIndex) => setRating(starIndex + 1)

  const handleSubmitReview = async (ev) => {
    ev.preventDefault()
    if (!reviewName.trim() || !reviewText.trim() || rating < 1) {
      alert('Заполните имя, отзыв и выберите рейтинг')
      return
    }
    const idForApi = serviceId || serviceSlug
    if (!idForApi) return
    setReviewSubmitStatus(null)
    try {
      await publicServicesAPI.createReview(idForApi, {
        authorName: reviewName.trim(),
        rating,
        text: reviewText.trim(),
      })
      setReviewName('')
      setReviewText('')
      setRating(0)
      setReviewSubmitStatus('success')
    } catch (err) {
      setReviewSubmitStatus('error')
    }
  }

  const anchors = [
    { id: 'main', label: 'Основное' },
    ...(aboutTitle ? [{ id: 'about', label: aboutTitle }] : []),
    ...(rooms.length > 0 ? [{ id: 'rooms', label: 'Номера' }] : []),
    ...sections.map((s) => ({ id: s.id, label: s.title })),
    ...(mapData ? [{ id: 'map', label: 'Как добраться' }] : []),
    { id: 'contacts', label: 'Контакты' },
    ...(showReviews ? [{ id: 'reviews', label: 'Отзывы' }] : []),
  ]

  const scrollToAnchor = (anchorId) => {
    const el = document.getElementById(anchorId)
    if (el) {
      const pos = el.getBoundingClientRect().top + window.pageYOffset - 100
      window.scrollTo({ top: pos, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (isModalOpen && swiperRef.current) swiperRef.current.swiper.slideToLoop(activeIndex)
  }, [isModalOpen, activeIndex])

  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (ev) => {
      if (!swiperRef.current) return
      if (ev.key === 'ArrowLeft') swiperRef.current.swiper.slidePrev()
      else if (ev.key === 'ArrowRight') swiperRef.current.swiper.slideNext()
      else if (ev.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  useEffect(() => {
    if (isModalOpen) {
      scrollPositionRef.current = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollPositionRef.current)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150
      for (let i = anchors.length - 1; i >= 0; i--) {
        const el = document.getElementById(anchors[i].id)
        if (el && scrollPosition >= el.offsetTop) {
          setActiveAnchor(anchors[i].id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className={`${styles.main} ${common.main}`}>
      <CenterBlock>
        <div className={`${styles.servicePage} ${common.servicePage}`}>
          <div className={`${styles.bread_crumbs} ${common.bread_crumbs}`}>
            <Link to="/">Главная</Link>
            <BreadcrumbArrow />
            <Link to="/services">Услуги и сервисы</Link>
            <BreadcrumbArrow />
            <span>{breadcrumbTitle}</span>
          </div>

          <div className={`${styles.gallery} ${common.gallery}`}>
            <div className={`${styles.galleryMain} ${common.galleryMain}`} onClick={() => openModal(0)}>
              <img src={photos[0]?.src} alt="" />
            </div>
            <div className={styles.galleryGrid}>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(1, 3).map((photo, index) => (
                  <div key={index} className={`${styles.galleryItem} ${common.galleryItem}`} onClick={() => openModal(index + 1)}>
                    <img src={photo.src} alt="" />
                  </div>
                ))}
              </div>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(3, 5).map((photo, index) => {
                  const photoIndex = index + 3
                  const isLast = photoIndex === 4 && showMoreButton
                  return (
                    <div key={photoIndex} className={`${styles.galleryItem} ${common.galleryItem} ${isLast ? styles.galleryItemLast : ''}`} onClick={() => openModal(photoIndex)}>
                      <img src={photo.src} alt="" />
                      {isLast && (
                        <div className={`${styles.moreButton} ${common.moreButton}`} onClick={(ev) => { ev.stopPropagation(); openModal(5); }}>
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

          <div className={styles.serviceBlock}>
            <div className={`${styles.serviceBlock_content} ${common.serviceBlock_content}`}>
              <div id="main" className={`${styles.serviceHeader} ${common.serviceHeader}`}>
                <div className={`${styles.serviceAvatar} ${common.serviceAvatar}`}>
                  <img src={avatarImg} alt="" className={`${styles.avatarImg} ${common.avatarImg}`} />
                </div>
                <div className={styles.serviceInfo}>
                  <div className={`${styles.serviceCategory} ${common.serviceCategory}`}>{categoryLabel}</div>
                  <div className={`${styles.serviceName} ${common.serviceName}`}>{serviceName}</div>
                  <div className={styles.serviceRating}>
                    <div className={`${styles.ratingStars} ${common.ratingStars}`}>
                      <img src="/star.png" alt="" /> {configRating != null ? configRating : '—'}
                    </div>
                    <div className={`${styles.ratingFeedback} ${common.ratingFeedback}`}>
                      {configReviewsCount != null ? `${configReviewsCount} отзывов` : `${mappedReviews.length} отзывов`}
                    </div>
                  </div>
                  {tags.length > 0 && (
                    <div className={`${styles.serviceTags} ${common.serviceTags}`}>
                      {tags.map((tag, i) => (
                        <span key={i} className={`${styles.serviceTag} ${common.serviceTag}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {aboutTitle && (
                <>
                  <div id="about" className={`${styles.title} ${common.title}`}>{aboutTitle}</div>
                  <div className={`${styles.aboutText} ${common.aboutText}`}>
                    {typeof aboutContent === 'string'
                      ? <div className={common.aboutTextHtml || ''} dangerouslySetInnerHTML={{ __html: aboutContent }} />
                      : aboutContent}
                  </div>
                </>
              )}

              {rooms.length > 0 && (
                <div id="rooms">
                  <div className={`${styles.title} ${common.title}`}>Номера</div>
                  <div className={styles.roomCardsList}>
                    {rooms.map((room, roomIdx) => (
                      <div key={roomIdx} className={styles.roomCard}>
                        <div className={styles.roomCardSlider}>
                          {Array.isArray(room.images) && room.images.length > 0 ? (
                            <div className={styles.roomSliderWrap} style={{ overflow: 'hidden', background: '#f8fafc' }}>
                              <Swiper
                                modules={[Navigation]}
                                navigation
                                spaceBetween={0}
                                slidesPerView={1}
                                className={styles.roomSlider}
                              >
                                {room.images.map((src, imgIdx) => (
                                  <SwiperSlide key={imgIdx}>
                                    <div className={styles.roomSlideImgWrap}>
                                      <img src={src} alt={`${room.name} — фото ${imgIdx + 1}`} />
                                    </div>
                                  </SwiperSlide>
                                ))}
                              </Swiper>
                            </div>
                          ) : (
                            <div className={styles.roomCardSliderPlaceholder}>Нет фото</div>
                          )}
                        </div>
                        <div className={styles.roomCardInfo}>
                          {room.name && <h3 className={styles.roomCardName}>{room.name}</h3>}
                          {room.description && (
                            <div className={`${styles.roomCardDescription} ${common.aboutTextHtml || ''}`} dangerouslySetInnerHTML={{ __html: room.description }} />
                          )}
                          {room.price && <div className={styles.roomCardPrice}>{room.price}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.map((sec) => (
                <div key={sec.id} id={sec.id}>
                  <div className={`${styles.title} ${common.title}`}>{sec.title}</div>
                  <div className={`${styles.aboutText} ${common.aboutText}`}>
                    {Array.isArray(sec.content)
                      ? (
                          <ul className={common.bulletList || ''}>
                            {sec.content.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )
                      : typeof sec.content === 'string'
                        ? <div className={common.aboutTextHtml || ''} dangerouslySetInnerHTML={{ __html: sec.content }} />
                        : sec.content}
                  </div>
                </div>
              ))}

              {mapData && (
                <div id="map" className={styles.mapSection} style={{ marginBottom: 24 }}>
                  <div className={`${styles.title} ${common.title}`} style={{ marginBottom: 16 }}>Как добраться</div>
                  <YandexMapPlace
                    latitude={mapData.latitude}
                    longitude={mapData.longitude}
                    title={mapData.title}
                    location={mapData.location}
                    image={mapData.image}
                  />
                </div>
              )}

              <div id="contacts" className={`${styles.contacts} ${common.contacts}`}>
                <div className={`${styles.contactsTitle} ${common.contactsTitle}`}>Контакты</div>
                <div className={styles.contactsList}>
                  {contacts.map((c, i) => (
                    <div key={i} className={styles.contactItem}>
                      <span className={styles.contactLabel}>{c.label}:</span>
                      {c.href ? (
                        <a href={c.href} className={`${styles.contactValue} ${common.contactValue}`} target={c.target} rel={c.rel}>{c.value}</a>
                      ) : (
                        <span className={`${styles.contactValue} ${common.contactValue}`}>{c.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {showReviews && (
                <>
                  <div id="reviews" className={`${styles.title} ${common.title}`}>Отзывы</div>
                  <div className={styles.feedback}>
                    <form className={`${styles.feedbackForm} ${common.feedbackForm}`} onSubmit={handleSubmitReview}>
                      <div className={styles.feedbackFormRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" className={styles.starButton} onClick={() => handleStarClick(star - 1)}>
                            <StarIcon filled={star <= rating} />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        className={styles.feedbackFormInput}
                        placeholder="Ваше имя"
                        value={reviewName}
                        onChange={(ev) => setReviewName(ev.target.value)}
                      />
                      <textarea
                        className={styles.feedbackFormTextarea}
                        placeholder={reviewPlaceholder}
                        value={reviewText}
                        onChange={(ev) => setReviewText(ev.target.value)}
                        rows={4}
                      />
                      <button type="submit" className={`${styles.feedbackSubmitButton} ${common.feedbackSubmitButton}`}>Оставить отзыв</button>
                      {reviewSubmitStatus === 'success' && (
                        <p className={styles.reviewSubmitSuccess}>Спасибо! Отзыв отправлен на модерацию.</p>
                      )}
                      {reviewSubmitStatus === 'error' && (
                        <p className={styles.reviewSubmitError}>Не удалось отправить отзыв. Попробуйте позже.</p>
                      )}
                    </form>
                    <div className={styles.feedbackList}>
                      {(showAllReviews ? mappedReviews : mappedReviews.slice(0, 5)).map((review) => {
                        const isExpanded = expandedReviews[review.id]
                        const shortText = review.text.length > 200 ? review.text.slice(0, 200) + '...' : review.text
                        const showExpand = review.text.length > 200 && !isExpanded
                        return (
                          <div key={review.id} className={`${styles.feedbackItem} ${common.feedbackItem}`}>
                            <div className={styles.feedbackItemHeader}>
                              <div className={styles.feedbackItemLeft}>
                                <img
                                  src={review.avatar || '/no-avatar.png'}
                                  alt=""
                                  className={styles.feedbackAvatar}
                                  onError={(e) => { e.target.src = '/no-avatar.png' }}
                                />
                                <div className={styles.feedbackItemInfo}>
                                  <div className={styles.feedbackItemNameRow}>
                                    <div className={styles.feedbackItemName}>{review.name}</div>
                                    <div className={styles.feedbackItemDate}>{review.date}</div>
                                  </div>
                                  <div className={styles.feedbackItemRating}>
                                    <StarIcon filled size={16} />
                                    <span>{review.rating}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={styles.feedbackItemText}>{isExpanded ? review.text : shortText}</div>
                            {showExpand && (
                              <button
                                type="button"
                                className={`${styles.feedbackExpandButton} ${common.feedbackExpandButton}`}
                                onClick={() => toggleReview(review.id)}
                              >
                                Показать полностью
                              </button>
                            )}
                            {isExpanded && review.text.length > 200 && (
                              <button
                                type="button"
                                className={`${styles.feedbackExpandButton} ${common.feedbackExpandButton}`}
                                onClick={() => toggleReview(review.id)}
                              >
                                Свернуть
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {mappedReviews.length > 5 && (
                      <div className={styles.feedbackShowAll}>
                        <button
                          type="button"
                          className={`${styles.feedbackShowAllButton} ${common.feedbackShowAllButton}`}
                          onClick={() => setShowAllReviews((v) => !v)}
                        >
                          {showAllReviews ? 'Свернуть отзывы' : `Показать все отзывы (${mappedReviews.length})`}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={`${styles.serviceBlock_anchors} ${common.serviceBlock_anchors}`}>
              <div className={styles.anchorsList}>
                {anchors.map((anchor) => (
                  <button key={anchor.id} type="button" className={`${styles.anchorItem} ${activeAnchor === anchor.id ? `${styles.anchorItemActive} ${common.anchorItemActive}` : ''}`} onClick={() => scrollToAnchor(anchor.id)}>
                    {anchor.label}
                  </button>
                ))}
              </div>
              {/* Кнопки снизу — функционал будет позже у каждого типа услуги свой
              <div className={styles.anchorsButtons}>
                <button type="button" className={`${styles.anchorButton} ${common.anchorButton}`}>Задать вопрос</button>
                <button type="button" className={`${styles.anchorButtonPrimary} ${common.anchorButtonPrimary}`}>{primaryButtonText}</button>
              </div>
              */}
            </div>
          </div>
        </div>
      </CenterBlock>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div className={styles.modal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
            <motion.div className={styles.modalContent} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(ev) => ev.stopPropagation()}>
              <button type="button" className={styles.modalClose} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className={styles.modalMain}>
                <Swiper ref={swiperRef} modules={[Navigation]} navigation loop spaceBetween={20} slidesPerView={1} initialSlide={activeIndex} onSlideChange={handleSlideChange} className={styles.modalSwiper}>
                  {photos.map((photo, index) => (
                    <SwiperSlide key={index}><div className={styles.modalSlide}><img src={photo.src} alt="" /></div></SwiperSlide>
                  ))}
                </Swiper>
              </div>
              <div className={styles.modalThumbnails}>
                {photos.map((photo, index) => (
                  <div key={index} className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ''}`} onClick={() => { setActiveIndex(index); swiperRef.current?.swiper?.slideToLoop(index) }}>
                    <img src={photo.src} alt="" />
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
