'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Places_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import PlaceModal from '@/components/PlaceModal/PlaceModal'
import { publicPlacesAPI, publicPagesAPI } from '@/lib/api'
import { getImageUrl } from '@/lib/api'
import { stripHtml } from '@/lib/utils'
import { searchInObject, searchWithFallback } from '@/lib/searchUtils'

const ITEMS_PER_PAGE = 12


export default function Places_page() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState('popularity')
  const [places, setPlaces] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState(() => {
    // Инициализируем из URL параметра search при первом рендере
    return searchParams.get('search') || ''
  })
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState(null)
  const [allPlacesForSearch, setAllPlacesForSearch] = useState([])
  const [searchFallback, setSearchFallback] = useState(null)
  const scrollPositionRef = useRef(0)
  const isClosingRef = useRef(false)
  const isOpeningRef = useRef(false)
  const observerTarget = useRef(null)
  const searchDebounceRef = useRef(null)
  const isUpdatingFromUrlRef = useRef(false)
  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'ИНТЕРЕСНЫЕ МЕСТА',
      description: 'Создайте свой уникальный маршрут!',
      image: '/full_places_bg.jpg',
    },
  })

  // Синхронизация searchQuery с URL параметром search при изменении URL
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    if (searchFromUrl !== searchQuery) {
      isUpdatingFromUrlRef.current = true
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams, location.search]) // Добавляем location.search для надежности

  // Обновление URL при изменении searchQuery пользователем (но не создаем цикл)
  useEffect(() => {
    if (isUpdatingFromUrlRef.current) {
      isUpdatingFromUrlRef.current = false
      return
    }
    
    const currentSearchInUrl = searchParams.get('search') || ''
    if (searchQuery !== currentSearchInUrl) {
      if (searchQuery) {
        setSearchParams({ search: searchQuery }, { replace: true })
      } else {
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('search')
        setSearchParams(newParams, { replace: true })
      }
    }
  }, [searchQuery])

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  const handlePlaceClick = async (place) => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
    isClosingRef.current = false
    isOpeningRef.current = true
    setModalLoading(true)
    setIsModalOpen(true)
    setSelectedPlace(null)

    try {
      const { data } = await publicPlacesAPI.getByIdOrSlug(place.id)
      setSelectedPlace(data)
      navigate(`/places/${data.slug}`, { replace: false })
      // Сбрасываем флаг открытия после небольшой задержки
      setTimeout(() => {
        isOpeningRef.current = false
      }, 100)
    } catch (err) {
      setIsModalOpen(false)
      isOpeningRef.current = false
      console.error(err)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    isClosingRef.current = true
    setIsModalOpen(false)

    // Возвращаем URL обратно используя navigate
    navigate('/places', { replace: true })

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
          navigate(`/places/${data.slug}`, { replace: false })
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

  // Загрузка всех мест для умного поиска (один раз при монтировании)
  useEffect(() => {
    let cancelled = false
    publicPlacesAPI.getAll({ limit: 1000 })
      .then(({ data }) => {
        if (!cancelled) {
          setAllPlacesForSearch(data?.items || [])
        }
      })
      .catch(() => {
        if (!cancelled) setAllPlacesForSearch([])
      })
    return () => { cancelled = true }
  }, [])

  // Умный поиск с fallback логикой
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    if (!searchQuery || !searchQuery.trim()) {
      setSearchFallback(null)
      return
    }

    const timer = setTimeout(async () => {
      const performSearch = async (query) => {
        if (!query || !query.trim()) return []
        const lowerQuery = query.toLowerCase().trim()
        
        // Ищем в названии, описании и локации
        return allPlacesForSearch.filter(item => {
          // Стандартный поиск в объекте (название, описание)
          if (searchInObject(item, lowerQuery)) {
            return true
          }
          
          // Дополнительно ищем в локации
          const location = item.location || ''
          if (location && location.toLowerCase().includes(lowerQuery)) {
            return true
          }
          
          return false
        })
      }

      const { results, fallback } = await searchWithFallback(searchQuery, performSearch)
      setSearchFallback(fallback)
      
      // Если есть fallback, используем его для поиска через API
      if (fallback && fallback !== searchQuery.trim()) {
        // Обновляем searchQuery на fallback значение для API запроса
        // Но это может вызвать бесконечный цикл, поэтому лучше использовать отдельное состояние
      }
    }, 300)

    searchDebounceRef.current = timer

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [searchQuery, allPlacesForSearch])

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
      
      // Используем fallback запрос, если он есть, иначе оригинальный
      const effectiveSearchQuery = searchFallback || searchQuery.trim()
      
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(effectiveSearchQuery && { search: effectiveSearchQuery }),
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
      let newItems = data.items || []
      let totalItems = data.pagination?.total ?? 0
      
      // Если есть поисковый запрос и результатов нет или мало, ищем в локации
      if (effectiveSearchQuery && newItems.length === 0 && allPlacesForSearch.length > 0) {
        const lowerQuery = effectiveSearchQuery.toLowerCase().trim()
        
        // Ищем места, где в локации есть совпадение
        const placesWithMatchingLocation = allPlacesForSearch.filter(place => {
          const location = place.location || ''
          return location.toLowerCase().includes(lowerQuery)
        })
        
        if (placesWithMatchingLocation.length > 0) {
          // Берем только нужное количество для текущей страницы
          const startIndex = (page - 1) * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          newItems = placesWithMatchingLocation.slice(startIndex, endIndex)
          totalItems = placesWithMatchingLocation.length
        }
      } else if (effectiveSearchQuery && newItems.length > 0) {
        // Если есть результаты от API, дополнительно проверяем локацию для полноты
        const lowerQuery = effectiveSearchQuery.toLowerCase().trim()
        
        // Проверяем, может быть есть еще места с локацией, которые API не вернул
        const placesWithMatchingLocation = allPlacesForSearch.filter(place => {
          // Пропускаем уже найденные места
          if (newItems.some(item => item.id === place.id || item._id === place._id)) {
            return false
          }
          
          const location = place.location || ''
          return location.toLowerCase().includes(lowerQuery)
        })
        
        // Добавляем найденные места с локацией к результатам
        if (placesWithMatchingLocation.length > 0) {
          newItems = [...newItems, ...placesWithMatchingLocation.slice(0, ITEMS_PER_PAGE - newItems.length)]
          totalItems = Math.max(totalItems, newItems.length)
        }
      }
      
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
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, allPlacesForSearch])

  // Загрузка мест при изменении фильтров/поиска/сортировки
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchPlaces(1, true)
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, fetchPlaces])

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

  // Проверяем URL при изменении location (для переходов со слайдера, из поиска или навигации)
  useEffect(() => {
    // Если модалка закрывается, сбрасываем флаг и выходим
    if (isClosingRef.current) {
      isClosingRef.current = false
      return
    }

    // Если модалка открывается программно (через handlePlaceClick), не обрабатываем изменение URL
    if (isOpeningRef.current) {
      return
    }

    // Проверяем текущий путь из location
    const path = location.pathname
    const pathParts = path.split('/').filter(Boolean)
    const placeSlug = pathParts[pathParts.length - 1]

    // Если это не просто /places, значит есть slug
    if (placeSlug && placeSlug !== 'places' && !isModalOpen) {
      // Сначала пытаемся найти место в текущем списке
      const place = places.find((p) => p.slug === placeSlug || String(p.id) === placeSlug)
      
      if (place) {
        // Место найдено в списке, открываем модалку
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
        setModalLoading(true)
        setIsModalOpen(true)
        publicPlacesAPI.getByIdOrSlug(place.id)
          .then(({ data }) => {
            setSelectedPlace(data)
            setModalLoading(false)
          })
          .catch((err) => {
            console.error(err)
            setIsModalOpen(false)
            setModalLoading(false)
          })
      } else {
        // Место не найдено в списке (например, из-за фильтров или еще не загружено)
        // Загружаем место напрямую по slug
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop
        setModalLoading(true)
        setIsModalOpen(true)
        setSelectedPlace(null)
        publicPlacesAPI.getByIdOrSlug(placeSlug)
          .then(({ data }) => {
            setSelectedPlace(data)
            setModalLoading(false)
          })
          .catch((err) => {
            console.error(err)
            setIsModalOpen(false)
            setModalLoading(false)
            // Если место не найдено, возвращаем на /places
            navigate('/places', { replace: true })
          })
      }
    } else if (path === '/places' && isModalOpen && !modalLoading && !isClosingRef.current && !isOpeningRef.current) {
      // Если вернулись на /places, закрываем модалку (не закрываем во время загрузки нового места — URL ещё /places)
      // Но только если это не было вызвано программно
      setIsModalOpen(false)
      setSelectedPlace(null)
    }
  }, [location.pathname, isModalOpen, places, modalLoading])

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

  // Загрузка данных страницы
  useEffect(() => {
    let cancelled = false
    publicPagesAPI.get('places')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'ИНТЕРЕСНЫЕ МЕСТА',
              description: data.content.hero.description || 'Создайте свой уникальный маршрут!',
              image: data.content.hero.image || '/full_places_bg.jpg',
            },
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPageContent({
            hero: {
              title: 'ИНТЕРЕСНЫЕ МЕСТА',
              description: 'Создайте свой уникальный маршрут!',
              image: '/full_places_bg.jpg',
            },
          })
        }
      })
    return () => { cancelled = true }
  }, [])

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img={getImageUrl(pageContent.hero.image)}
        title={pageContent.hero.title}
        desc={pageContent.hero.description}
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
            suggestionsData={allPlacesForSearch || []}
            getSuggestionTitle={(item) => item.title || item.name}
            maxSuggestions={5}
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
