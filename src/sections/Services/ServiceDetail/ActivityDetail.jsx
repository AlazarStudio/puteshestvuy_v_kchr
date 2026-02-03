import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ServiceDetail.module.css'
import a from './ActivityDetail.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'
import { getImageUrl } from '@/lib/api'

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

const DEFAULT_PROGRAM = [
  { title: 'Встреча и инструктаж', text: 'Сбор группы, знакомство с инструкторами, раздача и проверка экипировки, подробный инструктаж по технике безопасности.' },
  { title: 'Разминка и отработка базовых навыков', text: 'Небольшая разминка и отработка ключевых элементов активности в безопасных условиях.' },
  { title: 'Основная часть программы', text: 'Маршрут по заранее подготовленному треку с несколькими живописными точками для фото и отдыха.' },
  { title: 'Финал и обратная связь', text: 'Возвращение в точку старта, разбор программы, рекомендации по дальнейшим маршрутам и активностям.' },
]

const DEFAULT_EQUIPMENT = [
  'Удобная треккинговая обувь или кроссовки с хорошей фиксацией',
  'Ветрозащитная куртка и лёгкая теплая одежда по погоде',
  'Перчатки и кепка/панама в зависимости от сезона',
  'Небольшой рюкзак (10–20 л) для личных вещей',
  'Запас воды (от 0.5 до 1.5 л на человека)',
  'Солнцезащитный крем и солнцезащитные очки',
]

const DEFAULT_REQUIREMENTS = [
  'Возраст участников — от 8 лет (для детей — в сопровождении взрослых)',
  'Отсутствие серьёзных медицинских противопоказаний к физической нагрузке',
  'Готовность следовать инструкциям гидов и инструкторов',
  'Базовый уровень физической подготовки (возможно адаптировать под группу)',
]

const DEFAULT_SAFETY = [
  'Всю программу сопровождает сертифицированный инструктор и/или гид.',
  'Перед началом активности проводится обязательный инструктаж по технике безопасности.',
  'Используется только проверенное и сервисно обслуживаемое оборудование.',
  'Маршруты проработаны с учётом уровня сложности и погодных условий.',
  'В команде есть базовая аптечка и средства связи.',
]

function parseProgramSteps(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_PROGRAM
  return arr.map((item) => {
    if (item && typeof item === 'object' && ('title' in item || 'text' in item)) {
      return { title: item.title || '', text: item.text || '' }
    }
    const str = String(item)
    const colon = str.indexOf(': ')
    if (colon > 0) return { title: str.slice(0, colon).trim(), text: str.slice(colon + 2).trim() }
    return { title: '', text: str }
  })
}

function buildContactsFromService(service) {
  const items = []
  if (service?.address) items.push({ label: 'Адрес', value: service.address })
  if (service?.phone) items.push({ label: 'Телефон', value: service.phone, href: `tel:${String(service.phone).replace(/\D/g, '')}` })
  if (service?.email) items.push({ label: 'Email', value: service.email, href: `mailto:${service.email}` })
  if (service?.telegram) items.push({ label: 'Telegram', value: service.telegram, href: `https://t.me/${String(service.telegram).replace('@', '')}` })
  return items
}

/**
 * Страница услуги типа «Активности».
 * При передаче serviceData подставляет данные из API (title, images, description, data).
 */
export default function ActivityDetail({ serviceSlug, serviceData }) {
  const photos = useMemo(() => {
    if (serviceData?.images?.length) {
      return serviceData.images.map((path) => ({ src: getImageUrl(path) }))
    }
    return DEFAULT_PHOTOS
  }, [serviceData?.images])

  const serviceName = serviceData?.title ?? 'Приключенческий тур в горах КЧР'
  const categoryLabel = serviceData?.category ?? 'Активность'
  const aboutContent = serviceData?.data?.aboutContent ?? serviceData?.description ?? null
  const defaultAbout = (
    <>
      <p>Это динамичная активность для тех, кто хочет наполнить день яркими эмоциями: живописные виды, лёгкий экстрим и безопасный формат под контролем опытной команды.</p>
      <p>Программа подойдёт как тем, кто впервые пробует подобный формат отдыха, так и тем, кто уже знаком с активным туризмом и хочет открыть для себя новые маршруты.</p>
      <p>Мы подберём темп под вашу группу, сделаем несколько остановок для фото и отдыха, а также расскажем интересные факты о природе и истории региона.</p>
    </>
  )
  const programSteps = useMemo(() => parseProgramSteps(serviceData?.data?.programSteps), [serviceData?.data?.programSteps])
  const equipmentList = useMemo(() => {
    const fromData = serviceData?.data?.equipmentList
    if (Array.isArray(fromData) && fromData.length > 0) return fromData.map(String)
    return DEFAULT_EQUIPMENT
  }, [serviceData?.data?.equipmentList])
  const requirementsList = useMemo(() => {
    const fromData = serviceData?.data?.requirementsList
    if (Array.isArray(fromData) && fromData.length > 0) return fromData.map(String)
    return DEFAULT_REQUIREMENTS
  }, [serviceData?.data?.requirementsList])
  const safetyNotes = useMemo(() => {
    const fromData = serviceData?.data?.safetyNotes
    if (Array.isArray(fromData) && fromData.length > 0) return fromData.map(String)
    return DEFAULT_SAFETY
  }, [serviceData?.data?.safetyNotes])
  const contactsList = useMemo(() => {
    if (serviceData?.data?.contacts?.length) return serviceData.data.contacts
    return buildContactsFromService(serviceData)
  }, [serviceData])
  const reviewsCountLabel = serviceData?.reviewsCount != null ? `${serviceData.reviewsCount} отзывов` : '12 отзывов'
  const tagsList = useMemo(() => {
    const t = serviceData?.data?.tags
    if (Array.isArray(t) && t.length > 0) return t.map(String)
    return ['сложность: средняя', 'длительность: 4–6 часов', 'группа: до 10 человек']
  }, [serviceData?.data?.tags])

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
      name: 'Ирина',
      date: '10 августа 2025',
      rating: 5.0,
      text: 'Очень понравилась активность! Инструкторы внимательные, всё оборудование в отличном состоянии. Маршрут подобран с учётом уровня группы, было и динамично, и безопасно.',
      avatar: '/avatar_feedback.png',
    },
    {
      id: 2,
      name: 'Дмитрий',
      date: '2 июля 2025',
      rating: 5.0,
      text: 'Брали семейный формат активности. Дети в восторге, взрослым тоже хватило эмоций. Отдельное спасибо за подробный инструктаж и постоянный контроль со стороны команды.',
      avatar: '',
    },
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
      if (!isModalOpen) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
      }
    }
  }, [isModalOpen])

  const toggleReview = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const handleStarClick = (starIndex) => {
    setRating(starIndex + 1)
  }

  const formatDate = (date) => {
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
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
      id: reviews.length > 0 ? Math.max(...reviews.map((r) => r.id)) + 1 : 1,
      name: reviewName.trim(),
      date: formatDate(new Date()),
      rating,
      text: reviewText.trim(),
      avatar: '/profile.png',
    }

    setReviews((prev) => [newReview, ...prev])
    setReviewName('')
    setReviewText('')
    setRating(0)
  }

  const anchors = [
    { id: 'main', label: 'Основное' },
    { id: 'about', label: 'О активности' },
    { id: 'program', label: 'Программа' },
    { id: 'equipment', label: 'Что взять с собой' },
    { id: 'safety', label: 'Безопасность' },
    { id: 'reviews', label: 'Отзывы' },
  ]

  const scrollToAnchor = (anchorId) => {
    const element = document.getElementById(anchorId)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
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
    return () => window.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className={`${styles.main} ${a.main}`}>
      <CenterBlock>
        <div className={`${styles.servicePage} ${a.servicePage}`}>
          <div className={`${styles.bread_crumbs} ${a.bread_crumbs}`}>
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

          <div className={`${styles.gallery} ${a.gallery}`}>
            <div className={`${styles.galleryMain} ${a.galleryMain}`} onClick={() => openModal(0)}>
              <img src={photos[0]?.src} alt="Фото активности 1" />
            </div>

            <div className={styles.galleryGrid}>
              <div className={styles.galleryGridRow}>
                {visiblePhotos.slice(1, 3).map((photo, index) => {
                  const photoIndex = index + 1
                  return (
                    <div
                      key={photoIndex}
                      className={`${styles.galleryItem} ${a.galleryItem}`}
                      onClick={() => openModal(photoIndex)}
                    >
                      <img src={photo.src} alt={`Фото активности ${photoIndex + 1}`} />
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
                      className={`${styles.galleryItem} ${a.galleryItem} ${isLast ? styles.galleryItemLast : ''}`}
                      onClick={() => openModal(photoIndex)}
                    >
                      <img src={photo.src} alt={`Фото активности ${photoIndex + 1}`} />
                      {isLast && (
                        <div
                          className={`${styles.moreButton} ${a.moreButton}`}
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
            <div className={`${styles.serviceBlock_content} ${a.serviceBlock_content}`}>
              <div id="main" className={`${styles.serviceHeader} ${a.serviceHeader}`}>
                <div className={`${styles.serviceAvatar} ${a.serviceAvatar}`}>
                  <img src="/serviceImg2.png" alt="Аватар активности" className={`${styles.avatarImg} ${a.avatarImg}`} />
                  <img src="/verification.png" alt="" className={styles.verificationBadge} />
                </div>
                <div className={styles.serviceInfo}>
                  <div className={`${styles.serviceCategory} ${a.serviceCategory}`}>{categoryLabel}</div>
                  <div className={`${styles.serviceName} ${a.serviceName}`}>{serviceName}</div>
                  <div className={styles.serviceRating}>
                    <div className={`${styles.ratingStars} ${a.ratingStars}`}>
                      <img src="/star.png" alt="" /> 5.0
                    </div>
                    <div className={`${styles.ratingFeedback} ${a.ratingFeedback}`}>{reviewsCountLabel}</div>
                  </div>
                  {tagsList.length > 0 && (
                    <div className={`${styles.serviceTags} ${a.serviceTags}`}>
                      {tagsList.map((tag, i) => (
                        <span key={i} className={`${styles.serviceTag} ${a.serviceTag}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div id="about" className={`${styles.title} ${a.title}`}>О активности</div>
              <div className={`${styles.aboutText} ${a.aboutText}`}>
                {aboutContent != null && aboutContent !== '' ? (
                  typeof aboutContent === 'string' ? <p>{aboutContent}</p> : aboutContent
                ) : (
                  defaultAbout
                )}
              </div>

              <div id="program" className={`${styles.title} ${a.title}`}>Программа дня</div>
              <div className={`${styles.program} ${a.program}`}>
                {programSteps.map((step, index) => (
                  <div key={index} className={`${styles.programStep} ${a.programStep}`}>
                    <div className={`${styles.programStepNumber} ${a.programStepNumber}`}>{index + 1}</div>
                    <div className={styles.programStepContent}>
                      <div className={`${styles.programStepTitle} ${a.programStepTitle}`}>{step.title}</div>
                      <div className={`${styles.programStepText} ${a.programStepText}`}>{step.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${styles.programColumns} ${a.programColumns}`}>
                <div className={`${styles.programColumn} ${a.programColumn}`}>
                  <div id="equipment" className={`${styles.subtitle} ${a.subtitle}`}>Что взять с собой</div>
                  <ul className={`${styles.bulletList} ${a.bulletList}`}>
                    {equipmentList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <div className={`${styles.subtitle} ${a.subtitle}`} style={{ marginTop: 24 }}>Требования к участникам</div>
                  <ul className={`${styles.bulletList} ${a.bulletList}`}>
                    {requirementsList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div id="safety" className={`${styles.title} ${a.title}`}>Безопасность и организация</div>
              <div className={`${styles.aboutText} ${a.aboutText}`}>
                <ul className={`${styles.bulletList} ${a.bulletList}`}>
                  {safetyNotes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p>
                  Точную программу, список экипировки и формат активности вы сможете уточнить у организатора
                  перед бронированием. Мы всегда учитываем сезон, прогноз погоды и уровень группы.
                </p>
              </div>

              {contactsList.length > 0 && (
                <div className={`${styles.contacts} ${a.contacts}`}>
                  <div className={`${styles.contactsTitle} ${a.contactsTitle}`}>Место сбора и контакты</div>
                  <div className={styles.contactsList}>
                    {contactsList.map((c, i) => (
                      <div key={i} className={styles.contactItem}>
                        <span className={styles.contactLabel}>{c.label}:</span>
                        {c.href ? (
                          <a href={c.href} className={`${styles.contactValue} ${a.contactValue}`} target={c.target} rel={c.rel}>{c.value}</a>
                        ) : (
                          <span className={`${styles.contactValue} ${a.contactValue}`}>{c.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div id="reviews" className={`${styles.title} ${a.title}`}>Отзывы</div>
              <div className={styles.feedback}>
                <form className={`${styles.feedbackForm} ${a.feedbackForm}`} onSubmit={handleSubmitReview}>
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
                          fill={star <= rating ? '#FFD700' : 'none'}
                          stroke={star <= rating ? '#FFD700' : '#CCCCCC'}
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
                    placeholder="Ваш отзыв об активности"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows="4"
                  />
                  <button type="submit" className={`${styles.feedbackSubmitButton} ${a.feedbackSubmitButton}`}>
                    Оставить отзыв
                  </button>
                </form>

                <div className={styles.feedbackList}>
                  {reviews.map((review) => {
                    const isExpanded = expandedReviews[review.id]
                    const shortText =
                      review.text.length > 200 ? review.text.substring(0, 200) + '...' : review.text
                    const showExpandButton = review.text.length > 200 && !isExpanded
                    return (
                      <div key={review.id} className={`${styles.feedbackItem} ${a.feedbackItem}`}>
                        <div className={styles.feedbackItemHeader}>
                          <div className={styles.feedbackItemLeft}>
                            <img
                              src={review.avatar || '/no-avatar.png'}
                              alt={review.name}
                              className={styles.feedbackAvatar}
                              onError={(e) => {
                                e.target.src = '/no-avatar.png'
                              }}
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
                            className={`${styles.feedbackExpandButton} ${a.feedbackExpandButton}`}
                            onClick={() => toggleReview(review.id)}
                          >
                            Показать полностью
                          </button>
                        )}
                        {isExpanded && review.text.length > 200 && (
                          <button
                            className={`${styles.feedbackExpandButton} ${a.feedbackExpandButton}`}
                            onClick={() => toggleReview(review.id)}
                          >
                            Свернуть
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.feedbackShowAll}>
                <button className={`${styles.feedbackShowAllButton} ${a.feedbackShowAllButton}`}>Показать все отзывы</button>
              </div>
            </div>

            <div className={`${styles.serviceBlock_anchors} ${a.serviceBlock_anchors}`}>
              <div className={styles.anchorsList}>
                {anchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    className={`${styles.anchorItem} ${
                      activeAnchor === anchor.id ? `${styles.anchorItemActive} ${a.anchorItemActive}` : ''
                    }`}
                    onClick={() => scrollToAnchor(anchor.id)}
                  >
                    {anchor.label}
                  </button>
                ))}
              </div>
              <div className={styles.anchorsButtons}>
                <button className={`${styles.anchorButton} ${a.anchorButton}`}>Задать вопрос</button>
                <button className={`${styles.anchorButtonPrimary} ${a.anchorButtonPrimary}`}>Забронировать активность</button>
              </div>
            </div>
          </div>
        </div>
      </CenterBlock>

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
                  navigation
                  loop
                  spaceBetween={20}
                  slidesPerView={1}
                  initialSlide={activeIndex}
                  onSlideChange={handleSlideChange}
                  className={styles.modalSwiper}
                >
                  {photos.map((photo, index) => (
                    <SwiperSlide key={index}>
                      <div className={styles.modalSlide}>
                        <img src={photo.src} alt={`Фото активности ${index + 1}`} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div className={styles.modalThumbnails}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${
                      activeIndex === index ? styles.thumbnailActive : ''
                    }`}
                    onClick={() => {
                      setActiveIndex(index)
                      if (swiperRef.current) {
                        swiperRef.current.swiper.slideToLoop(index)
                      }
                    }}
                  >
                    <img src={photo.src} alt={`Миниатюра активности ${index + 1}`} />
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

