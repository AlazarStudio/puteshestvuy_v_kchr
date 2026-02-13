'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Services_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import FilterBlockMobile from '@/components/FilterBlock/FilterBlockMobile'
import ServiceCardWithParallax from '@/components/ServiceCardWithParallax/ServiceCardWithParallax'
import { publicServicesAPI, publicNewsAPI, publicPagesAPI, getImageUrl } from '@/lib/api'
import { searchInObject, searchWithFallback } from '@/lib/searchUtils'

const SCROLL_KEY = 'services_scroll_position'
const ITEMS_PER_PAGE = 6

// Соответствие опций фильтра и категорий в API (как в админке)
const FILTER_TO_CATEGORY = {
  Гиды: 'Гид',
  Активности: 'Активности',
  'Прокат оборудования': 'Прокат оборудования',
  'Пункты придорожного сервиса': 'Придорожный пункт',
  'Торговые точки': 'Торговая точка',
  Музеи: 'Музей',
  Сувениры: 'Сувениры',
  Гостиницы: 'Гостиница',
  'Кафе и рестораны': 'Кафе и ресторан',
  Трансфер: 'Трансфер',
  АЗС: 'АЗС',
  'Санитарные узлы': 'Санитарные узлы',
  'Пункты медпомощи': 'Пункт медпомощи',
  МВД: 'МВД',
  'Пожарная охрана': 'Пожарная охрана',
}

const SERVICE_FILTER_OPTIONS = [
  'Гиды',
  'Активности',
  'Музеи',
  'Прокат оборудования',
  'Пункты придорожного сервиса',
  'Торговые точки',
  'Сувениры',
  'Гостиницы',
  'Кафе и рестораны',
  'Трансфер',
  'АЗС',
  'Санитарные узлы',
]

const EMERGENCY_FILTER_OPTIONS = ['Пункты медпомощи', 'МВД', 'Пожарная охрана']

const LABEL_TO_URL_FILTER = {
  Статьи: 'articles',
  Гиды: 'guides',
  Активности: 'activities',
  'Прокат оборудования': 'equipment-rental',
  'Пункты придорожного сервиса': 'roadside-service',
  'Торговые точки': 'shops',
  Сувениры: 'souvenirs',
  Гостиницы: 'hotels',
  'Кафе и рестораны': 'restaurants',
  Трансфер: 'transfer',
  АЗС: 'gas-stations',
  'Санитарные узлы': 'restrooms',
  'Пункты медпомощи': 'medical',
  МВД: 'police',
  'Пожарная охрана': 'fire-department',
  Музеи: 'museums',
}

const URL_FILTER_TO_LABEL = {
  articles: 'Статьи',
  guides: 'Гиды',
  activities: 'Активности',
  'equipment-rental': 'Прокат оборудования',
  'roadside-service': 'Пункты придорожного сервиса',
  shops: 'Торговые точки',
  souvenirs: 'Сувениры',
  hotels: 'Гостиницы',
  restaurants: 'Кафе и рестораны',
  transfer: 'Трансфер',
  'gas-stations': 'АЗС',
  restrooms: 'Санитарные узлы',
  medical: 'Пункты медпомощи',
  police: 'МВД',
  'fire-department': 'Пожарная охрана',
  museums: 'Музеи',
}

const filterGroups = [
  { key: 'articles', label: 'Статьи', options: ['Статьи'] },
  { key: 'service', label: 'Сервис', options: SERVICE_FILTER_OPTIONS },
  { key: 'emergency', label: 'Экстренные службы', options: EMERGENCY_FILTER_OPTIONS },
]

function areFiltersEqual(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const av = Array.isArray(a[k]) ? a[k] : []
    const bv = Array.isArray(b[k]) ? b[k] : []
    if (av.length !== bv.length) return false
    for (let i = 0; i < av.length; i++) {
      if (String(av[i]) !== String(bv[i])) return false
    }
  }
  return true
}

export default function Services_page() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [sortBy, setSortBy] = useState('popularity')
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState(() => {
    const filterValues = searchParams.getAll('filter')
    const result = { articles: [], service: [], emergency: [] }

    filterValues.forEach((fv) => {
      const label = URL_FILTER_TO_LABEL[fv]
      if (!label) return
      if (label === 'Статьи') {
        result.articles = ['Статьи']
      } else if (EMERGENCY_FILTER_OPTIONS.includes(label)) {
        if (!result.emergency.includes(label)) result.emergency.push(label)
      } else {
        if (!result.service.includes(label)) result.service.push(label)
      }
    })

    return {
      articles: result.articles,
      service: result.service,
      emergency: result.emergency,
    }
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [allServicesForSearch, setAllServicesForSearch] = useState([])
  const [allArticlesForSearch, setAllArticlesForSearch] = useState([])
  const [searchFallback, setSearchFallback] = useState(null)

  const searchDebounceRef = useRef(null)

  const lastCriteriaRef = useRef('')
  const didInitCriteriaRef = useRef(false)

  const heroRef = useRef(null)

  const [pageOverlayLoading, setPageOverlayLoading] = useState(false)
  const navTokenRef = useRef(0)
  const navStartedAtRef = useRef(0)
  const pendingNavPageRef = useRef(null)

  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'УСЛУГИ И СЕРВИСЫ',
      description:
        'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии',
      image: '/full_roates_bg.jpg',
    },
  })

  // currentPage — только из URL (чтобы рефреш сохранял страницу)
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return Number.isFinite(p) && p >= 1 ? p : 1
  }, [searchParams])

  const getFiltersFromUrl = useCallback(() => {
    const filterValues = searchParams.getAll('filter')
    const result = { articles: [], service: [], emergency: [] }

    filterValues.forEach((fv) => {
      const label = URL_FILTER_TO_LABEL[fv]
      if (!label) return
      if (label === 'Статьи') {
        result.articles = ['Статьи']
      } else if (EMERGENCY_FILTER_OPTIONS.includes(label)) {
        if (!result.emergency.includes(label)) result.emergency.push(label)
      } else {
        if (!result.service.includes(label)) result.service.push(label)
      }
    })

    return {
      articles: result.articles,
      service: result.service,
      emergency: result.emergency,
    }
  }, [searchParams])

  // Синхронизация фильтров с URL при переходе по ссылке (но page отдельно)
  const filterParamsStr = searchParams.toString()
  useEffect(() => {
    setFilters((prev) => {
      const next = getFiltersFromUrl()
      return areFiltersEqual(prev, next) ? prev : next
    })
  }, [filterParamsStr, getFiltersFromUrl])

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  // Загрузка всех услуг и статей для умного поиска
  useEffect(() => {
    let cancelled = false
    Promise.all([
      publicServicesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicNewsAPI.getAll({ limit: 1000, type: 'article' }).catch(() => ({ data: { items: [] } })),
    ]).then(([servicesRes, articlesRes]) => {
      if (cancelled) return
      setAllServicesForSearch(servicesRes.data?.items || [])
      setAllArticlesForSearch(articlesRes.data?.items || [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Умный поиск с fallback
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

        const allItems = [
          ...allServicesForSearch.map((item) => ({ ...item, _searchType: 'service' })),
          ...allArticlesForSearch.map((item) => ({ ...item, _searchType: 'article' })),
        ]

        return allItems.filter((item) => searchInObject(item, lowerQuery))
      }

      const { fallback } = await searchWithFallback(searchQuery, performSearch)
      setSearchFallback(fallback)
    }, 300)

    searchDebounceRef.current = timer
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [searchQuery, allServicesForSearch, allArticlesForSearch])

  const applyFiltersToUrl = useCallback((newFilters) => {
    const articles = newFilters.articles || []
    const service = newFilters.service || []
    const emergency = newFilters.emergency || []

    const filterValues = []
    if (articles.includes('Статьи')) filterValues.push('articles')
    service.forEach((s) => {
      const v = LABEL_TO_URL_FILTER[s]
      if (v) filterValues.push(v)
    })
    emergency.forEach((e) => {
      const v = LABEL_TO_URL_FILTER[e]
      if (v) filterValues.push(v)
    })

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('filter')
      filterValues.forEach((f) => next.append('filter', f))
      if (filterValues.length === 0) next.delete('filter')
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Важно: не обновлять filters, если они те же (как в Routes/Places)
  const handleFiltersChange = useCallback((next) => {
    setFilters((prev) => {
      const same = areFiltersEqual(prev, next)
      if (!same) applyFiltersToUrl(next)
      return same ? prev : next
    })
  }, [applyFiltersToUrl])

  const buildCategoryParams = useCallback(() => {
    const serviceSelected = (filters.service || []).map((v) => FILTER_TO_CATEGORY[v] || v)
    const emergencySelected = (filters.emergency || []).map((v) => FILTER_TO_CATEGORY[v] || v)
    return [...serviceSelected, ...emergencySelected]
  }, [filters.service, filters.emergency])

  const fetchData = useCallback(async (page = 1) => {
    const startTime = Date.now()
    const MIN_LOADING_TIME = 500

    try {
      setLoading(true)

      const showArticles = (filters.articles || []).includes('Статьи')
      const categories = buildCategoryParams()
      const hasServiceFilter = categories.length > 0
      const effectiveSearchQuery = searchFallback || searchQuery.trim()

      const fetchArticles = () =>
        publicNewsAPI.getAll({
          page,
          limit: ITEMS_PER_PAGE,
          type: 'article',
          ...(effectiveSearchQuery && { search: effectiveSearchQuery }),
        })

      const fetchServices = (cats) =>
        publicServicesAPI.getAll({
          page,
          limit: ITEMS_PER_PAGE,
          ...(effectiveSearchQuery && { search: effectiveSearchQuery }),
          ...(cats?.length > 0 && { category: cats }),
          ...(sortBy && sortBy !== 'rating' && sortBy !== 'reviews' && { sortBy }),
        })

      let newItems = []
      let totalItems = 0
      let pages = 1

      if (showArticles && !hasServiceFilter) {
        const { data } = await fetchArticles()
        newItems = (data.items || []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          category: 'Статья',
          isArticle: true,
          uniqueViewsCount: 0,
        }))
        totalItems = data.pagination?.total ?? 0
        pages = data.pagination?.pages ?? Math.max(1, Math.ceil((totalItems || 0) / ITEMS_PER_PAGE))
      } else if (hasServiceFilter && !showArticles) {
        const { data } = await fetchServices(categories)
        newItems = data.items || []

        if (sortBy === 'rating') newItems = [...newItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        else if (sortBy === 'reviews') newItems = [...newItems].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
        else if (sortBy === 'popularity') newItems = [...newItems].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))

        totalItems = data.pagination?.total ?? 0
        pages = data.pagination?.pages ?? Math.max(1, Math.ceil((totalItems || 0) / ITEMS_PER_PAGE))
      } else if (showArticles && hasServiceFilter) {
        const [articlesRes, servicesRes] = await Promise.all([fetchArticles(), fetchServices(categories)])

        const servicesTotal = servicesRes.data?.pagination?.total ?? 0
        const articlesTotal = articlesRes.data?.pagination?.total ?? 0

        const servicesPages =
          servicesRes.data?.pagination?.pages ?? Math.max(1, Math.ceil((servicesTotal || 0) / ITEMS_PER_PAGE))
        const articlesPages =
          articlesRes.data?.pagination?.pages ?? Math.max(1, Math.ceil((articlesTotal || 0) / ITEMS_PER_PAGE))

        let serviceItems = servicesRes.data?.items || []
        if (sortBy === 'rating') serviceItems = [...serviceItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        else if (sortBy === 'reviews') serviceItems = [...serviceItems].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
        else if (sortBy === 'popularity') serviceItems = [...serviceItems].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))

        const articleItems = (articlesRes.data?.items || []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          category: 'Статья',
          isArticle: true,
          uniqueViewsCount: 0,
        }))

        newItems = [...serviceItems, ...articleItems]
        if (sortBy === 'popularity') newItems.sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))

        totalItems = servicesTotal + articlesTotal
        pages = Math.max(servicesPages, articlesPages)
      } else {
        const [servicesRes, articlesRes] = await Promise.all([fetchServices(), fetchArticles()])

        const servicesTotal = servicesRes.data?.pagination?.total ?? 0
        const articlesTotal = articlesRes.data?.pagination?.total ?? 0

        const servicesPages =
          servicesRes.data?.pagination?.pages ?? Math.max(1, Math.ceil((servicesTotal || 0) / ITEMS_PER_PAGE))
        const articlesPages =
          articlesRes.data?.pagination?.pages ?? Math.max(1, Math.ceil((articlesTotal || 0) / ITEMS_PER_PAGE))

        let serviceItems = servicesRes.data?.items || []
        if (sortBy === 'rating') serviceItems = [...serviceItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        else if (sortBy === 'reviews') serviceItems = [...serviceItems].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
        else if (sortBy === 'popularity') serviceItems = [...serviceItems].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))

        const articleItems = (articlesRes.data?.items || []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          category: 'Статья',
          isArticle: true,
          uniqueViewsCount: 0,
        }))

        newItems = [...serviceItems, ...articleItems]
        if (sortBy === 'popularity') newItems.sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))

        totalItems = servicesTotal + articlesTotal
        pages = Math.max(servicesPages, articlesPages)
      }

      setServices(newItems)
      setTotal(totalItems)
      setTotalPages(Math.max(1, pages))

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    } catch (err) {
      console.error(err)
      setServices([])
      setTotal(0)
      setTotalPages(1)

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    } finally {
      setLoading(false)
    }
  }, [filters, buildCategoryParams, searchQuery, searchFallback, sortBy])

  // При изменении критериев → page=1 (но НЕ на первом запуске)
  useEffect(() => {
    const criteria = JSON.stringify({ filters, searchQuery, searchFallback, sortBy })
    if (criteria === lastCriteriaRef.current) return
    lastCriteriaRef.current = criteria

    if (!didInitCriteriaRef.current) {
      didInitCriteriaRef.current = true
      return
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    }, { replace: true })
  }, [filters, searchQuery, searchFallback, sortBy, setSearchParams])

  // Загрузка данных при смене страницы
  useEffect(() => {
    fetchData(currentPage)
  }, [currentPage, fetchData])

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
    const headerOffset = 0
    window.scrollTo({ top: Math.max(0, heroBottom - headerOffset), behavior: 'auto' })

    root.style.scrollBehavior = prev
  }, [])

  const waitForScrollToSettle = useCallback(() => {
    return new Promise((resolve) => {
      let lastY = window.scrollY
      let stableFrames = 0

      const tick = () => {
        const y = window.scrollY
        if (Math.abs(y - lastY) < 2) stableFrames += 1
        else {
          stableFrames = 0
          lastY = y
        }

        if (stableFrames >= 2) return resolve()
        requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  }, [])

  const goToPage = useCallback(async (page) => {
    const nextPage = Math.max(1, page)
    if (nextPage === currentPage) return

    const token = ++navTokenRef.current
    pendingNavPageRef.current = nextPage
    navStartedAtRef.current = Date.now()

    setPageOverlayLoading(true)

    scrollToAfterHeroInstant()
    await waitForScrollToSettle()
    if (token !== navTokenRef.current) return

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(nextPage))
      return next
    }, { replace: true })
  }, [currentPage, scrollToAfterHeroInstant, waitForScrollToSettle, setSearchParams])

  useEffect(() => {
    if (!pageOverlayLoading) return
    if (loading) return
    if (pendingNavPageRef.current == null) return

    const minTime = 500
    const elapsed = Date.now() - navStartedAtRef.current
    const remain = Math.max(0, minTime - elapsed)

    const t = setTimeout(() => {
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

  // восстановление скролла
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' })
      }, 0)
      sessionStorage.removeItem(SCROLL_KEY)
    }
  }, [])

  // сохраняем скролл перед переходом на /services/*
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a[href^="/services/"]')
      if (link) sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const showArticlesOnly = (filters.articles || []).includes('Статьи')

  // Загрузка данных страницы
  useEffect(() => {
    let cancelled = false
    publicPagesAPI
      .get('services')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'УСЛУГИ И СЕРВИСЫ',
              description:
                data.content.hero.description ||
                'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии',
              image: data.content.hero.image || '/full_roates_bg.jpg',
            },
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPageContent({
            hero: {
              title: 'УСЛУГИ И СЕРВИСЫ',
              description:
                'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии',
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
          <div className={styles.pageOverlayLoaderInner}>Загрузка...</div>
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
          {/* Desktop filter */}
          <FilterBlock
            filterGroups={filterGroups}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Поиск по услугам..."
            suggestionsData={[...(allServicesForSearch || []), ...(allArticlesForSearch || [])]}
            getSuggestionTitle={(item) => item.title || item.name}
            maxSuggestions={5}
          />

          {/* Mobile filter */}
          <FilterBlockMobile
            filterGroups={filterGroups}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Поиск по услугам..."
            suggestionsData={[...(allServicesForSearch || []), ...(allArticlesForSearch || [])]}
            getSuggestionTitle={(item) => item.title || item.name}
            maxSuggestions={5}
          />

          <div className={styles.services}>
            <div className={styles.servicesSort}>
              <div className={styles.servicesSortFind}>
                Найдено {total} {showArticlesOnly ? 'статей' : 'услуг'}
              </div>

              <div className={styles.servicesSortSort}>
                <div className={styles.title}>Сортировать:</div>
                <FormControl className={styles.selectWrapper}>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    className={styles.select}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Сортировка услуг' }}
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
                            '&:hover': { backgroundColor: '#156A60' },
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
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#156A60' },
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
                      '& .MuiSvgIcon-root': { color: '#000' },
                    }}
                  >
                    <MenuItem value="popularity">По популярности</MenuItem>
                    <MenuItem value="rating">По рейтингу</MenuItem>
                    <MenuItem value="reviews">По отзывам</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Загрузка...</p>
              </div>
            ) : services.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{showArticlesOnly ? 'Статьи не найдены.' : 'По выбранным фильтрам услуг не найдено.'}</p>
              </div>
            ) : (
              <>
                <div className={styles.servicesGrid}>
                  {services.map((service) => {
                    const isArticle = service.isArticle === true
                    const serviceUrl = isArticle
                      ? `/news/${service.slug || service.id}`
                      : `/services/${service.slug || service.id}`

                    return (
                      <ServiceCardWithParallax
                        key={service.id}
                        service={service}
                        serviceUrl={serviceUrl}
                        isArticle={isArticle}
                        styles={styles}
                      />
                    )
                  })}
                </div>

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
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              type="button"
                              className={`${styles.paginationPage} ${currentPage === page ? styles.paginationPageActive : ''}`}
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
        </section>
      </CenterBlock>
    </main>
  )
}
