'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ServiceDetail.module.css'
import common from './ServiceDetailCommon.module.css'
import e from './EquipmentRental.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'
import { publicServicesAPI, getImageUrl } from '@/lib/api'
import YandexMapPlace from '@/components/YandexMapPlace'

const DEFAULT_PHOTOS = [
  { src: '/routeGalery1.png' },
  { src: '/routeGalery2.png' },
  { src: '/routeGalery3.png' },
  { src: '/routeGalery4.png' },
  { src: '/routeGalery5.png' },
]

const DEFAULT_EQUIPMENT = [
  { name: 'Палатка 2-местная', note: 'в комплекте чехол, колышки', price: '500 ₽/сут' },
  { name: 'Спальник', note: 'до −5 °C', price: '300 ₽/сут' },
  { name: 'Треккинговые палки', note: 'пара', price: '200 ₽/сут' },
  { name: 'Рюкзак 50–70 л', note: 'с rain cover', price: '400 ₽/сут' },
  { name: 'Горелка + газ', note: 'комплект на 2–3 дня', price: '350 ₽/сут' },
  { name: 'Коврик туристический', note: 'пенка или надувной', price: '150 ₽/сут' },
]

const DEFAULT_CONDITIONS = [
  'Залог или документ (паспорт) оставляется на время проката.',
  'Минимальный срок проката — 1 сутки. При аренде от 3 суток действует скидка.',
  'Оборудование выдаётся чистым и исправным; при возврате ожидается в том же виде.',
  'Повреждение или утрата компенсируются согласно прайсу и договору.',
  'Заблаговременное бронирование рекомендуется в сезон (июль–сентябрь).',
]

function buildContactsFromService(service) {
  const items = []
  if (service?.address) items.push({ label: 'Адрес', value: service.address })
  if (service?.phone) items.push({ label: 'Телефон', value: service.phone, href: `tel:${String(service.phone).replace(/\D/g, '')}` })
  if (service?.email) items.push({ label: 'Email', value: service.email, href: `mailto:${service.email}` })
  if (service?.telegram) items.push({ label: 'Telegram', value: service.telegram, href: `https://t.me/${String(service.telegram).replace('@', '')}` })
  return items
}

/**
 * Страница услуги «Прокат оборудования».
 * Визуал в одном стиле с гидами и активностями; контент под прокат: каталог, условия, контакты.
 */
export default function EquipmentRentalDetail({ serviceSlug, serviceData }) {
  const photos = useMemo(() => {
    if (serviceData?.images?.length) {
      return serviceData.images.map((path) => ({ src: getImageUrl(path) }))
    }
    return DEFAULT_PHOTOS
  }, [serviceData?.images])

  const avatarSrc = useMemo(() => {
    if (serviceData?.data?.avatar) return getImageUrl(serviceData.data.avatar)
    if (serviceData?.images?.[0]) return getImageUrl(serviceData.images[0])
    return '/serviceImg3.png'
  }, [serviceData?.data?.avatar, serviceData?.images])

  const serviceName = serviceData?.title ?? 'Прокат туристического снаряжения'
  const aboutContent = serviceData?.data?.aboutContent ?? serviceData?.description ?? null
  const defaultAbout = (
    <>
      <p>Предлагаем в аренду туристическое снаряжение для походов и отдыха в горах: палатки, спальники, рюкзаки, горелки, треккинговые палки и другое. Всё оборудование регулярно обслуживается и готово к использованию.</p>
      <p>Удобное расположение в посёлке Архыз — можно взять снаряжение перед выездом на маршрут и сдать по возвращении. Работаем без выходных в сезон. При аренде от нескольких суток — скидки.</p>
    </>
  )
  const equipmentItems = useMemo(() => {
    const fromData = serviceData?.data?.equipmentItems
    if (Array.isArray(fromData) && fromData.length > 0) return fromData
    return DEFAULT_EQUIPMENT
  }, [serviceData?.data?.equipmentItems])
  const criteriaList = useMemo(() => {
    const fromData = serviceData?.data?.criteriaList
    if (Array.isArray(fromData) && fromData.length > 0) return fromData.filter((s) => String(s).trim())
    return []
  }, [serviceData?.data?.criteriaList])
  const conditions = useMemo(() => {
    const fromData = serviceData?.data?.conditions
    if (Array.isArray(fromData) && fromData.length > 0) return fromData.filter((s) => String(s).trim())
    return DEFAULT_CONDITIONS
  }, [serviceData?.data?.conditions])
  const reviewsCountLabel = serviceData?.reviewsCount != null ? `${serviceData.reviewsCount} отзывов` : '0 отзывов'
  const reviews = useMemo(() => {
    const list = Array.isArray(serviceData?.reviews) ? serviceData.reviews : []
    return list.map((r) => ({
      id: r.id,
      name: r.authorName || 'Гость',
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
      rating: r.rating ?? 5,
      text: r.text || '',
      avatar: r.authorAvatar || '',
    }))
  }, [serviceData?.reviews])
  const contactsList = useMemo(() => {
    if (serviceData?.data?.contacts?.length) return serviceData.data.contacts
    return buildContactsFromService(serviceData)
  }, [serviceData])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [expandedReviews, setExpandedReviews] = useState({})
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [activeAnchor, setActiveAnchor] = useState('main')
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState(null)

  const swiperRef = useRef(null)
  const scrollPositionRef = useRef(0)

  const visiblePhotos = photos.slice(0, 5)
  const remainingCount = photos.length - 5
  const showMoreButton = photos.length > 5

  const openModal = (index) => {
    setActiveIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const handleSlideChange = (swiper) => setActiveIndex(swiper.realIndex)

  useEffect(() => {
    if (isModalOpen && swiperRef.current) {
      swiperRef.current.swiper.slideToLoop(activeIndex)
    }
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

  const toggleReview = (reviewId) => {
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }))
  }

  const handleStarClick = (starIndex) => setRating(starIndex + 1)

  const handleSubmitReview = async (ev) => {
    ev.preventDefault()
    if (!reviewName.trim() || !reviewText.trim() || rating < 1) {
      alert('Пожалуйста, заполните все поля и выберите рейтинг')
      return
    }
    const serviceId = serviceData?.id || serviceSlug
    if (!serviceId) return
    setReviewSubmitStatus(null)
    try {
      await publicServicesAPI.createReview(serviceId, {
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
    { id: 'about', label: 'О прокате' },
    { id: 'catalog', label: 'Каталог' },
    { id: 'conditions', label: 'Условия' },
    { id: 'contacts', label: 'Контакты' },
    { id: 'reviews', label: 'Отзывы' },
  ]

  const scrollToAnchor = (anchorId) => {
    const el = document.getElementById(anchorId)
    if (el) {
      const offset = 100
      const pos = el.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top: pos, behavior: 'smooth' })
    }
  }

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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to="/services">Услуги и сервисы</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{serviceName}</span>
          </div>

          <div className={`${styles.gallery} ${common.gallery}`}>
            <div className={`${styles.galleryMain} ${common.galleryMain}`} onClick={() => openModal(0)}>
              <img src={photos[0]?.src} alt="Фото проката 1" />
            </div>
            <div className={styles.galleryGrid}>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(1, 3).map((photo, index) => (
                  <div
                    key={index}
                    className={`${styles.galleryItem} ${common.galleryItem}`}
                    onClick={() => openModal(index + 1)}
                  >
                    <img src={photo.src} alt={`Фото проката ${index + 2}`} />
                  </div>
                ))}
              </div>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(3, 5).map((photo, index) => {
                  const photoIndex = index + 3
                  const isLast = photoIndex === 4 && showMoreButton
                  return (
                    <div
                      key={photoIndex}
                      className={`${styles.galleryItem} ${common.galleryItem} ${isLast ? styles.galleryItemLast : ''}`}
                      onClick={() => openModal(photoIndex)}
                    >
                      <img src={photo.src} alt={`Фото проката ${photoIndex + 1}`} />
                      {isLast && (
                        <div
                          className={`${styles.moreButton} ${common.moreButton}`}
                          onClick={(ev) => { ev.stopPropagation(); openModal(5); }}
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

          <div className={styles.serviceBlock}>
            <div className={`${styles.serviceBlock_content} ${common.serviceBlock_content}`}>
              <div id="main" className={`${styles.serviceHeader} ${common.serviceHeader}`}>
                <div className={`${styles.serviceAvatar} ${common.serviceAvatar}`}>
                  <img src={avatarSrc} alt="Прокат" className={`${styles.avatarImg} ${common.avatarImg}`} />
                </div>
                <div className={styles.serviceInfo}>
                  <div className={`${styles.serviceCategory} ${common.serviceCategory}`}>Прокат оборудования</div>
                  <div className={`${styles.serviceName} ${common.serviceName}`}>{serviceName}</div>
                  <div className={styles.serviceRating}>
                    <div className={`${styles.ratingStars} ${common.ratingStars}`}>
                      <img src="/star.png" alt="" /> {serviceData?.rating ?? '5.0'}
                    </div>
                    <div className={`${styles.ratingFeedback} ${common.ratingFeedback}`}>{reviewsCountLabel}</div>
                  </div>
                  {criteriaList.length > 0 && (
                    <div className={`${styles.serviceTags} ${common.serviceTags}`}>
                      {criteriaList.map((tag, i) => (
                        <span key={i} className={`${styles.serviceTag} ${common.serviceTag}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div id="about" className={`${styles.title} ${common.title}`}>О прокате</div>
              <div className={`${styles.aboutText} ${common.aboutText}`}>
                {aboutContent != null && aboutContent !== '' ? (
                  typeof aboutContent === 'string' ? (
                    <div className={styles.aboutTextHtml} dangerouslySetInnerHTML={{ __html: aboutContent }} />
                  ) : (
                    aboutContent
                  )
                ) : (
                  defaultAbout
                )}
              </div>

              <div id="catalog" className={`${styles.title} ${common.title}`}>Каталог оборудования</div>
              <div className={`${e.equipmentBlock}`}>
                <div className={e.equipmentList}>
                  {equipmentItems.map((item, index) => (
                    <div key={index} className={e.equipmentItem}>
                      <div>
                        <div className={e.equipmentItemName}>{item.name}</div>
                        {item.note && <div className={e.equipmentItemNote}>{item.note}</div>}
                      </div>
                      <div className={e.equipmentItemPrice}>{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="conditions" className={`${styles.title} ${common.title}`}>Условия проката</div>
              <div className={`${styles.aboutText} ${common.aboutText}`}>
                <ul className={e.conditionsList}>
                  {conditions.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </div>

              {serviceData?.latitude != null && serviceData?.longitude != null && (
                <>
                  <div className={`${styles.title} ${common.title}`} style={{ marginBottom: 16 }}>Как добраться</div>
                  <div style={{ marginBottom: 24 }}>
                    <YandexMapPlace
                      latitude={serviceData.latitude}
                      longitude={serviceData.longitude}
                      title={serviceData?.title}
                      location={serviceData?.address}
                      image={serviceData?.images?.[0] ? getImageUrl(serviceData.images[0]) : null}
                    />
                  </div>
                </>
              )}

              {contactsList.length > 0 && (
                <div id="contacts" className={`${styles.contacts} ${common.contacts}`}>
                  <div className={`${styles.contactsTitle} ${common.contactsTitle}`}>Контакты</div>
                  <div className={styles.contactsList}>
                    {contactsList.map((c, i) => (
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
              )}

              <div id="reviews" className={`${styles.title} ${common.title}`}>Отзывы</div>
              <div className={styles.feedback}>
                <form className={`${styles.feedbackForm} ${common.feedbackForm}`} onSubmit={handleSubmitReview}>
                  <div className={styles.feedbackFormRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={styles.starButton}
                        onClick={() => handleStarClick(star - 1)}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= rating ? '#FFD700' : 'none'} stroke={star <= rating ? '#FFD700' : '#CCCCCC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    onChange={(ev) => setReviewName(ev.target.value)}
                  />
                  <textarea
                    className={styles.feedbackFormTextarea}
                    placeholder="Ваш отзыв о прокате"
                    value={reviewText}
                    onChange={(ev) => setReviewText(ev.target.value)}
                    rows={4}
                  />
                  <button type="submit" className={`${styles.feedbackSubmitButton} ${common.feedbackSubmitButton}`}>
                    Оставить отзыв
                  </button>
                  {reviewSubmitStatus === 'success' && (
                    <p className={styles.reviewSubmitSuccess}>Спасибо! Отзыв отправлен на модерацию.</p>
                  )}
                  {reviewSubmitStatus === 'error' && (
                    <p className={styles.reviewSubmitError}>Не удалось отправить отзыв. Попробуйте позже.</p>
                  )}
                </form>
                <div className={styles.feedbackList}>
                  {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review) => {
                    const isExpanded = expandedReviews[review.id]
                    const shortText = review.text.length > 200 ? review.text.slice(0, 200) + '...' : review.text
                    const showExpand = review.text.length > 200 && !isExpanded
                    return (
                      <div key={review.id} className={`${styles.feedbackItem} ${common.feedbackItem}`}>
                        <div className={styles.feedbackItemHeader}>
                          <div className={styles.feedbackItemLeft}>
                            <img src={review.avatar || '/no-avatar.png'} alt={review.name} className={styles.feedbackAvatar} onError={(ev) => { ev.target.src = '/no-avatar.png' }} />
                            <div className={styles.feedbackItemInfo}>
                              <div className={styles.feedbackItemNameRow}>
                                <div className={styles.feedbackItemName}>{review.name}</div>
                                <div className={styles.feedbackItemDate}>{review.date}</div>
                              </div>
                              <div className={styles.feedbackItemRating}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                <span>{review.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.feedbackItemText}>{isExpanded ? review.text : shortText}</div>
                        {showExpand && <button type="button" className={`${styles.feedbackExpandButton} ${common.feedbackExpandButton}`} onClick={() => toggleReview(review.id)}>Показать полностью</button>}
                        {isExpanded && review.text.length > 200 && <button type="button" className={`${styles.feedbackExpandButton} ${common.feedbackExpandButton}`} onClick={() => toggleReview(review.id)}>Свернуть</button>}
                      </div>
                    )
                  })}
                </div>
                {reviews.length > 5 && (
                  <div className={styles.feedbackShowAll}>
                    <button
                      type="button"
                      className={`${styles.feedbackShowAllButton} ${common.feedbackShowAllButton}`}
                      onClick={() => setShowAllReviews((v) => !v)}
                    >
                      {showAllReviews ? 'Свернуть отзывы' : `Показать все отзывы (${reviews.length})`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.serviceBlock_anchors} ${common.serviceBlock_anchors}`}>
              <div className={styles.anchorsList}>
                {anchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    type="button"
                    className={`${styles.anchorItem} ${activeAnchor === anchor.id ? `${styles.anchorItemActive} ${common.anchorItemActive}` : ''}`}
                    onClick={() => scrollToAnchor(anchor.id)}
                  >
                    {anchor.label}
                  </button>
                ))}
              </div>
              {/* Кнопки снизу — функционал будет позже
              <div className={styles.anchorsButtons}>
                <button type="button" className={`${styles.anchorButton} ${common.anchorButton}`}>Задать вопрос</button>
                <button type="button" className={`${styles.anchorButtonPrimary} ${common.anchorButtonPrimary}`}>Оформить заявку на прокат</button>
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
                    <SwiperSlide key={index}>
                      <div className={styles.modalSlide}><img src={photo.src} alt={`Фото проката ${index + 1}`} /></div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              <div className={styles.modalThumbnails}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ''}`}
                    onClick={() => { setActiveIndex(index); swiperRef.current?.swiper?.slideToLoop(index) }}
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
