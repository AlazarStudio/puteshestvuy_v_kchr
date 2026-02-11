'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Routes_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import { publicRoutesAPI, publicPagesAPI, getImageUrl } from '@/lib/api'
import { searchInObject, searchWithFallback } from '@/lib/searchUtils'

const SCROLL_KEY = 'routes_scroll_position'
const ITEMS_PER_PAGE = 6

export default function Routes_page() {
  const [searchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState('popularity')
  const [searchQuery, setSearchQuery] = useState('')
  const [routes, setRoutes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [filterOptions, setFilterOptions] = useState(null)
  const [allRoutesForSearch, setAllRoutesForSearch] = useState([])
  const [searchFallback, setSearchFallback] = useState(null)
  const observerTarget = useRef(null)
  const searchDebounceRef = useRef(null)
  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'МАРШРУТЫ',
      description: 'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"',
      image: '/full_roates_bg.jpg',
    },
  })

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  const handleFiltersChange = (next) => {
    setFilters(next)
  }

  // Синхронизация всех фильтров с URL (при переходе с детальной страницы маршрута)
  useEffect(() => {
    const filtersFromUrl = {}
    const FIXED_GROUP_KEYS = [
      'seasons',
      'transport',
      'durationOptions',
      'difficultyLevels',
      'distanceOptions',
      'elevationOptions',
      'isFamilyOptions',
      'hasOvernightOptions',
    ]
    
    // Читаем все фильтры из URL
    FIXED_GROUP_KEYS.forEach(key => {
      const values = searchParams.getAll(key).filter(Boolean)
      if (values.length > 0) {
        filtersFromUrl[key] = values
      }
    })
    
    // Читаем extraGroups из URL (если они есть в filterOptions)
    if (filterOptions?.extraGroups) {
      filterOptions.extraGroups.forEach(group => {
        if (group.key) {
          const values = searchParams.getAll(group.key).filter(Boolean)
          if (values.length > 0) {
            filtersFromUrl[group.key] = values
          }
        }
      })
    }
    
    // Устанавливаем фильтры из URL
    if (Object.keys(filtersFromUrl).length > 0) {
      setFilters((prev) => ({ ...prev, ...filtersFromUrl }))
    }
  }, [searchParams, filterOptions])

  // Добавляем ключи extra-групп в filters при первой загрузке опций
  useEffect(() => {
    if (!filterOptions?.extraGroups?.length) return
    setFilters((prev) => {
      const next = { ...prev }
      let changed = false
      for (const g of filterOptions.extraGroups) {
        if (Array.isArray(g.values) && g.key && prev[g.key] === undefined) {
          next[g.key] = []
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [filterOptions?.extraGroups])

  // Все группы фильтров: встроенные + extra (с опциями или без — для поля ввода)
  const FIXED_GROUP_KEYS = [
    'seasons',
    'transport',
    'durationOptions',
    'difficultyLevels',
    'distanceOptions',
    'elevationOptions',
    'isFamilyOptions',
    'hasOvernightOptions',
  ]
  
  const routeFilterGroups = [
    ...FIXED_GROUP_KEYS.map((key) => {
      const meta = filterOptions?.fixedGroupMeta?.[key]
      const label = (meta?.label && meta.label.trim()) || key
      const options = Array.isArray(filterOptions?.[key]) ? filterOptions[key] : []
      // Показываем все группы: с опциями (чекбоксы) и без опций (поля ввода)
      return { key, label, options }
    }),
    ...(Array.isArray(filterOptions?.extraGroups)
      ? filterOptions.extraGroups.map((g) => ({
          key: g.key,
          label: (g.label && g.label.trim()) || g.key,
          options: Array.isArray(g.values) ? g.values : [],
        }))
      : []),
  ]

  // Загрузка всех маршрутов для умного поиска (один раз при монтировании)
  useEffect(() => {
    let cancelled = false
    publicRoutesAPI.getAll({ limit: 1000 })
      .then(({ data }) => {
        if (!cancelled) {
          setAllRoutesForSearch(data?.items || [])
        }
      })
      .catch(() => {
        if (!cancelled) setAllRoutesForSearch([])
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
        
        // Ищем в названии, описании и местах маршрута
        return allRoutesForSearch.filter(item => {
          // Стандартный поиск в объекте (название, описание)
          if (searchInObject(item, lowerQuery)) {
            return true
          }
          
          // Дополнительно ищем в местах маршрута
          if (Array.isArray(item.places) && item.places.length > 0) {
            return item.places.some(place => {
              const placeTitle = place.title || place.name || ''
              return placeTitle.toLowerCase().includes(lowerQuery)
            })
          }
          
          return false
        })
      }

      const { results, fallback } = await searchWithFallback(searchQuery, performSearch)
      setSearchFallback(fallback)
    }, 300)

    searchDebounceRef.current = timer

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [searchQuery, allRoutesForSearch])

  // Загрузка опций фильтров маршрутов с API
  useEffect(() => {
    let cancelled = false
    publicRoutesAPI.getFilters()
      .then(({ data }) => {
        if (!cancelled && data) {
          setFilterOptions({
            seasons: Array.isArray(data.seasons) ? data.seasons : [],
            transport: Array.isArray(data.transport) ? data.transport : [],
            durationOptions: Array.isArray(data.durationOptions) ? data.durationOptions : [],
            difficultyLevels: Array.isArray(data.difficultyLevels) ? data.difficultyLevels : [],
            distanceOptions: Array.isArray(data.distanceOptions) ? data.distanceOptions : [],
            elevationOptions: Array.isArray(data.elevationOptions) ? data.elevationOptions : [],
            isFamilyOptions: Array.isArray(data.isFamilyOptions) ? data.isFamilyOptions : [],
            hasOvernightOptions: Array.isArray(data.hasOvernightOptions) ? data.hasOvernightOptions : [],
            extraGroups: Array.isArray(data.extraGroups) ? data.extraGroups : [],
            fixedGroupMeta: data.fixedGroupMeta && typeof data.fixedGroupMeta === 'object' ? data.fixedGroupMeta : {},
          })
          // Инициализируем filters с пустыми массивами для всех групп
          setFilters((prev) => {
            const next = { ...prev }
            const FIXED_GROUP_KEYS = [
              'seasons',
              'transport',
              'durationOptions',
              'difficultyLevels',
              'distanceOptions',
              'elevationOptions',
              'isFamilyOptions',
              'hasOvernightOptions',
            ]
            for (const key of FIXED_GROUP_KEYS) {
              const options = Array.isArray(data[key]) ? data[key] : []
              if (options.length > 0 && next[key] === undefined) next[key] = []
            }
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
        if (!cancelled) console.error('Ошибка загрузки опций фильтров маршрутов:', err)
      })
    return () => { cancelled = true }
  }, [])

  // Функция загрузки маршрутов
  const fetchRoutes = useCallback(async (page = 1, reset = false) => {
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
        ...(filters.seasons?.length > 0 && { seasons: filters.seasons }),
        ...(filters.transport?.length > 0 && { transport: filters.transport }),
        ...(filters.durationOptions?.length > 0 && { durationOptions: filters.durationOptions }),
        ...(filters.difficultyLevels?.length > 0 && { difficultyLevels: filters.difficultyLevels }),
        ...(filters.distanceOptions?.length > 0 && { distanceOptions: filters.distanceOptions }),
        ...(filters.elevationOptions?.length > 0 && { elevationOptions: filters.elevationOptions }),
        ...(filters.isFamilyOptions?.length > 0 && { isFamilyOptions: filters.isFamilyOptions }),
        ...(filters.hasOvernightOptions?.length > 0 && { hasOvernightOptions: filters.hasOvernightOptions }),
      }
      for (const g of filterOptions?.extraGroups || []) {
        if (g.key && filters[g.key]?.length > 0) {
          params[g.key] = filters[g.key]
        }
      }
      const { data } = await publicRoutesAPI.getAll(params)
      let newItems = data.items || []
      let totalItems = data.pagination?.total ?? 0
      
      // Если есть поисковый запрос и результатов нет или мало, ищем в местах маршрута
      if (effectiveSearchQuery && newItems.length === 0 && allRoutesForSearch.length > 0) {
        const lowerQuery = effectiveSearchQuery.toLowerCase().trim()
        
        // Ищем маршруты, где в местах есть совпадение
        const routesWithMatchingPlaces = allRoutesForSearch.filter(route => {
          // Проверяем места в маршруте
          if (Array.isArray(route.places) && route.places.length > 0) {
            return route.places.some(place => {
              const placeTitle = place.title || place.name || ''
              return placeTitle.toLowerCase().includes(lowerQuery)
            })
          }
          return false
        })
        
        if (routesWithMatchingPlaces.length > 0) {
          // Берем только нужное количество для текущей страницы
          const startIndex = (page - 1) * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          newItems = routesWithMatchingPlaces.slice(startIndex, endIndex)
          totalItems = routesWithMatchingPlaces.length
        }
      } else if (effectiveSearchQuery && newItems.length > 0) {
        // Если есть результаты от API, дополнительно проверяем места для полноты
        // Но не перезаписываем результаты, так как API уже что-то нашел
        const lowerQuery = effectiveSearchQuery.toLowerCase().trim()
        
        // Проверяем, может быть есть еще маршруты с местами, которые API не вернул
        const routesWithMatchingPlaces = allRoutesForSearch.filter(route => {
          // Пропускаем уже найденные маршруты
          if (newItems.some(item => item.id === route.id || item._id === route._id)) {
            return false
          }
          
          // Проверяем места в маршруте
          if (Array.isArray(route.places) && route.places.length > 0) {
            return route.places.some(place => {
              const placeTitle = place.title || place.name || ''
              return placeTitle.toLowerCase().includes(lowerQuery)
            })
          }
          return false
        })
        
        // Добавляем найденные маршруты с местами к результатам
        if (routesWithMatchingPlaces.length > 0) {
          newItems = [...newItems, ...routesWithMatchingPlaces.slice(0, ITEMS_PER_PAGE - newItems.length)]
          totalItems = Math.max(totalItems, newItems.length)
        }
      }
      
      if (reset) {
        setRoutes(newItems)
        setHasMore(newItems.length === ITEMS_PER_PAGE && newItems.length < totalItems)
      } else {
        setRoutes(prev => {
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
        setRoutes([])
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
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, allRoutesForSearch])

  // Загрузка маршрутов при изменении фильтров/поиска/сортировки
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchRoutes(1, true)
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, fetchRoutes])

  // Intersection Observer для lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1
          setCurrentPage(nextPage)
          fetchRoutes(nextPage, false)
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
  }, [hasMore, loading, loadingMore, currentPage, fetchRoutes])

  // Восстанавливаем позицию скролла при возврате на страницу
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScroll, 10),
          behavior: 'instant'
        })
      }, 0)
      sessionStorage.removeItem(SCROLL_KEY)
    }
  }, [])

  // Сохраняем позицию скролла перед уходом со страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
    }
    const handleClick = (e) => {
      const link = e.target.closest('a[href^="/routes/"]')
      if (link) {
        sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  // Загрузка данных страницы
  useEffect(() => {
    let cancelled = false
    publicPagesAPI.get('routes')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'МАРШРУТЫ',
              description: data.content.hero.description || 'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"',
              image: data.content.hero.image || '/full_roates_bg.jpg',
            },
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPageContent({
            hero: {
              title: 'МАРШРУТЫ',
              description: 'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"',
              image: '/full_roates_bg.jpg',
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
            filterGroups={routeFilterGroups}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Введите запрос"
            suggestionsData={allRoutesForSearch || []}
            getSuggestionTitle={(item) => item.title || item.name}
            maxSuggestions={5}
          />
          <div className={styles.routes}>
            <div className={styles.routesSort}>
              <div className={styles.routesSortFind}>
                Найдено {total} маршрутов
              </div>
              <div className={styles.routesSortSort}>
                <div className={styles.title}>Сортировать:</div>
                <FormControl className={styles.selectWrapper}>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    className={styles.select}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Сортировка маршрутов' }}
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
                      value="difficulty"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      По сложности
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            
            <div className={styles.routesShow}>
              {loading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : routes.length === 0 ? (
                <div className={styles.empty}>Маршруты не найдены</div>
              ) : (
                <>
                  {routes.map((route) => (
                    <RouteBlock key={route.id} route={route} />
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
    </main>
  )
}
