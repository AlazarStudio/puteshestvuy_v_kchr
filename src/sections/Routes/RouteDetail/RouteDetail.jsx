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
            {/* Большое изображение слева */}
            <div
              className={styles.galleryMain}
              onClick={() => openModal(0)}
            >
              <img src={photos[0]?.src} alt={`Фото 1`} />
            </div>

            {/* 4 маленьких изображения справа */}
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
              <div className={styles.title}>
                На границе регионов: <br />
                Кисловодск - Медовые водопады
              </div>

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

              <div className={styles.title}>Маршрут</div>
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

              <div className={styles.title}>Карта</div>

              <div className={styles.map}><img src="/map.png" alt="" /></div>

              <div className={styles.title}>Что взять с собой</div>
              <div className={styles.infoTable}></div>
              <div className={styles.title}>Описание маршрута</div>
              <div className={styles.tabs}></div>
              <div className={styles.title}>Важно знать</div>
              <div className={styles.text}></div>
              <div className={styles.title}>Помогут покорить маршрут</div>
              <div className={styles.guides}></div>
              <div className={styles.title}>Отзывы</div>
              <div className={styles.feedback}></div>
              <div className={styles.title}>Места рядом с этим маршрутом</div>
              <div className={styles.places}></div>
              <div className={styles.title}>Похожие маршруты</div>
              <div className={styles.anotherRoutes}></div>
            </div>
            <div className={styles.routeBlock_anchors}></div>
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
