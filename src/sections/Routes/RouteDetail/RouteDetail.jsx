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

export default function RouteDetail({ }) {
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
  const [activeDay, setActiveDay] = useState(1)
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
      text: 'Остался в полном восторге от экскурсии «На границе регионов: Кисловодск-Медовые водопады»! Маршрут продуман идеально: сначала прогулка по Кисловодску с его целебным воздухом и архитектурными жемчужинами, а потом – резкий переход к дикой природе. Медовые водопады поразили мощью и красотой: шум воды, брызги, изумрудные оттенки реки – словно другая планета. Особенно запомнился самый высокий из каскадов: стоя у подножия, чувствуешь себя крошечным перед силой природы. Гид рассказывал увлекательно, не перегружая датами, но делясь интересными легендами. Время пролетело незаметно, а впечатлений – на год вперёд. Однозначно рекомендую тем, кто хочет увидеть контраст курортной элегантности и первозданной природы!',
      avatar: '/profile.png',
      isLong: false
    },
    {
      id: 2,
      name: 'Андрей',
      date: '12 сентября 2025',
      rating: 5.0,
      text: 'Экскурсия «На границе регионов: Кисловодск-Медовые водопады» оставила приятное впечатление. Программа сбалансирована: Кисловодск: обзор ключевых точек (Курортный парк, Нарзанная галерея) без спешки, достаточно времени для фото и самостоятельного изучения. Переезд к водопадам комфортный, дорога живописная. Медовые водопады – это отдельная история: каскады разной высоты, каждый со своим характером. Особенно понравилось, что гид не торопился, давал время насладиться каждым местом. Единственный момент – на водопадах довольно скользко, так что обувь действительно важна. В целом, отличный вариант для первого знакомства с регионом.',
      avatar: '/profile.png',
      isLong: true
    },
    {
      id: 3,
      name: 'Анастасия',
      date: '12 сентября 2025',
      rating: 5.0,
      text: 'Решилась на экскурсию «На границе регионов» и не пожалела! Делюсь нюансами, которые пригодятся: Что взять: удобную обувь (на водопадах каменистые тропы), воду и перекус (в программе есть паузы, но магазинов рядом мало). Что понравилось: структура экскурсии – не устаешь, есть время отдохнуть между локациями. Гид знающий, отвечал на все вопросы. Водопады впечатляют даже в пасмурную погоду. Что учесть: в Кисловодске много туристов, особенно в выходные, но гид нашел менее людные места для рассказа. В целом, рекомендую как для новичков, так и для тех, кто уже бывал в регионе – всегда найдется что-то новое.',
      avatar: '/profile.png',
      isLong: true
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
    { id: 'map', label: 'Карта' },
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

  return (
    <main className={styles.main}>
      <CenterBlock>
        <div className={styles.routePage}>
          <div className={styles.bread_crumbs}>
            <Link href={"/"}>Главная</Link>
            <p>→</p>
            <Link href={"/routes"}>Маршруты</Link>
            <p>→</p>
            <p>На границе регионов: Кисловодск - Медовые водопады</p>
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
              <div id="main" className={styles.title}>На границе регионов: <br />Кисловодск - Медовые водопады</div>
              <div className={styles.information}>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon1.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Расстояние</div>
                    <div className={styles.textDesc}>20 км</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon2.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Сезон</div>
                    <div className={styles.textDesc}>Зима</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon3.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Градус подъема</div>
                    <div className={styles.textDesc}>30°</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon4.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>С ночевкой</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon5.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Сложность </div>
                    <div className={styles.textDesc}>1/5</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon6.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Время прохождения</div>
                    <div className={styles.textDesc}>2 дня</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon7.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Семейный маршрут</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <img src="/routeInfoContentIcon8.png" alt="" />
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Способ передвижения</div>
                    <div className={styles.textDesc}>Верхом</div>
                  </div>
                </div>
              </div>

              <div id="route" className={styles.title}>Маршрут</div>
              <div className={styles.forSlider}>
                <div className={styles.slider}>
                  <Swiper
                    navigation={true}
                    modules={[Navigation]}
                    slidesPerView={1}
                    // loop={true}
                    className="mySwiperRoute"
                  >
                    <SwiperSlide>
                      <div className={styles.slide}>
                        <div className={styles.slideTitle}>АРХЫЗ</div>
                        <div className={styles.slideSubTitle}>точка 1</div>
                        <div className={styles.routeLine}><img src="/routeLine.png" alt="" /></div>
                        <div className={styles.slideBlock}>
                          <div className={styles.slideDesc}>
                            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                          </div>
                          <div className={styles.slideImg}><img src="/slideRouteImg1.png" alt="" /></div>
                        </div>

                        <Link href="/#" className={styles.slideBtn}>Подробнее</Link>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className={styles.slide}>
                        <div className={styles.slideTitle}>АРХЫЗ</div>
                        <div className={styles.slideSubTitle}>точка 1</div>
                        <div className={styles.routeLine}><img src="/routeLine.png" alt="" /></div>
                        <div className={styles.slideBlock}>
                          <div className={styles.slideDesc}>
                            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                          </div>
                          <div className={styles.slideImg}><img src="/slideRouteImg1.png" alt="" /></div>
                        </div>

                        <Link href="/#" className={styles.slideBtn}>Подробнее</Link>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className={styles.slide}>
                        <div className={styles.slideTitle}>АРХЫЗ</div>
                        <div className={styles.slideSubTitle}>точка 1</div>
                        <div className={styles.routeLine}><img src="/routeLine.png" alt="" /></div>
                        <div className={styles.slideBlock}>
                          <div className={styles.slideDesc}>
                            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                          </div>
                          <div className={styles.slideImg}><img src="/slideRouteImg1.png" alt="" /></div>
                        </div>

                        <Link href="/#" className={styles.slideBtn}>Подробнее</Link>
                      </div>
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>

              <div id="map" className={styles.title}>Карта</div>
              <div className={styles.map}><img src="/map.png" alt="" /></div>

              <div id="what-to-take" className={styles.title}>Что взять с собой</div>
              <div className={styles.infoTable}>
                <div className={styles.infoTable_blocks}>
                  <div className={styles.infoTable_blocks_title}>
                    Одежда
                  </div>
                  <div className={styles.infoTable_blocks_block}>
                    <div className={styles.infoTable_blocks_block_img}>
                      <img src="/infoTable_icon1.png" alt="" />
                    </div>
                    Куртки, ветровки, ветрозащитная одежда
                  </div>
                  <div className={styles.infoTable_blocks_block}>
                    <div className={styles.infoTable_blocks_block_img}>
                      <img src="/infoTable_icon2.png" alt="" />
                    </div>
                    Солнцезащитные очки
                  </div>
                  <div className={styles.infoTable_blocks_block}>
                    <div className={styles.infoTable_blocks_block_img}>
                      <img src="/infoTable_icon3.png" alt="" />
                    </div>
                    Удобная трекинговая обувь
                  </div>
                </div>
                <div className={styles.infoTable_blocks}>
                  <div className={styles.infoTable_blocks_title}>
                    Одежда
                  </div>
                  <div className={styles.infoTable_blocks_block}>
                    <div className={styles.infoTable_blocks_block_img}>
                      <img src="/infoTable_icon4.png" alt="" />
                    </div>
                    Солнцезащитный крем
                  </div>
                  <div className={styles.infoTable_blocks_block}>
                    <div className={styles.infoTable_blocks_block_img}>
                      <img src="/infoTable_icon5.png" alt="" />
                    </div>
                    Индивидуальный комплект лекарственных препаратов
                  </div>
                </div>
              </div>

              <div id="description" className={styles.title}>Описание маршрута</div>
              <div className={styles.tabs}>
                <div className={styles.tabsList}>
                  <button
                    className={`${styles.tab} ${activeDay === 1 ? styles.tabActive : ''}`}
                    onClick={() => setActiveDay(1)}
                  >
                    1 день
                  </button>
                  <button
                    className={`${styles.tab} ${activeDay === 2 ? styles.tabActive : ''}`}
                    onClick={() => setActiveDay(2)}
                  >
                    2 день
                  </button>
                  <button
                    className={`${styles.tab} ${activeDay === 3 ? styles.tabActive : ''}`}
                    onClick={() => setActiveDay(3)}
                  >
                    3 день
                  </button>
                </div>
                <div className={styles.tabsContent}>
                  <div className={styles.tabsContentTitle}>{activeDay} день</div>
                  {activeDay === 1 && (
                    <ul className={styles.tabsContentList}>
                      <li>Прибытие на Кавказские Минеральные Воды (аэропорт или железнодорожный вокзал г.Минеральные Воды, или железнодорожный вокзал г. Пятигорска). Рекомендованное время прибытия не позднее 11:00 по московскому времени.</li>
                      <li>Трансфер до гостиницы выбранной категории самостоятельно или по заявке за дополнительную плату.</li>
                      <li>Размещение в выбранной гостинице.</li>
                      <li>Обед оплачивается самостоятельно или по заявке за доп. плату.</li>
                      <li>Встреча с гидом в 13:00 по московскому времени.</li>
                    </ul>
                  )}
                  {activeDay === 2 && (
                    <ul className={styles.tabsContentList}>
                      <li>Прибытие на Кавказские Минеральные Воды (аэропорт или железнодорожный вокзал г.Минеральные Воды, или железнодорожный вокзал г. Пятигорска). Рекомендованное время прибытия не позднее 11:00 по московскому времени.</li>
                      <li>Трансфер до гостиницы выбранной категории самостоятельно или по заявке за дополнительную плату.</li>
                      <li>Размещение в выбранной гостинице.</li>
                    </ul>
                  )}
                  {activeDay === 3 && (
                    <ul className={styles.tabsContentList}>
                      <li>Обед оплачивается самостоятельно или по заявке за доп. плату.</li>
                      <li>Встреча с гидом в 13:00 по московскому времени.</li>
                    </ul>
                  )}
                </div>
              </div>

              <div id="important" className={styles.title}>Важно знать</div>
              <div className={styles.text}>
                При посещении горных районов возможны перепады давления,
                рекомендуем вам обратить на это внимание
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
                            <img src={review.avatar} alt={review.name} className={styles.feedbackAvatar} />
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
                          <button className={styles.feedbackItemMenu}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="5" r="1.5" fill="#666" />
                              <circle cx="10" cy="10" r="1.5" fill="#666" />
                              <circle cx="10" cy="15" r="1.5" fill="#666" />
                            </svg>
                          </button>
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
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M4 6L8 10L12 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {isExpanded && review.text.length > 200 && (
                          <button
                            className={styles.feedbackExpandButton}
                            onClick={() => toggleReview(review.id)}
                          >
                            Свернуть
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(180deg)' }}>
                              <path d="M4 6L8 10L12 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        <div className={styles.feedbackItemActions}>
                          <button className={styles.feedbackLikeButton}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path
                                d="M17.3663 3.84172C16.9405 3.41589 16.4352 3.0781 15.8793 2.84763C15.3234 2.61715 14.7271 2.49805 14.1247 2.49805C13.5223 2.49805 12.926 2.61715 12.3701 2.84763C11.8142 3.0781 11.3089 3.41589 10.8831 3.84172L9.99969 4.72506L9.11636 3.84172C8.25869 2.98406 7.09036 2.49849 5.87469 2.49849C4.65902 2.49849 3.49069 2.98406 2.63302 3.84172C1.77536 4.69939 1.28979 5.86772 1.28979 7.08339C1.28979 8.29906 1.77536 9.46739 2.63302 10.3251L3.51636 11.2084L9.99969 17.6917L16.483 11.2084L17.3663 10.3251C17.7922 9.89922 18.13 9.39395 18.3604 8.83806C18.5909 8.28217 18.71 7.68589 18.71 7.08339C18.71 6.48089 18.5909 5.88461 18.3604 5.32872C18.13 4.77283 17.7922 4.26756 17.3663 3.84172Z"
                                stroke="#666"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button className={styles.feedbackReplyButton}>Ответить</button>
                        </div>
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
                <RouteBlock title="На границе регионов: Кисловодск - Медовые водопады" />
                <RouteBlock title="На границе регионов: Кисловодск - Медовые водопады" />
                <RouteBlock title="На границе регионов: Кисловодск - Медовые водопады" />
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
