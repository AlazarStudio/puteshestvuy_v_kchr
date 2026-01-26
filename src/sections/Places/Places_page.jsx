'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Select, MenuItem, FormControl } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Places_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import { generateSlug } from '@/utils/transliterate'


export default function Places_page() {
  const router = useRouter()
  const [sortBy, setSortBy] = useState('popularity')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const scrollPositionRef = useRef(0)
  const isClosingRef = useRef(false)
  const [currentPath, setCurrentPath] = useState('')

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  const handlePlaceClick = (place) => {
    // Сохраняем позицию скролла перед открытием модалки
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
    
    setSelectedPlace(place)
    setIsModalOpen(true)
    isClosingRef.current = false
    
    // Изменяем URL без перезагрузки страницы используя history API
    const slug = generateSlug(place.title)
    window.history.pushState({ place: slug }, '', `/places/${slug}`)
  }

  const closeModal = () => {
    isClosingRef.current = true
    setIsModalOpen(false)
    setSelectedPlace(null)
    
    // Возвращаем URL обратно используя history API
    window.history.pushState({}, '', '/places')
  }

  const places = [
    {
      id: 1,
      rating: "5.0",
      feedback: "1 отзыв",
      place: "Теберда",
      title: "Центральная усадьба Тебердинского национального парка",
      desc: "Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;",
      img: "/placeImg1.png",
      fullDesc: "Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками; административные здания парка. Это отличное место для начала знакомства с природой и историей Тебердинского заповедника."
    },
    {
      id: 2,
      rating: "5.0",
      feedback: "2 отзыва",
      place: "Архыз",
      title: "Софийские водопады",
      desc: "Каскад из нескольких водопадов, расположенных в живописной долине. Особенно красив весной и летом, когда тает снег в горах.",
      img: "/placeImg1.png",
      fullDesc: "Каскад из нескольких водопадов, расположенных в живописной долине. Особенно красив весной и летом, когда тает снег в горах. Водопады образуют несколько каскадов разной высоты, создавая потрясающее зрелище. К водопадам ведет удобная тропа, подходящая для туристов разного уровня подготовки."
    },
    {
      id: 3,
      rating: "4.8",
      feedback: "5 отзывов",
      place: "Домбай",
      title: "Гора Мусса-Ачитара",
      desc: "Горная вершина с потрясающим видом на Главный Кавказский хребет. Подъем на канатной дороге и пешие тропы для любителей активного отдыха.",
      img: "/placeImg1.png",
      fullDesc: "Горная вершина с потрясающим видом на Главный Кавказский хребет. Подъем на канатной дороге и пешие тропы для любителей активного отдыха. С вершины открывается панорамный вид на окружающие горы и долины. Это одно из самых популярных мест для фотографирования в регионе."
    },
    {
      id: 4,
      rating: "5.0",
      feedback: "1 отзыв",
      place: "Теберда",
      title: "Центральная усадьба Тебердинского национального парка",
      desc: "Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;",
      img: "/placeImg1.png",
      fullDesc: "Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками; административные здания парка. Это отличное место для начала знакомства с природой и историей Тебердинского заповедника."
    },
    {
      id: 5,
      rating: "5.0",
      feedback: "2 отзыва",
      place: "Архыз",
      title: "Софийские водопады",
      desc: "Каскад из нескольких водопадов, расположенных в живописной долине. Особенно красив весной и летом, когда тает снег в горах.",
      img: "/placeImg1.png",
      fullDesc: "Каскад из нескольких водопадов, расположенных в живописной долине. Особенно красив весной и летом, когда тает снег в горах. Водопады образуют несколько каскадов разной высоты, создавая потрясающее зрелище. К водопадам ведет удобная тропа, подходящая для туристов разного уровня подготовки."
    },
    {
      id: 6,
      rating: "4.8",
      feedback: "5 отзывов",
      place: "Домбай",
      title: "Гора Мусса-Ачитара",
      desc: "Горная вершина с потрясающим видом на Главный Кавказский хребет. Подъем на канатной дороге и пешие тропы для любителей активного отдыха.",
      img: "/placeImg1.png",
      fullDesc: "Горная вершина с потрясающим видом на Главный Кавказский хребет. Подъем на канатной дороге и пешие тропы для любителей активного отдыха. С вершины открывается панорамный вид на окружающие горы и долины. Это одно из самых популярных мест для фотографирования в регионе."
    },
  ]

  // Отслеживаем изменения пути
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname)
    }
    
    updatePath()
    window.addEventListener('popstate', updatePath)
    
    return () => {
      window.removeEventListener('popstate', updatePath)
    }
  }, [])

  // Проверяем URL при загрузке страницы или изменении пути
  useEffect(() => {
    // Если модалка закрывается, сбрасываем флаг и выходим
    if (isClosingRef.current) {
      isClosingRef.current = false
      return
    }

    // Проверяем текущий URL (может быть /places/slug)
    const path = window.location.pathname
    const pathParts = path.split('/').filter(Boolean)
    const placeSlug = pathParts[pathParts.length - 1]
    
    // Если это не просто /places, значит есть slug
    if (placeSlug && placeSlug !== 'places' && !isModalOpen) {
      // Находим место по slug
      const place = places.find(p => generateSlug(p.title) === placeSlug)
      if (place) {
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
        setSelectedPlace(place)
        setIsModalOpen(true)
      }
    } else if (path === '/places' && isModalOpen) {
      // Если вернулись на /places, закрываем модалку
      setIsModalOpen(false)
      setSelectedPlace(null)
    }
  }, [currentPath, isModalOpen, places])

  // Обработка навигации браузера (назад/вперед)
  useEffect(() => {
    const handlePopState = (event) => {
      const currentPath = window.location.pathname
      const pathParts = currentPath.split('/').filter(Boolean)
      const placeSlug = pathParts[pathParts.length - 1]

      if (placeSlug && placeSlug !== 'places') {
        const place = places.find(p => generateSlug(p.title) === placeSlug)
        if (place) {
          scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
          setSelectedPlace(place)
          setIsModalOpen(true)
          isClosingRef.current = false
        }
      } else {
        setIsModalOpen(false)
        setSelectedPlace(null)
        isClosingRef.current = false
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [places])

  // Управление скроллом страницы при открытии/закрытии модалки
  useEffect(() => {
    if (isModalOpen) {
      // Сохраняем текущую позицию скролла
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop
      scrollPositionRef.current = currentScroll
      
      // Блокируем скролл, сохраняя позицию
      document.body.style.position = 'fixed'
      document.body.style.top = `-${currentScroll}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Восстанавливаем скролл
      const scrollY = scrollPositionRef.current
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      
      // Восстанавливаем позицию скролла точно такую же, как была до открытия
      if (scrollY !== undefined) {
        // Используем setTimeout для корректного восстановления после изменения стилей
        setTimeout(() => {
          window.scrollTo({
            top: scrollY,
            behavior: 'instant'
          })
        }, 0)
      }
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

  // Закрытие модалки по Escape
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img={'/full_places_bg.jpg'}
        title={'ИНТЕРЕСНЫЕ МЕСТА'}
        desc={'Создайте свой уникальный маршрут!'}
      />

      <CenterBlock>
        <section className={styles.flexBlock}>
          <FilterBlock />
          <div className={styles.places}>
            <div className={styles.placesSort}>
              <div className={styles.placesSortFind}>
                Найдено 46 мест
              </div>
              <div className={styles.placesSortSort}>
                <div className={styles.title}>Сортировать:</div>
                <FormControl className={styles.selectWrapper}>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    className={styles.select}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Сортировка мест' }}
                    MenuProps={{
                      disableScrollLock: true,
                      PaperProps: {
                        sx: {
                          maxHeight: 200,
                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          '& .MuiMenuItem-root': {
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontSize: '16px',
                            fontWeight: 400,
                            lineHeight: '150%',
                          },
                          '& .MuiMenuItem-root.Mui-selected': {
                            backgroundColor: '#156A60',
                            color: '#fff',
                            '&:hover': {
                              backgroundColor: '#156A60',
                            },
                          },
                        },
                      },
                    }}
                    sx={{
                      height: '40px',
                      borderRadius: '15px',
                      backgroundColor: '#fff',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #F1F3F8',
                        borderRadius: '15px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#156A60',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#156A60',
                        borderWidth: '1px',
                      },
                      '& .MuiSelect-select': {
                        padding: '10px 14px',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                        color: '#000',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#000',
                      },
                    }}
                  >
                    <MenuItem 
                      value="popularity"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      По популярности
                    </MenuItem>
                    <MenuItem 
                      value="rating"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      По рейтингу
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            
            <div className={styles.placesShow}>
              {places.map((place) => (
                <PlaceBlock 
                  key={place.id}
                  rating={place.rating}
                  feedback={place.feedback}
                  place={place.place}
                  title={place.title}
                  desc={place.desc}
                  img={place.img}
                  onClick={() => handlePlaceClick(place)}
                />
              ))}
            </div>
          </div>
        </section>
      </CenterBlock>

      {/* Модалка с детальной информацией о месте */}
      <AnimatePresence>
        {isModalOpen && selectedPlace && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.modalBody}>
                <div className={styles.modalImage}>
                  <img src={selectedPlace.img} alt={selectedPlace.title} />
                </div>
                
                <div className={styles.modalInfo}>
                  <div className={styles.modalTitle}>{selectedPlace.title}</div>
                  
                  <div className={styles.modalDetails}>
                    <div className={styles.modalDetailItem}>
                      <div className={styles.modalDetailLabel}>Местоположение</div>
                      <div className={styles.modalDetailValue}>{selectedPlace.place}</div>
                    </div>
                    <div className={styles.modalDetailItem}>
                      <div className={styles.modalDetailLabel}>Рейтинг</div>
                      <div className={styles.modalDetailValue}>
                        <img src="/star.png" alt="" />
                        {selectedPlace.rating}
                      </div>
                    </div>
                    <div className={styles.modalDetailItem}>
                      <div className={styles.modalDetailLabel}>Отзывы</div>
                      <div className={styles.modalDetailValue}>{selectedPlace.feedback}</div>
                    </div>
                  </div>

                  <div className={styles.modalDescription}>
                    <div className={styles.modalDescriptionTitle}>Описание</div>
                    <div className={styles.modalDescriptionText}>{selectedPlace.fullDesc}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main >
  )
}
