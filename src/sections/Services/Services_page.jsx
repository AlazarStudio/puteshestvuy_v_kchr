import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Services_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import ServiceCardWithParallax from '@/components/ServiceCardWithParallax/ServiceCardWithParallax'
import { publicServicesAPI, publicNewsAPI, publicPagesAPI, getImageUrl } from '@/lib/api'
import { CATEGORY_TO_TEMPLATE_KEY, DEFAULT_TEMPLATE_KEY } from './ServiceDetail/serviceTypeTemplates'
import { searchInObject, searchWithFallback } from '@/lib/searchUtils'

const SCROLL_KEY = 'services_scroll_position'
const ITEMS_PER_PAGE = 12

// Соответствие опций фильтра и категорий в API (как в админке)
const FILTER_TO_CATEGORY = {
  'Гиды': 'Гид',
  'Активности': 'Активности',
  'Прокат оборудования': 'Прокат оборудования',
  'Пункты придорожного сервиса': 'Придорожный пункт',
  'Торговые точки': 'Торговая точка',
  'Сувениры': 'Сувениры',
  'Гостиницы': 'Гостиница',
  'Кафе и рестораны': 'Кафе и ресторан',
  'Трансфер': 'Трансфер',
  'АЗС': 'АЗС',
  'Санитарные узлы': 'Санитарные узлы',
  'Пункты медпомощи': 'Пункт медпомощи',
  'МВД': 'МВД',
  'Пожарная охрана': 'Пожарная охрана',
  'Музеи': 'Музей',
}

const SERVICE_FILTER_OPTIONS = [
  'Гиды',
  'Активности',
  'Прокат оборудования',
  'Пункты придорожного сервиса',
  'Торговые точки',
  'Сувениры',
  'Гостиницы',
  'Кафе и рестораны',
  'Трансфер',
  'АЗС',
  'Санитарные узлы',
  'Музеи',
]

const EMERGENCY_FILTER_OPTIONS = [
  'Пункты медпомощи',
  'МВД',
  'Пожарная охрана',
]

const LABEL_TO_URL_FILTER = {
  'Статьи': 'articles',
  'Гиды': 'guides',
  'Активности': 'activities',
  'Прокат оборудования': 'equipment-rental',
  'Пункты придорожного сервиса': 'roadside-service',
  'Торговые точки': 'shops',
  'Сувениры': 'souvenirs',
  'Гостиницы': 'hotels',
  'Кафе и рестораны': 'restaurants',
  'Трансфер': 'transfer',
  'АЗС': 'gas-stations',
  'Санитарные узлы': 'restrooms',
  'Пункты медпомощи': 'medical',
  'МВД': 'police',
  'Пожарная охрана': 'fire-department',
  'Музеи': 'museums',
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

export default function Services_page() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState('popularity')
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const observerTarget = useRef(null)
  const getFiltersFromUrl = () => {
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
  }

  const [filters, setFilters] = useState(() => getFiltersFromUrl())
  const [searchQuery, setSearchQuery] = useState('')
  const [allServicesForSearch, setAllServicesForSearch] = useState([])
  const [allArticlesForSearch, setAllArticlesForSearch] = useState([])
  const [searchFallback, setSearchFallback] = useState(null)
  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'УСЛУГИ И СЕРВИСЫ',
      description: 'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии',
      image: '/full_roates_bg.jpg',
    },
  })
  const searchDebounceRef = useRef(null)

  // Синхронизация фильтров с URL при переходе по ссылке (например, из хедера)
  const filterParamsStr = searchParams.toString()
  useEffect(() => {
    setFilters(getFiltersFromUrl())
  }, [filterParamsStr])

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  // Загрузка всех услуг и статей для умного поиска (один раз при монтировании)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      publicServicesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicNewsAPI.getAll({ limit: 1000, type: 'article' }).catch(() => ({ data: { items: [] } })),
    ])
      .then(([servicesRes, articlesRes]) => {
        if (!cancelled) {
          setAllServicesForSearch(servicesRes.data?.items || [])
          setAllArticlesForSearch(articlesRes.data?.items || [])
        }
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
        
        // Объединяем услуги и статьи для поиска
        const allItems = [
          ...allServicesForSearch.map(item => ({ ...item, _searchType: 'service' })),
          ...allArticlesForSearch.map(item => ({ ...item, _searchType: 'article' })),
        ]
        
        return allItems.filter(item => searchInObject(item, lowerQuery))
      }

      const { results, fallback } = await searchWithFallback(searchQuery, performSearch)
      setSearchFallback(fallback)
    }, 300)

    searchDebounceRef.current = timer

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [searchQuery, allServicesForSearch, allArticlesForSearch])

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
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
    if (filterValues.length === 0) {
      setSearchParams({})
    } else {
      const params = new URLSearchParams()
      filterValues.forEach((f) => params.append('filter', f))
      setSearchParams(params)
    }
  }

  const buildCategoryParams = () => {
    const serviceSelected = (filters.service || []).map((v) => FILTER_TO_CATEGORY[v] || v)
    const emergencySelected = (filters.emergency || []).map((v) => FILTER_TO_CATEGORY[v] || v)
    return [...serviceSelected, ...emergencySelected]
  }

  const fetchData = useCallback(async (page = 1, reset = false) => {
    const startTime = Date.now()
    const MIN_LOADING_TIME = 500 // минимум 500ms
    
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      const showArticles = (filters.articles || []).includes('Статьи')
      const categories = buildCategoryParams()
      const hasServiceFilter = categories.length > 0

      // Используем fallback запрос, если он есть, иначе оригинальный
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

      if (showArticles && !hasServiceFilter) {
        const { data } = await fetchArticles()
        const newItems = (data.items || []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          category: 'Статья',
          isArticle: true,
          uniqueViewsCount: 0,
        }))
        const totalItems = data.pagination?.total ?? 0
        
        if (reset) {
          setServices(newItems)
          setHasMore(newItems.length === ITEMS_PER_PAGE && newItems.length < totalItems)
        } else {
          setServices(prev => {
            const updated = [...prev, ...newItems]
            setHasMore(updated.length < totalItems)
            return updated
          })
        }
        setTotal(totalItems)
      } else if (hasServiceFilter && !showArticles) {
        const { data } = await fetchServices(categories)
        let newItems = data.items || []
        if (sortBy === 'rating') {
          newItems = [...newItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        } else if (sortBy === 'reviews') {
          newItems = [...newItems].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
        } else if (sortBy === 'popularity') {
          newItems = [...newItems].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))
        }
        const totalItems = data.pagination?.total ?? 0
        
        if (reset) {
          setServices(newItems)
          setHasMore(newItems.length === ITEMS_PER_PAGE && newItems.length < totalItems)
        } else {
          setServices(prev => {
            const updated = [...prev, ...newItems]
            setHasMore(updated.length < totalItems)
            return updated
          })
        }
        setTotal(totalItems)
      } else if (showArticles && hasServiceFilter) {
        const [articlesRes, servicesRes] = await Promise.all([
          fetchArticles(),
          fetchServices(categories),
        ])
        
        let serviceItems = servicesRes.data?.items || []
        if (sortBy === 'rating') {
          serviceItems = [...serviceItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        } else if (sortBy === 'reviews') {
          serviceItems = [...serviceItems].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
        } else if (sortBy === 'popularity') {
          serviceItems = [...serviceItems].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))
        }
        const articleItems = (articlesRes.data?.items || []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          category: 'Статья',
          isArticle: true,
          uniqueViewsCount: 0,
        }))
        const newItems = [...serviceItems, ...articleItems]
        if (sortBy === 'popularity') {
          newItems.sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))
        }
        const totalItems = (servicesRes.data?.pagination?.total ?? 0) + (articlesRes.data?.pagination?.total ?? 0)
        
        if (reset) {
          setServices(newItems)
          setHasMore(newItems.length === ITEMS_PER_PAGE && newItems.length < totalItems)
        } else {
          setServices(prev => {
            const updated = [...prev, ...newItems]
            setHasMore(updated.length < totalItems)
            return updated
          })
        }
        setTotal(totalItems)
      } else {
        const [servicesRes, articlesRes] = await Promise.all([
          fetchServices(),
          fetchArticles(),
        ])
        
        let serviceItems = servicesRes.data?.items || []
        if (sortBy === 'rating') {
          serviceItems = [...serviceItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        } else if (sortBy === 'reviews') {
          serviceItems = [...serviceItems].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
        } else if (sortBy === 'popularity') {
          serviceItems = [...serviceItems].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))
        }
        const articleItems = (articlesRes.data?.items || []).map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          image: a.image,
          category: 'Статья',
          isArticle: true,
          uniqueViewsCount: 0,
        }))
        const newItems = [...serviceItems, ...articleItems]
        if (sortBy === 'popularity') {
          newItems.sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))
        }
        const totalItems = (servicesRes.data?.pagination?.total ?? 0) + (articlesRes.data?.pagination?.total ?? 0)
        
        if (reset) {
          setServices(newItems)
          setHasMore(newItems.length === ITEMS_PER_PAGE && newItems.length < totalItems)
        } else {
          setServices(prev => {
            const updated = [...prev, ...newItems]
            setHasMore(updated.length < totalItems)
            return updated
          })
        }
        setTotal(totalItems)
      }
      
      // Гарантируем минимальное время отображения лоадера
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    } catch (err) {
      console.error(err)
      if (reset) {
        setServices([])
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
  }, [filters.service, filters.emergency, filters.articles, searchQuery, searchFallback, sortBy])

  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchData(1, true)
  }, [filters.service, filters.emergency, filters.articles, searchQuery, searchFallback, sortBy, fetchData])

  // Intersection Observer для lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1
          setCurrentPage(nextPage)
          fetchData(nextPage, false)
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
  }, [hasMore, loading, loadingMore, currentPage, fetchData])

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' })
      }, 0)
      sessionStorage.removeItem(SCROLL_KEY)
    }
  }, [])

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
    publicPagesAPI.get('services')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'УСЛУГИ И СЕРВИСЫ',
              description: data.content.hero.description || 'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии',
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
              description: 'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии',
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
                    <MenuItem value="popularity" sx={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: '16px', fontWeight: 400, lineHeight: '150%' }}>
                      По популярности
                    </MenuItem>
                    <MenuItem value="rating" sx={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: '16px', fontWeight: 400, lineHeight: '150%' }}>
                      По рейтингу
                    </MenuItem>
                    <MenuItem value="reviews" sx={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: '16px', fontWeight: 400, lineHeight: '150%' }}>
                      По отзывам
                    </MenuItem>
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
                    const serviceUrl = isArticle ? `/news/${service.slug || service.id}` : `/services/${service.slug || service.id}`
                    
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
        </section>
      </CenterBlock>
    </main>
  )
}
