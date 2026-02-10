'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ServiceDetail.module.css'
import g from './ServiceDetailGuide.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import routesPageStyles from '@/sections/Routes/Routes_page.module.css'
import { publicServicesAPI, getImageUrl } from '@/lib/api'
import { getMuiIconComponent } from '@/app/admin/components/WhatToBringIcons'
import YandexMapPlace from '@/components/YandexMapPlace'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'

const DEFAULT_PHOTOS = [
  { src: '/routeGalery1.png' },
  { src: '/routeGalery2.png' },
  { src: '/routeGalery3.png' },
  { src: '/routeGalery4.png' },
  { src: '/routeGalery5.png' },
  { src: '/routeGalery6.png' },
  { src: '/routeGalery7.png' },
  { src: '/routeGalery8.png' },
]

const DEFAULT_SERVICES_LIST = [
  { name: 'Индивидуальная экскурсия (до 4 человек)', price: 'от 5 000 ₽' },
  { name: 'Групповая экскурсия (до 10 человек)', price: 'от 3 000 ₽/чел' },
  { name: 'Многодневный тур (2-3 дня)', price: 'от 15 000 ₽' },
  { name: 'Фототур по живописным местам', price: 'от 7 000 ₽' },
]

function buildContactsFromService(service) {
  const items = []
  if (service?.address) items.push({ label: 'Адрес', value: service.address })
  if (service?.phone) items.push({ label: 'Телефон', value: service.phone, href: `tel:${String(service.phone).replace(/\D/g, '')}` })
  if (service?.email) items.push({ label: 'Email', value: service.email, href: `mailto:${service.email}` })
  if (service?.telegram) items.push({ label: 'Telegram', value: service.telegram, href: `https://t.me/${String(service.telegram).replace('@', '')}` })
  return items
}

export default function ServiceDetail({ serviceSlug, serviceData }) {
  const isGuide = serviceData?.category === 'Гид'
  const photos = useMemo(() => {
    if (isGuide) {
      const galleryEnabled = serviceData?.data?.galleryEnabled !== false
      const urls = serviceData?.data?.galleryImages?.length
        ? serviceData.data.galleryImages
        : serviceData?.images
      if (!galleryEnabled || !urls?.length) return []
      return urls.map((path) => ({ src: getImageUrl(path) }))
    }
    if (serviceData?.images?.length) {
      return serviceData.images.map((path) => ({ src: getImageUrl(path) }))
    }
    return DEFAULT_PHOTOS
  }, [isGuide, serviceData?.data?.galleryEnabled, serviceData?.data?.galleryImages, serviceData?.images])

  const avatarSrc = useMemo(() => {
    if (isGuide && serviceData?.data?.avatar) return getImageUrl(serviceData.data.avatar)
    if (serviceData?.images?.[0]) return getImageUrl(serviceData.images[0])
    return '/serviceImg1.png'
  }, [isGuide, serviceData?.data?.avatar, serviceData?.images])

  const displayName = serviceData?.title ?? 'Хубиев Артур Арсенович'
  const categoryLabel = serviceData?.category ?? 'Гид'
  const aboutContent = serviceData?.data?.aboutContent ?? serviceData?.description ?? null
  const defaultAbout = (
    <>
      <p>Профессиональный гид с опытом работы более 10 лет. Специализируюсь на горных маршрутах и культурных экскурсиях по Карачаево-Черкесии.</p>
      <p>Знаю все тайные места региона, провожу авторские экскурсии по историческим местам, горным тропам и живописным ущельям. Работаю как с индивидуальными туристами, так и с группами.</p>
      <p>Все маршруты разработаны с учётом безопасности и комфорта туристов. Предоставляю необходимое снаряжение для горных походов.</p>
    </>
  )
  const contactsList = useMemo(() => {
    if (serviceData?.data?.contacts?.length) return serviceData.data.contacts
    return buildContactsFromService(serviceData)
  }, [serviceData])
  const servicesList = useMemo(() => {
    const fromData = serviceData?.data?.pricesInData
    if (Array.isArray(fromData) && fromData.length > 0) return fromData
    if (Array.isArray(serviceData?.prices) && serviceData.prices.length > 0) {
      return serviceData.prices.map((p) => ({ name: p.name || p.title || '', price: p.price || p.value || '' }))
    }
    return DEFAULT_SERVICES_LIST
  }, [serviceData?.data?.pricesInData, serviceData?.prices])
  const certificateList = useMemo(() => {
    const fromData = serviceData?.data?.certificatesInData
    if (Array.isArray(fromData) && fromData.length > 0) {
      return fromData.map((c) => (typeof c === 'string' ? { url: c, caption: '' } : { url: c?.url || '', caption: c?.caption || '' }))
    }
    if (Array.isArray(serviceData?.certificates) && serviceData.certificates.length > 0) {
      return serviceData.certificates.map((c) => (typeof c === 'string' ? { url: c, caption: '' } : { url: c?.url || c?.path || '', caption: '' }))
    }
    return []
  }, [serviceData?.data?.certificatesInData, serviceData?.certificates])
  const reviewsCountLabel = serviceData?.reviewsCount != null ? `${serviceData.reviewsCount} отзывов` : '0 отзывов'

  const guideRoutes = useMemo(() => {
    if (!isGuide) return []
    return Array.isArray(serviceData?.routes) ? serviceData.routes : []
  }, [isGuide, serviceData?.routes])

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

  const showGallery = photos.length > 0
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
    setActiveIndex(swiper.realIndex)
  }

  useEffect(() => {
    if (isModalOpen && swiperRef.current) {
      swiperRef.current.swiper.slideToLoop(activeIndex)
    }
  }, [isModalOpen, activeIndex])

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
      if (!isModalOpen) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
      }
    }
  }, [isModalOpen])

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
    { id: 'about', label: 'О специалисте' },
    { id: 'services', label: 'Услуги' },
    { id: 'certificates', label: 'Сертификаты' },
    ...(guideRoutes.length > 0 ? [{ id: 'routes', label: 'Маршруты' }] : []),
    { id: 'reviews', label: 'Отзывы' },
  ]

  const scrollToAnchor = (anchorId) => {
    const element = document.getElementById(anchorId)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150

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
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className={`${styles.main} ${g.main}`}>
      <CenterBlock>
        <div className={`${styles.servicePage} ${g.servicePage}`}>
          <div className={`${styles.bread_crumbs} ${g.bread_crumbs}`}>
            <Link href="/">Главная</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link to="/services">Услуги и сервисы</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{displayName}</span>
          </div>

          {showGallery && (
          <div className={`${styles.gallery} ${photos.length === 1 ? styles.galleryCount1 : photos.length === 2 ? styles.galleryCount2 : photos.length === 3 ? styles.galleryCount3 : ''} ${g.gallery}`}>
            {photos.length === 1 && (
              <div className={`${styles.galleryFull} ${g.galleryMain}`} onClick={() => openModal(0)}>
                <img src={photos[0]?.src} alt="Фото 1" />
              </div>
            )}
            {photos.length === 2 && (
              <>
                <div className={`${styles.galleryHalf} ${g.galleryMain}`} onClick={() => openModal(0)}>
                  <img src={photos[0]?.src} alt="Фото 1" />
                </div>
                <div className={`${styles.galleryHalf} ${g.galleryMain}`} onClick={() => openModal(1)}>
                  <img src={photos[1]?.src} alt="Фото 2" />
                </div>
              </>
            )}
            {photos.length === 3 && (
              <>
                <div className={`${styles.galleryThirdLeft} ${g.galleryMain}`} onClick={() => openModal(0)}>
                  <img src={photos[0]?.src} alt="Фото 1" />
                </div>
                <div className={styles.galleryThirdRight}>
                  <div className={`${styles.galleryThirdRightItem} ${g.galleryItem}`} onClick={() => openModal(1)}>
                    <img src={photos[1]?.src} alt="Фото 2" />
                  </div>
                  <div className={`${styles.galleryThirdRightItem} ${g.galleryItem}`} onClick={() => openModal(2)}>
                    <img src={photos[2]?.src} alt="Фото 3" />
                  </div>
                </div>
              </>
            )}
            {photos.length >= 4 && (
              <>
                <div className={`${styles.galleryMain} ${g.galleryMain}`} onClick={() => openModal(0)}>
                  <img src={photos[0]?.src} alt="Фото 1" />
                </div>
                <div className={styles.galleryGrid}>
                  <div className={styles.galleryGridRow}>
                    {visiblePhotos.slice(1, 3).map((photo, index) => {
                      const photoIndex = index + 1
                      return (
                        <div
                          key={photoIndex}
                          className={`${styles.galleryItem} ${g.galleryItem}`}
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
                          className={`${styles.galleryItem} ${g.galleryItem} ${isLast ? styles.galleryItemLast : ''}`}
                          onClick={() => openModal(photoIndex)}
                        >
                          <img src={photo.src} alt={`Фото ${photoIndex + 1}`} />
                          {isLast && (
                            <div
                              className={`${styles.moreButton} ${g.moreButton}`}
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
              </>
            )}
          </div>
          )}

          <div className={styles.serviceBlock}>
            <div className={`${styles.serviceBlock_content} ${g.serviceBlock_content}`}>
              <div id="main" className={`${styles.serviceHeader} ${g.serviceHeader}`}>
                <div className={`${styles.serviceAvatar} ${g.serviceAvatar}`}>
                  <img src={avatarSrc} alt="Аватар" className={`${styles.avatarImg} ${g.avatarImg}`} />
                  <img src="/verification.png" alt="" className={styles.verificationBadge} />
                </div>
                <div className={styles.serviceInfo}>
                  <div className={styles.serviceHeaderTopRow}>
                    <div className={`${styles.serviceCategory} ${g.serviceCategory}`}>{categoryLabel}</div>
                    {serviceData?.id && (
                      <div className={styles.serviceFavorite}>
                        <FavoriteButton entityType="service" entityId={serviceData.id} />
                      </div>
                    )}
                  </div>
                  <div className={`${styles.serviceName} ${g.serviceName}`}>{displayName}</div>
                  <div className={styles.serviceRating}>
                    <div className={`${styles.ratingStars} ${g.ratingStars}`}>
                      <img src="/star.png" alt="" /> {serviceData?.rating ?? '—'}
                    </div>
                    <div className={`${styles.ratingFeedback} ${g.ratingFeedback}`}>{reviewsCountLabel}</div>
                  </div>
                </div>
              </div>

              <div id="about" className={`${styles.title} ${g.title}`}>О специалисте</div>
              <div className={`${styles.aboutText} ${g.aboutText}`}>
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

              {serviceData?.latitude != null && serviceData?.longitude != null && (
                <div className={`${styles.title} ${g.title}`} style={{ marginBottom: 16 }}>Как добраться</div>
              )}
              {serviceData?.latitude != null && serviceData?.longitude != null && (
                <div style={{ marginBottom: 24 }}>
                  <YandexMapPlace
                    latitude={serviceData.latitude}
                    longitude={serviceData.longitude}
                    title={displayName}
                    location={serviceData.address}
                    image={avatarSrc !== '/serviceImg1.png' ? avatarSrc : null}
                  />
                </div>
              )}

              {contactsList.length > 0 && (
                <div className={`${styles.contacts} ${g.contacts}`}>
                  <div className={`${styles.contactsTitle} ${g.contactsTitle}`}>Контакты</div>
                  <div className={styles.contactsList}>
                    {contactsList.map((c, i) => {
                      const isIconUrl = c.icon && (typeof c.icon === 'string' && (c.icon.startsWith('http') || c.icon.startsWith('/') || c.icon.includes('uploads')))
                      const IconComponent = c.icon && !isIconUrl ? getMuiIconComponent(c.icon) : null
                      return (
                        <div key={i} className={styles.contactItem}>
                          {c.icon && (
                            <span className={styles.contactIcon}>
                              {isIconUrl ? (
                                <img src={getImageUrl(c.icon)} alt="" className={styles.contactIconImg} />
                              ) : IconComponent ? (
                                <IconComponent size={22} className={styles.contactIconSvg} />
                              ) : null}
                            </span>
                          )}
                          <span className={styles.contactLabel}>{c.label}:</span>
                          {c.href ? (
                            <a href={c.href} className={`${styles.contactValue} ${g.contactValue}`} target={c.target} rel={c.rel}>{c.value}</a>
                          ) : (
                            <span className={`${styles.contactValue} ${g.contactValue}`}>{c.value}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div id="services" className={`${styles.title} ${g.title}`}>Услуги и цены</div>
              <div className={styles.servicesList}>
                {servicesList.map((service, index) => (
                  <div key={index} className={`${styles.servicesListItem} ${g.servicesListItem}`}>
                    <div className={styles.servicesListItemName}>{service.name}</div>
                    <div className={`${styles.servicesListItemPrice} ${g.servicesListItemPrice}`}>{service.price}</div>
                  </div>
                ))}
              </div>

              {(certificateList.length > 0 || (!serviceData && true)) && (
                <>
                  <div id="certificates" className={`${styles.title} ${g.title}`}>Сертификаты и документы</div>
                  <div className={styles.certificates}>
                    {certificateList.length > 0
                      ? certificateList.map((item, i) => (
                          <div key={i} className={`${styles.certificateItem} ${g.certificateItem}`}>
                            <img src={getImageUrl(item.url)} alt={item.caption || 'Сертификат'} />
                            {item.caption ? <div className={styles.certificateCaption}>{item.caption}</div> : null}
                          </div>
                        ))
                      : (
                        <>
                          <div className={`${styles.certificateItem} ${g.certificateItem}`}><img src="/routeGalery1.png" alt="Сертификат" /></div>
                          <div className={`${styles.certificateItem} ${g.certificateItem}`}><img src="/routeGalery2.png" alt="Сертификат" /></div>
                          <div className={`${styles.certificateItem} ${g.certificateItem}`}><img src="/routeGalery3.png" alt="Сертификат" /></div>
                        </>
                      )}
                  </div>
                </>
              )}

              {guideRoutes.length > 0 && (
                <>
                  <div id="routes" className={`${styles.title} ${g.title}`}>Маршруты гида</div>
                  <div className={`${routesPageStyles.routes} ${g.routesWrap}`}>
                    <div className={routesPageStyles.routesShow}>
                      {guideRoutes.map((route, index) => (
                        <RouteBlock key={route.slug || route.id || index} route={route} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div id="reviews" className={`${styles.title} ${g.title}`}>Отзывы</div>
              <div className={styles.feedback}>
                <form className={`${styles.feedbackForm} ${g.feedbackForm}`} onSubmit={handleSubmitReview}>
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
                  <button type="submit" className={`${styles.feedbackSubmitButton} ${g.feedbackSubmitButton}`}>
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
                    const shortText = review.text.length > 200 ? review.text.substring(0, 200) + '...' : review.text
                    const showExpandButton = review.text.length > 200 && !isExpanded

                    return (
                      <div key={review.id} className={`${styles.feedbackItem} ${g.feedbackItem}`}>
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
                            className={`${styles.feedbackExpandButton} ${g.feedbackExpandButton}`}
                            onClick={() => toggleReview(review.id)}
                          >
                            Показать полностью
                          </button>
                        )}
                        {isExpanded && review.text.length > 200 && (
                          <button
                            className={`${styles.feedbackExpandButton} ${g.feedbackExpandButton}`}
                            onClick={() => toggleReview(review.id)}
                          >
                            Свернуть
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {reviews.length > 5 && (
                  <div className={styles.feedbackShowAll}>
                    <button
                      type="button"
                      className={`${styles.feedbackShowAllButton} ${g.feedbackShowAllButton}`}
                      onClick={() => setShowAllReviews((v) => !v)}
                    >
                      {showAllReviews ? 'Свернуть отзывы' : `Показать все отзывы (${reviews.length})`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.serviceBlock_anchors} ${g.serviceBlock_anchors}`}>
              <div className={styles.anchorsList}>
                {anchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    className={`${styles.anchorItem} ${activeAnchor === anchor.id ? `${styles.anchorItemActive} ${g.anchorItemActive}` : ''}`}
                    onClick={() => scrollToAnchor(anchor.id)}
                  >
                    {anchor.label}
                  </button>
                ))}
              </div>
              {/* Кнопки снизу — функционал будет позже
              <div className={styles.anchorsButtons}>
                <button className={`${styles.anchorButton} ${g.anchorButton}`}>
                  Связаться
                </button>
                <button className={`${styles.anchorButtonPrimary} ${g.anchorButtonPrimary}`}>
                  Забронировать
                </button>
              </div>
              */}
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
