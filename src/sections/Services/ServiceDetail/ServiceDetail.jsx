'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ServiceDetail.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Link from 'next/link'
import RouteBlock from '@/components/RouteBlock/RouteBlock'

export default function ServiceDetail({ serviceSlug }) {
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [expandedReviews, setExpandedReviews] = useState({})
  const [activeAnchor, setActiveAnchor] = useState('main')
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Михаил',
      date: '12 сентября 2025',
      rating: 5.0,
      text: 'Отличный гид! Артур провёл потрясающую экскурсию по горным маршрутам. Знает все тайные места, рассказывает интересные истории. Очень рекомендую для тех, кто хочет познакомиться с настоящим Кавказом.',
      avatar: '/avatar_feedback.png',
    },
    {
      id: 2,
      name: 'Андрей',
      date: '12 сентября 2025',
      rating: 5.0,
      text: 'Профессионал своего дела. Экскурсия была организована на высшем уровне. Артур учёл все наши пожелания, помог выбрать оптимальный маршрут с учётом физической подготовки группы. Обязательно обращусь снова!',
      avatar: '',
    },
    {
      id: 3,
      name: 'Анастасия',
      date: '12 сентября 2025',
      rating: 5.0,
      text: 'Незабываемые впечатления! Артур не только показал красивейшие места, но и обеспечил полную безопасность на маршруте. Очень внимательный и ответственный гид.',
      avatar: '',
    }
  ])
  const swiperRef = useRef(null)
  const scrollPositionRef = useRef(0)

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

  const anchors = [
    { id: 'main', label: 'Основное' },
    { id: 'about', label: 'О специалисте' },
    { id: 'services', label: 'Услуги' },
    { id: 'certificates', label: 'Сертификаты' },
    { id: 'routes', label: 'Маршруты' },
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

  const servicesList = [
    { name: 'Индивидуальная экскурсия (до 4 человек)', price: 'от 5 000 ₽' },
    { name: 'Групповая экскурсия (до 10 человек)', price: 'от 3 000 ₽/чел' },
    { name: 'Многодневный тур (2-3 дня)', price: 'от 15 000 ₽' },
    { name: 'Фототур по живописным местам', price: 'от 7 000 ₽' },
  ]

  return (
    <main className={styles.main}>
      <CenterBlock>
        <div className={styles.servicePage}>
          <div className={styles.bread_crumbs}>
            <Link href="/">Главная</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link href="/services">Услуги и сервисы</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Хубиев Артур Арсенович</span>
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

          <div className={styles.serviceBlock}>
            <div className={styles.serviceBlock_content}>
              <div id="main" className={styles.serviceHeader}>
                <div className={styles.serviceAvatar}>
                  <img src="/serviceImg1.png" alt="Аватар" className={styles.avatarImg} />
                  <img src="/verification.png" alt="" className={styles.verificationBadge} />
                </div>
                <div className={styles.serviceInfo}>
                  <div className={styles.serviceCategory}>Гид</div>
                  <div className={styles.serviceName}>Хубиев Артур Арсенович</div>
                  <div className={styles.serviceRating}>
                    <div className={styles.ratingStars}>
                      <img src="/star.png" alt="" /> 5.0
                    </div>
                    <div className={styles.ratingFeedback}>4 отзыва</div>
                  </div>
                </div>
              </div>

              <div id="about" className={styles.title}>О специалисте</div>
              <div className={styles.aboutText}>
                <p>
                  Профессиональный гид с опытом работы более 10 лет. Специализируюсь на горных маршрутах 
                  и культурных экскурсиях по Карачаево-Черкесии.
                </p>
                <p>
                  Знаю все тайные места региона, провожу авторские экскурсии по историческим местам, 
                  горным тропам и живописным ущельям. Работаю как с индивидуальными туристами, 
                  так и с группами.
                </p>
                <p>
                  Все маршруты разработаны с учётом безопасности и комфорта туристов. 
                  Предоставляю необходимое снаряжение для горных походов.
                </p>
              </div>

              <div className={styles.contacts}>
                <div className={styles.contactsTitle}>Контакты</div>
                <div className={styles.contactsList}>
                  <div className={styles.contactItem}>
                    <span className={styles.contactLabel}>Телефон:</span>
                    <a href="tel:+79281234567" className={styles.contactValue}>+7 (928) 123-45-67</a>
                  </div>
                  <div className={styles.contactItem}>
                    <span className={styles.contactLabel}>Email:</span>
                    <a href="mailto:guide@example.com" className={styles.contactValue}>guide@example.com</a>
                  </div>
                  <div className={styles.contactItem}>
                    <span className={styles.contactLabel}>Telegram:</span>
                    <a href="https://t.me/guide_kchr" className={styles.contactValue} target="_blank" rel="noopener noreferrer">@guide_kchr</a>
                  </div>
                </div>
              </div>

              <div id="services" className={styles.title}>Услуги и цены</div>
              <div className={styles.servicesList}>
                {servicesList.map((service, index) => (
                  <div key={index} className={styles.servicesListItem}>
                    <div className={styles.servicesListItemName}>{service.name}</div>
                    <div className={styles.servicesListItemPrice}>{service.price}</div>
                  </div>
                ))}
              </div>

              <div id="certificates" className={styles.title}>Сертификаты и документы</div>
              <div className={styles.certificates}>
                <div className={styles.certificateItem}>
                  <img src="/routeGalery1.png" alt="Сертификат" />
                </div>
                <div className={styles.certificateItem}>
                  <img src="/routeGalery2.png" alt="Сертификат" />
                </div>
                <div className={styles.certificateItem}>
                  <img src="/routeGalery3.png" alt="Сертификат" />
                </div>
              </div>

              <div id="routes" className={styles.title}>Маршруты гида</div>
              <div className={styles.guideRoutes}>
                <RouteBlock title="На границе регионов: Кисловодск - Медовые водопады" />
                <RouteBlock title="Горные вершины Карачаево-Черкесии" />
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
            </div>

            <div className={styles.serviceBlock_anchors}>
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
                  Связаться
                </button>
                <button className={styles.anchorButtonPrimary}>
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
