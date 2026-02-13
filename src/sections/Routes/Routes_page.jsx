'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Routes_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import FilterBlockMobile from '@/components/FilterBlock/FilterBlockMobile'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import { publicRoutesAPI, publicPagesAPI, getImageUrl } from '@/lib/api'
import { searchInObject, searchWithFallback } from '@/lib/searchUtils'

const SCROLL_KEY = 'routes_scroll_position'
const ITEMS_PER_PAGE = 10

function areFiltersEqual(a = {}, b = {}) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false

  for (const k of aKeys) {
    const av = a[k]
    const bv = b[k]

    const aArr = Array.isArray(av) ? av : []
    const bArr = Array.isArray(bv) ? bv : []

    if (aArr.length !== bArr.length) return false
    for (let i = 0; i < aArr.length; i++) {
      if (String(aArr[i]) !== String(bArr[i])) return false
    }
  }
  return true
}

export default function Routes_page() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [sortBy, setSortBy] = useState('popularity')
  const [searchQuery, setSearchQuery] = useState('')
  const [routes, setRoutes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({})
  const [filterOptions, setFilterOptions] = useState(null)
  const [allRoutesForSearch, setAllRoutesForSearch] = useState([])
  const [searchFallback, setSearchFallback] = useState(null)

  const searchDebounceRef = useRef(null)
  const routesStartRef = useRef(null)
  const shouldScrollOnLoadRef = useRef(false)

  const lastFiltersQueryRef = useRef('')
  const didInitCriteriaRef = useRef(false)
  const lastCriteriaRef = useRef('')
  const heroRef = useRef(null)

  const [pageOverlayLoading, setPageOverlayLoading] = useState(false)
  const navTokenRef = useRef(0)
  const navStartedAtRef = useRef(0)
  const pendingNavPageRef = useRef(null)

  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'МАРШРУТЫ',
      description:
        'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"',
      image: '/full_roates_bg.jpg',
    },
  })

  // Текущая страница — только из URL (это и решает рефреш)
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return Number.isFinite(p) && p >= 1 ? p : 1
  }, [searchParams])

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  // важный фикс: не обновлять filters, если они “такие же”
  const handleFiltersChange = useCallback((next) => {
    setFilters((prev) => (areFiltersEqual(prev, next) ? prev : next))
  }, [])

  // Все группы фильтров: встроенные + extra
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

  const routeFilterGroups = useMemo(() => {
    return [
      ...FIXED_GROUP_KEYS.map((key) => {
        const meta = filterOptions?.fixedGroupMeta?.[key]
        const label = (meta?.label && meta.label.trim()) || key
        const options = Array.isArray(filterOptions?.[key]) ? filterOptions[key] : []
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
  }, [filterOptions])

  // --- СИНХРОНИЗАЦИЯ ФИЛЬТРОВ ИЗ URL (НО НЕ РЕАГИРУЕМ НА page) ---
  useEffect(() => {
    if (!filterOptions) return

    const spNoPage = new URLSearchParams(searchParams)
    spNoPage.delete('page')
    const filtersQuery = spNoPage.toString()

    // если поменялась только page — выходим
    if (filtersQuery === lastFiltersQueryRef.current) return
    lastFiltersQueryRef.current = filtersQuery

    const filtersFromUrl = {}

    FIXED_GROUP_KEYS.forEach((key) => {
      const values = searchParams.getAll(key).filter(Boolean)
      if (values.length > 0) filtersFromUrl[key] = values
    })

    if (filterOptions?.extraGroups) {
      filterOptions.extraGroups.forEach((group) => {
        if (!group.key) return
        const values = searchParams.getAll(group.key).filter(Boolean)
        if (values.length > 0) filtersFromUrl[group.key] = values
      })
    }

    if (Object.keys(filtersFromUrl).length === 0) return

    setFilters((prev) => {
      const merged = { ...prev, ...filtersFromUrl }
      return areFiltersEqual(prev, merged) ? prev : merged
    })
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

  // Загрузка всех маршрутов для умного поиска (один раз)
  useEffect(() => {
    let cancelled = false
    publicRoutesAPI
      .getAll({ limit: 1000 })
      .then(({ data }) => {
        if (!cancelled) setAllRoutesForSearch(data?.items || [])
      })
      .catch(() => {
        if (!cancelled) setAllRoutesForSearch([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Умный поиск с fallback логикой
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!searchQuery || !searchQuery.trim()) {
      setSearchFallback(null)
      return
    }

    const timer = setTimeout(async () => {
      const performSearch = async (query) => {
        if (!query || !query.trim()) return []
        const lowerQuery = query.toLowerCase().trim()

        return allRoutesForSearch.filter((item) => {
          if (searchInObject(item, lowerQuery)) return true

          if (Array.isArray(item.places) && item.places.length > 0) {
            return item.places.some((place) => {
              const placeTitle = place.title || place.name || ''
              return placeTitle.toLowerCase().includes(lowerQuery)
            })
          }

          return false
        })
      }

      const { fallback } = await searchWithFallback(searchQuery, performSearch)
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
    publicRoutesAPI
      .getFilters()
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
            fixedGroupMeta:
              data.fixedGroupMeta && typeof data.fixedGroupMeta === 'object' ? data.fixedGroupMeta : {},
          })

          // Инициализируем filters с пустыми массивами для всех групп
          setFilters((prev) => {
            const next = { ...prev }
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
    return () => {
      cancelled = true
    }
  }, [])

  // --- fetchRoutes ---
  const fetchRoutes = useCallback(
    async (page = 1) => {
      const startTime = Date.now()
      const MIN_LOADING_TIME = 500

      try {
        setLoading(true)

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

        // fallback-поиск по places если API ничего не вернул
        if (effectiveSearchQuery && newItems.length === 0 && allRoutesForSearch.length > 0) {
          const lowerQuery = effectiveSearchQuery.toLowerCase().trim()

          const routesWithMatchingPlaces = allRoutesForSearch.filter((route) => {
            if (Array.isArray(route.places) && route.places.length > 0) {
              return route.places.some((place) => {
                const placeTitle = place.title || place.name || ''
                return placeTitle.toLowerCase().includes(lowerQuery)
              })
            }
            return false
          })

          if (routesWithMatchingPlaces.length > 0) {
            const startIndex = (page - 1) * ITEMS_PER_PAGE
            const endIndex = startIndex + ITEMS_PER_PAGE
            newItems = routesWithMatchingPlaces.slice(startIndex, endIndex)
            totalItems = routesWithMatchingPlaces.length
          }
        }

        // Убираем дубликаты
        const uniqueRoutes = []
        const seenIds = new Set()
        for (const route of newItems) {
          const routeId = String(route.id || route._id || '')
          if (routeId && !seenIds.has(routeId)) {
            seenIds.add(routeId)
            uniqueRoutes.push(route)
          }
        }

        const pages = Math.max(1, Math.ceil((totalItems || 0) / ITEMS_PER_PAGE))

        setRoutes(uniqueRoutes)
        setTotal(totalItems)
        setTotalPages(pages)

        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
        await new Promise((resolve) => setTimeout(resolve, remainingTime))
      } catch (err) {
        console.error(err)
        setRoutes([])
        setTotal(0)
        setTotalPages(1)

        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
        await new Promise((resolve) => setTimeout(resolve, remainingTime))
      } finally {
        setLoading(false)
      }
    },
    [filters, searchQuery, searchFallback, sortBy, filterOptions, allRoutesForSearch]
  )

  // --- СБРОС page=1 ПРИ ИЗМЕНЕНИИ КРИТЕРИЕВ (НО НЕ НА ПЕРВОМ ЗАПУСКЕ) ---
  useEffect(() => {
    // дождёмся загрузки filterOptions (чтобы рефреш не дергал критерии в момент инициализации)
    if (!filterOptions) return

    const criteria = JSON.stringify({
      filters,
      searchQuery,
      searchFallback,
      sortBy,
    })

    if (criteria === lastCriteriaRef.current) return
    lastCriteriaRef.current = criteria

    // первый запуск после готовности опций — НЕ сбрасываем страницу (важно для refresh)
    if (!didInitCriteriaRef.current) {
      didInitCriteriaRef.current = true
      return
    }

    // дальше: любое изменение критериев → page=1
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    }, { replace: true })

    shouldScrollOnLoadRef.current = true
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, setSearchParams])

  // --- ЗАГРУЗКА МАРШРУТОВ ПРИ СМЕНЕ page ИЛИ КРИТЕРИЕВ ---
  useEffect(() => {
    fetchRoutes(currentPage)
  }, [currentPage, fetchRoutes])

  // Прокрутка к началу списка после загрузки (только когда флаг выставлен)
  // useEffect(() => {
  //   if (!loading && routes.length > 0 && shouldScrollOnLoadRef.current) {
  //     shouldScrollOnLoadRef.current = false
  //     setTimeout(() => {
  //       if (routesStartRef.current) {
  //         routesStartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  //       } else {
  //         window.scrollTo({ top: 0, behavior: 'smooth' })
  //       }
  //     }, 100)
  //   }
  // }, [loading, routes.length])

  // Обработчики пагинации (меняем ТОЛЬКО URL)
  const scrollToRoutesStartInstant = useCallback(() => {
    const el = routesStartRef.current
    if (el) {
      // мгновенно
      el.scrollIntoView({ behavior: 'auto', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [])

  const scrollToAfterHeroInstant = useCallback(() => {
    const heroEl = heroRef.current
    const root = document.documentElement
    const prev = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'

    if (!heroEl) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      root.style.scrollBehavior = prev
      return
    }

    const heroBottom = heroEl.getBoundingClientRect().bottom + window.scrollY
    const headerOffset = 0 // если есть фикс хедер — поставь, например, 80
    window.scrollTo({ top: Math.max(0, heroBottom - headerOffset), behavior: 'auto' })

    root.style.scrollBehavior = prev
  }, [])

  const waitForScrollToSettle = useCallback(() => {
    // ждём, пока scrollY перестанет меняться (2 кадра подряд)
    return new Promise((resolve) => {
      let lastY = window.scrollY
      let stableFrames = 0

      const tick = () => {
        const y = window.scrollY
        if (Math.abs(y - lastY) < 2) {
          stableFrames += 1
        } else {
          stableFrames = 0
          lastY = y
        }

        if (stableFrames >= 2) {
          resolve()
          return
        }
        requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  }, [])

  const goToPage = useCallback(
    async (page) => {
      const nextPage = Math.max(1, page)

      // если кликают по текущей — ничего
      if (nextPage === currentPage) return

      // новый токен навигации (если кликнут ещё раз — старое отменится)
      const token = ++navTokenRef.current
      pendingNavPageRef.current = nextPage
      navStartedAtRef.current = Date.now()

      // включаем оверлей-лоадер
      setPageOverlayLoading(true)

      // 1) мгновенно скроллим
      scrollToAfterHeroInstant()

      // 2) ждём стабилизации скролла
      await waitForScrollToSettle()
      if (token !== navTokenRef.current) return

      // 3) меняем URL (после доскролла)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(nextPage))
        return next
      }, { replace: true })
    },
    [currentPage, setSearchParams, scrollToAfterHeroInstant, waitForScrollToSettle]
  )


  useEffect(() => {
    if (!pageOverlayLoading) return
    if (loading) return

    // если нет активной навигации — ничего
    if (pendingNavPageRef.current == null) return

    const minTime = 500
    const elapsed = Date.now() - navStartedAtRef.current
    const remain = Math.max(0, minTime - elapsed)

    const t = setTimeout(() => {
      // если за время ожидания была новая навигация — не гасим
      if (pendingNavPageRef.current == null) return
      setPageOverlayLoading(false)
      pendingNavPageRef.current = null
    }, remain)

    return () => clearTimeout(t)
  }, [pageOverlayLoading, loading])


  const handlePrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1)
  }

  const handlePageClick = (page) => {
    goToPage(page)
  }

  // Восстанавливаем позицию скролла при возврате на страницу
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScroll, 10),
          behavior: 'instant',
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
    publicPagesAPI
      .get('routes')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'МАРШРУТЫ',
              description:
                data.content.hero.description ||
                'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"',
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
              description:
                'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"',
              image: '/full_roates_bg.jpg',
            },
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className={styles.main}>
      {pageOverlayLoading && (
        <div className={styles.pageOverlayLoader} aria-live="polite" aria-busy="true">
          <div className={styles.pageOverlayLoaderInner}>
            Загрузка...
          </div>
        </div>
      )}

      <div ref={heroRef}>
        <ImgFullWidthBlock
          img={getImageUrl(pageContent.hero.image)}
          title={pageContent.hero.title}
          desc={pageContent.hero.description}
        />
      </div>

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

          <FilterBlockMobile
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
            <div ref={routesStartRef} className={styles.routesSort}>
              <div className={styles.routesSortFind}>Найдено {total} маршрутов</div>

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
                  {routes.map((route, index) => (
                    <RouteBlock key={route.id || route._id || `route-${index}`} route={route} />
                  ))}

                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        type="button"
                        className={styles.paginationBtn}
                        onClick={handlePrevPage}
                        disabled={currentPage === 1 || loading}
                        aria-label="Предыдущая страница"
                      >
                        Назад
                      </button>

                      <div className={styles.paginationPages}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                type="button"
                                className={`${styles.paginationPage} ${currentPage === page ? styles.paginationPageActive : ''
                                  }`}
                                onClick={() => handlePageClick(page)}
                                disabled={loading}
                                aria-label={`Страница ${page}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                              >
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className={styles.paginationDots}>
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>

                      <button
                        type="button"
                        className={styles.paginationBtn}
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading}
                        aria-label="Следующая страница"
                      >
                        Вперед
                      </button>
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
