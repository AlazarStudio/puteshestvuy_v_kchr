'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Places_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import PlaceModal from '@/components/PlaceModal/PlaceModal'
import { publicPlacesAPI } from '@/lib/api'
import { getImageUrl } from '@/lib/api'
import { stripHtml } from '@/lib/utils'

const ITEMS_PER_PAGE = 12


export default function Places_page() {
  const [sortBy, setSortBy] = useState('popularity')
  const [places, setPlaces] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState(null)
  const scrollPositionRef = useRef(0)
  const isClosingRef = useRef(false)
  const [currentPath, setCurrentPath] = useState('')
  const observerTarget = useRef(null)

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

  // Опции фильтров мест с API (группы для FilterBlock)
  const placeFilterGroups = [
    ...(filterOptions?.directions?.length > 0 ? [{ key: 'directions', label: 'Направление', options: filterOptions.directions }] : []),
    ...(filterOptions?.seasons?.length > 0 ? [{ key: 'seasons', label: 'Сезон', options: filterOptions.seasons }] : []),
    ...(filterOptions?.objectTypes?.length > 0 ? [{ key: 'objectTypes', label: 'Вид объекта', options: filterOptions.objectTypes }] : []),
    ...(filterOptions?.accessibility?.length > 0 ? [{ key: 'accessibility', label: 'Доступность', options: filterOptions.accessibility }] : []),
    ...(Array.isArray(filterOptions?.extraGroups) ? filterOptions.extraGroups.map((g) => ({
      key: g.key,
      label: (g.label && g.label.trim()) || g.key,
      options: Array.isArray(g.values) ? g.values : [],
    })) : []),
  ]

  // Загрузка опций фильтров мест с API
  useEffect(() => {
    let cancelled = false
    publicPlacesAPI.getFilters()
      .then(({ data }) => {
        if (!cancelled && data) {
          setFilterOptions({
            directions: Array.isArray(data.directions) ? data.directions : [],
            seasons: Array.isArray(data.seasons) ? data.seasons : [],
            objectTypes: Array.isArray(data.objectTypes) ? data.objectTypes : [],
            accessibility: Array.isArray(data.accessibility) ? data.accessibility : [],
            extraGroups: Array.isArray(data.extraGroups) ? data.extraGroups : [],
          })
          // Инициализируем filters с пустыми массивами для всех групп
          setFilters((prev) => {
            const next = { ...prev }
            if (Array.isArray(data.directions) && data.directions.length > 0 && next.directions === undefined) next.directions = []
            if (Array.isArray(data.seasons) && data.seasons.length > 0 && next.seasons === undefined) next.seasons = []
            if (Array.isArray(data.objectTypes) && data.objectTypes.length > 0 && next.objectTypes === undefined) next.objectTypes = []
            if (Array.isArray(data.accessibility) && data.accessibility.length > 0 && next.accessibility === undefined) next.accessibility = []
            if (Array.isArray(data.extraGroups)) {
              for (const g of data.extraGroups) {
                if (g.key && next[g.key] === undefined) next[g.key] = []
              }
            }
            return next
          })
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Ошибка загрузки опций фильтров:', err)
      })
    return () => { cancelled = true }
  }, [])

  // Функция загрузки мест
  const fetchPlaces = useCallback(async (page = 1, reset = false) => {
    const startTime = Date.now()
    const MIN_LOADING_TIME = 500 // минимум 500ms
    
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(sortBy && { sortBy }),
        ...(filters.directions?.length > 0 && { directions: filters.directions }),
        ...(filters.seasons?.length > 0 && { seasons: filters.seasons }),
        ...(filters.objectTypes?.length > 0 && { objectTypes: filters.objectTypes }),
        ...(filters.accessibility?.length > 0 && { accessibility: filters.accessibility }),
      }
      // Добавляем extraGroups фильтры
      for (const g of filterOptions?.extraGroups || []) {
        if (g.key && filters[g.key]?.length > 0) {
          params[g.key] = filters[g.key]
        }
      }
      const { data } = await publicPlacesAPI.getAll(params)
      const newItems = data.items || []
      const totalItems = data.pagination?.total ?? 0
      
      if (reset) {
        setPlaces(newItems)
        setHasMore(newItems.length === ITEMS_PER_PAGE && newItems.length < totalItems)
      } else {
        setPlaces(prev => {
          const updated = [...prev, ...newItems]
          setHasMore(updated.length < totalItems)
          return updated
        })
      }
      
      setTotal(totalItems)
      
      // Гарантируем минимальное время отображения лоадера
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    } catch (err) {
      console.error(err)
      if (reset) {
        setPlaces([])
        setTotal(0)
        setHasMore(false)
      }
      // Гарантируем минимальное время отображения лоадера даже при ошибке
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, searchQuery, sortBy, filterOptions])

  // Загрузка мест при изменении фильтров/поиска/сортировки
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchPlaces(1, true)
  }, [filters, searchQuery, sortBy, filterOptions])

  // Intersection Observer для lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1
          setCurrentPage(nextPage)
          fetchPlaces(nextPage, false)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, loadingMore, currentPage, fetchPlaces])

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
          <FilterBlock
            filterGroups={placeFilterGroups}
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Введите запрос"
          />
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
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>
              ) : places.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Места не найдены</div>
              ) : (
                <>
                  {places.map((place) => (
                    <PlaceBlock
                      key={place.id}
                      placeId={place.id}
                      rating={place.rating != null ? String(place.rating) : '—'}
                      feedback={
                        place.reviewsCount === 1
                          ? '1 отзыв'
                          : place.reviewsCount >= 2 && place.reviewsCount <= 4
                            ? `${place.reviewsCount} отзыва`
                            : `${place.reviewsCount || 0} отзывов`
                      }
                      reviewsCount={place.reviewsCount ?? 0}
                      place={place.location || '—'}
                      title={place.title}
                      desc={stripHtml(place.shortDescription || place.description || '')}
                      img={getImageUrl(place.image)}
                      onClick={() => handlePlaceClick(place)}
                    />
                  ))}
                  {hasMore && <div ref={observerTarget} style={{ height: '20px', marginTop: '20px' }} />}
                  {loadingMore && (
                    <div className={styles.loadingMore}>
                      <div className={styles.spinner} />
                      <p>Загрузка...</p>
                    </div>
                  )}
                </>
              )}
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
