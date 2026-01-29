'use client'

import { useState, useEffect, useRef } from 'react'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Places_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import PlaceModal from '@/components/PlaceModal/PlaceModal'
import { publicPlacesAPI } from '@/lib/api'
import { getImageUrl } from '@/lib/api'

export default function Places_page() {
  const [sortBy, setSortBy] = useState('popularity')
  const [places, setPlaces] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const scrollPositionRef = useRef(0)
  const isClosingRef = useRef(false)
  const [currentPath, setCurrentPath] = useState('')

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  const handlePlaceClick = async (place) => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
    isClosingRef.current = false
    setModalLoading(true)
    setIsModalOpen(true)
    setSelectedPlace(null)

    try {
      const { data } = await publicPlacesAPI.getByIdOrSlug(place.id)
      setSelectedPlace(data)
      window.history.pushState({ place: data.slug }, '', `/places/${data.slug}`)
    } catch (err) {
      setIsModalOpen(false)
      console.error(err)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    isClosingRef.current = true
    setIsModalOpen(false)

    // Возвращаем URL обратно используя history API
    window.history.pushState({}, '', '/places')

    // Очищаем selectedPlace после завершения анимации
    setTimeout(() => {
      setSelectedPlace(null)
    }, 300) // Время анимации
  }

  /** Закрыть модалку и открыть другое место (например, из блока «Места рядом») */
  const handleOpenPlaceById = (placeId) => {
    closeModal()
    setTimeout(() => {
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
      setModalLoading(true)
      setIsModalOpen(true)
      setSelectedPlace(null)
      publicPlacesAPI.getByIdOrSlug(placeId)
        .then(({ data }) => {
          setSelectedPlace(data)
          window.history.pushState({ place: data.slug }, '', `/places/${data.slug}`)
        })
        .catch((err) => {
          console.error(err)
          setIsModalOpen(false)
        })
        .finally(() => setModalLoading(false))
    }, 320)
  }

  // Загрузка мест с API
  useEffect(() => {
    let cancelled = false
    async function fetchPlaces() {
      setLoading(true)
      try {
        const { data } = await publicPlacesAPI.getAll({ limit: 100 })
        if (!cancelled) {
          setPlaces(data.items || [])
          setTotal(data.pagination?.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setPlaces([])
          setTotal(0)
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPlaces()
    return () => { cancelled = true }
  }, [])

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
    if (placeSlug && placeSlug !== 'places' && !isModalOpen && places.length > 0) {
      const place = places.find((p) => p.slug === placeSlug)
      if (place) {
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
        publicPlacesAPI.getByIdOrSlug(place.id)
          .then(({ data }) => {
            setSelectedPlace(data)
            setIsModalOpen(true)
          })
          .catch(console.error)
      }
    } else if (path === '/places' && isModalOpen && !modalLoading) {
      // Если вернулись на /places, закрываем модалку (не закрываем во время загрузки нового места — URL ещё /places)
      setIsModalOpen(false)
      setSelectedPlace(null)
    }
  }, [currentPath, isModalOpen, places.length, modalLoading])

  // Обработка навигации браузера (назад/вперед)
  useEffect(() => {
    const handlePopState = (event) => {
      const currentPath = window.location.pathname
      const pathParts = currentPath.split('/').filter(Boolean)
      const placeSlug = pathParts[pathParts.length - 1]

      if (placeSlug && placeSlug !== 'places') {
        const place = places.find((p) => p.slug === placeSlug)
        if (place) {
          scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
          publicPlacesAPI.getByIdOrSlug(place.id)
            .then(({ data }) => {
              setSelectedPlace(data)
              setIsModalOpen(true)
              isClosingRef.current = false
            })
            .catch(console.error)
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
                {loading
                  ? 'Загрузка...'
                  : `Найдено ${total} ${total === 1 ? 'место' : total >= 2 && total <= 4 ? 'места' : 'мест'}`
                }
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
                  rating={place.rating != null ? String(place.rating) : '—'}
                  feedback={
                    place.reviewsCount === 1
                      ? '1 отзыв'
                      : place.reviewsCount >= 2 && place.reviewsCount <= 4
                        ? `${place.reviewsCount} отзыва`
                        : `${place.reviewsCount || 0} отзывов`
                  }
                  place={place.location || '—'}
                  title={place.title}
                  desc={place.shortDescription || place.description || ''}
                  img={getImageUrl(place.image)}
                  onClick={() => handlePlaceClick(place)}
                />
              ))}
            </div>
          </div>
        </section>
      </CenterBlock>

      {/* Модалка с детальной информацией о месте */}
      <PlaceModal
        isOpen={isModalOpen}
        place={selectedPlace}
        onClose={closeModal}
        onOpenPlace={handleOpenPlaceById}
        isLoading={modalLoading}
      />
    </main >
  )
}
