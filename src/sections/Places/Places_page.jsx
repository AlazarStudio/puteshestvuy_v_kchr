'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Places_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import FilterBlockMobile from '@/components/FilterBlock/FilterBlockMobile'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import PlaceModal from '@/components/PlaceModal/PlaceModal'
import { publicPlacesAPI, publicPagesAPI, getImageUrl } from '@/lib/api'
import { stripHtml } from '@/lib/utils'
import { searchInObject, searchWithFallback } from '@/lib/searchUtils'

const ITEMS_PER_PAGE = 15

function areFiltersEqual(a = {}, b = {}) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false

  for (const k of aKeys) {
    const aArr = Array.isArray(a[k]) ? a[k] : []
    const bArr = Array.isArray(b[k]) ? b[k] : []
    if (aArr.length !== bArr.length) return false
    for (let i = 0; i < aArr.length; i++) {
      if (String(aArr[i]) !== String(bArr[i])) return false
    }
  }
  return true
}

export default function Places_page() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [sortBy, setSortBy] = useState('popularity')
  const [places, setPlaces] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState({})
  const [filterOptions, setFilterOptions] = useState(null)

  const [allPlacesForSearch, setAllPlacesForSearch] = useState([])
  const [searchFallback, setSearchFallback] = useState(null)

  // searchQuery — из URL
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '')

  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  const scrollPositionRef = useRef(0)
  const isClosingRef = useRef(false)
  const isOpeningRef = useRef(false)

  const searchDebounceRef = useRef(null)
  const isUpdatingFromUrlRef = useRef(false)

  const lastFiltersQueryRef = useRef('')
  const didInitCriteriaRef = useRef(false)
  const lastCriteriaRef = useRef('')

  // hero + overlay
  const heroRef = useRef(null)
  const [pageOverlayLoading, setPageOverlayLoading] = useState(false)
  const navTokenRef = useRef(0)
  const navStartedAtRef = useRef(0)
  const pendingNavPageRef = useRef(null)

  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'ИНТЕРЕСНЫЕ МЕСТА',
      description: 'Создайте свой уникальный маршрут!',
      image: '/full_places_bg.jpg',
    },
  })

  // Текущая страница — только из URL
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return Number.isFinite(p) && p >= 1 ? p : 1
  }, [searchParams])

  // --- helpers scroll ---
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

  // --- sort ---
  const handleSortChange = (event) => setSortBy(event.target.value)

  // --- Filter groups ---
  const placeFilterGroups = useMemo(() => {
    return [
      ...(filterOptions?.directions?.length > 0
        ? [{ key: 'directions', label: 'Направление', options: filterOptions.directions }]
        : []),
      ...(filterOptions?.seasons?.length > 0
        ? [{ key: 'seasons', label: 'Сезон', options: filterOptions.seasons }]
        : []),
      ...(filterOptions?.objectTypes?.length > 0
        ? [{ key: 'objectTypes', label: 'Вид объекта', options: filterOptions.objectTypes }]
        : []),
      ...(filterOptions?.accessibility?.length > 0
        ? [{ key: 'accessibility', label: 'Доступность', options: filterOptions.accessibility }]
        : []),
      ...(Array.isArray(filterOptions?.extraGroups)
        ? filterOptions.extraGroups.map((g) => ({
          key: g.key,
          label: (g.label && g.label.trim()) || g.key,
          options: Array.isArray(g.values) ? g.values : [],
        }))
        : []),
    ]
  }, [filterOptions])

  // --- sync searchQuery <-> URL (без циклов) ---
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    if (searchFromUrl !== searchQuery) {
      isUpdatingFromUrlRef.current = true
      setSearchQuery(searchFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.search])

  useEffect(() => {
    if (isUpdatingFromUrlRef.current) {
      isUpdatingFromUrlRef.current = false
      return
    }

    const currentSearchInUrl = searchParams.get('search') || ''
    if (searchQuery !== currentSearchInUrl) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (searchQuery && searchQuery.trim()) next.set('search', searchQuery)
        else next.delete('search')
        return next
      }, { replace: true })
    }
  }, [searchQuery, searchParams, setSearchParams])

  // важный фикс: не обновлять filters, если “те же”
  const handleFiltersChange = useCallback((next) => {
    setFilters((prev) => (areFiltersEqual(prev, next) ? prev : next))
  }, [])

  // --- загрузка опций фильтров ---
  useEffect(() => {
    let cancelled = false
    publicPlacesAPI.getFilters()
      .then(({ data }) => {
        if (cancelled || !data) return

        setFilterOptions({
          directions: Array.isArray(data.directions) ? data.directions : [],
          seasons: Array.isArray(data.seasons) ? data.seasons : [],
          objectTypes: Array.isArray(data.objectTypes) ? data.objectTypes : [],
          accessibility: Array.isArray(data.accessibility) ? data.accessibility : [],
          extraGroups: Array.isArray(data.extraGroups) ? data.extraGroups : [],
        })

        // Инициализируем filters с пустыми массивами
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
      })
      .catch((err) => {
        if (!cancelled) console.error('Ошибка загрузки опций фильтров:', err)
      })

    return () => { cancelled = true }
  }, [])

  // --- Загрузка всех мест для умного поиска ---
  useEffect(() => {
    let cancelled = false
    publicPlacesAPI.getAll({ limit: 1000 })
      .then(({ data }) => {
        if (!cancelled) setAllPlacesForSearch(data?.items || [])
      })
      .catch(() => {
        if (!cancelled) setAllPlacesForSearch([])
      })
    return () => { cancelled = true }
  }, [])

  // --- Умный поиск с fallback ---
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

        return allPlacesForSearch.filter((item) => {
          if (searchInObject(item, lowerQuery)) return true
          const loc = item.location || ''
          return loc.toLowerCase().includes(lowerQuery)
        })
      }

      const { fallback } = await searchWithFallback(searchQuery, performSearch)
      setSearchFallback(fallback)
    }, 300)

    searchDebounceRef.current = timer
    return () => { if (timer) clearTimeout(timer) }
  }, [searchQuery, allPlacesForSearch])

  // --- sync filters from URL (не реагируем на page) ---
  useEffect(() => {
    if (!filterOptions) return

    const spNoPage = new URLSearchParams(searchParams)
    spNoPage.delete('page')
    const filtersQuery = spNoPage.toString()
    if (filtersQuery === lastFiltersQueryRef.current) return
    lastFiltersQueryRef.current = filtersQuery

    const filtersFromUrl = {}

    ;['directions', 'seasons', 'objectTypes', 'accessibility'].forEach((key) => {
      const values = searchParams.getAll(key).filter(Boolean)
      if (values.length > 0) filtersFromUrl[key] = values
    })

    if (Array.isArray(filterOptions?.extraGroups)) {
      filterOptions.extraGroups.forEach((g) => {
        if (!g.key) return
        const values = searchParams.getAll(g.key).filter(Boolean)
        if (values.length > 0) filtersFromUrl[g.key] = values
      })
    }

    if (Object.keys(filtersFromUrl).length === 0) return

    setFilters((prev) => {
      const merged = { ...prev, ...filtersFromUrl }
      return areFiltersEqual(prev, merged) ? prev : merged
    })
  }, [searchParams, filterOptions])

  // --- fetchPlaces ---
  const fetchPlaces = useCallback(async (page = 1) => {
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
        ...(filters.directions?.length > 0 && { directions: filters.directions }),
        ...(filters.seasons?.length > 0 && { seasons: filters.seasons }),
        ...(filters.objectTypes?.length > 0 && { objectTypes: filters.objectTypes }),
        ...(filters.accessibility?.length > 0 && { accessibility: filters.accessibility }),
      }

      for (const g of filterOptions?.extraGroups || []) {
        if (g.key && filters[g.key]?.length > 0) params[g.key] = filters[g.key]
      }

      const { data } = await publicPlacesAPI.getAll(params)

      let newItems = data.items || []
      let totalItems = data.pagination?.total ?? 0

      // если API ничего не вернул — fallback поиск по location
      if (effectiveSearchQuery && newItems.length === 0 && allPlacesForSearch.length > 0) {
        const lowerQuery = effectiveSearchQuery.toLowerCase().trim()
        const matches = allPlacesForSearch.filter((place) => (place.location || '').toLowerCase().includes(lowerQuery))

        if (matches.length > 0) {
          const startIndex = (page - 1) * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          newItems = matches.slice(startIndex, endIndex)
          totalItems = matches.length
        }
      }

      const pages = Math.max(1, Math.ceil((totalItems || 0) / ITEMS_PER_PAGE))

      setPlaces(newItems)
      setTotal(totalItems)
      setTotalPages(pages)

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    } catch (err) {
      console.error(err)
      setPlaces([])
      setTotal(0)
      setTotalPages(1)

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, allPlacesForSearch])

  // --- reset page=1 when criteria changes (но не на первом запуске) ---
  useEffect(() => {
    if (!filterOptions) return

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
  }, [filters, searchQuery, searchFallback, sortBy, filterOptions, setSearchParams])

  // --- fetch when page changes ---
  useEffect(() => {
    fetchPlaces(currentPage)
  }, [currentPage, fetchPlaces])

  // --- overlay hide ---
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

  // --- pagination navigation ---
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
  }, [currentPage, setSearchParams, scrollToAfterHeroInstant, waitForScrollToSettle])

  const handlePrevPage = () => { if (currentPage > 1) goToPage(currentPage - 1) }
  const handleNextPage = () => { if (currentPage < totalPages) goToPage(currentPage + 1) }
  const handlePageClick = (page) => goToPage(page)

  // --- MODAL LOGIC ---
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
      setTimeout(() => { isOpeningRef.current = false }, 100)
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
    navigate('/places', { replace: true })
    setTimeout(() => setSelectedPlace(null), 300)
  }

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

  // Проверяем URL при изменении location
  useEffect(() => {
    if (isClosingRef.current) {
      isClosingRef.current = false
      return
    }
    if (isOpeningRef.current) return

    const path = location.pathname
    const pathParts = path.split('/').filter(Boolean)
    const placeSlug = pathParts[pathParts.length - 1]

    if (placeSlug && placeSlug !== 'places' && !isModalOpen) {
      const place = places.find((p) => p.slug === placeSlug || String(p.id) === placeSlug)

      if (place) {
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
            navigate('/places', { replace: true })
          })
      }
    } else if (path === '/places' && isModalOpen && !modalLoading && !isClosingRef.current && !isOpeningRef.current) {
      setIsModalOpen(false)
      setSelectedPlace(null)
    }
  }, [location.pathname, isModalOpen, places, modalLoading, navigate])

  // Управление скроллом при модалке
  useEffect(() => {
    if (isModalOpen) {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop
      scrollPositionRef.current = currentScroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${currentScroll}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = scrollPositionRef.current
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' })
      }, 0)
    }

    return () => {
      if (!isModalOpen) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
      }
    }
  }, [isModalOpen])

  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // Загрузка данных страницы
  useEffect(() => {
    let cancelled = false
    publicPagesAPI.get('places')
      .then(({ data }) => {
        if (cancelled) return
        if (data?.content?.hero) {
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
          <div className={styles.desktopFilter}>
            <FilterBlock
              filterGroups={placeFilterGroups}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Введите запрос"
              suggestionsData={allPlacesForSearch || []}
              getSuggestionTitle={(item) => item.title || item.name}
              maxSuggestions={5}
            />
          </div>

          {/* Mobile filter */}
          <div className={styles.mobileFilter}>
            <FilterBlockMobile
              filterGroups={placeFilterGroups}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Введите запрос"
              suggestionsData={allPlacesForSearch || []}
              getSuggestionTitle={(item) => item.title || item.name}
              maxSuggestions={5}
            />
          </div>

          <div className={styles.places}>
            <div className={styles.placesSort}>
              <div className={styles.placesSortFind}>
                {loading
                  ? 'Загрузка...'
                  : `Найдено ${total} ${total === 1 ? 'место' : total >= 2 && total <= 4 ? 'места' : 'мест'}`}
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
                      '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F1F3F8', borderRadius: '15px' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#156A60' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#156A60', borderWidth: '1px' },
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
                </>
              )}
            </div>

            {!loading && places.length !== 0 && totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
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
                        >
                          {page}
                        </button>
                      )
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className={styles.paginationDots}>...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
        </section>
      </CenterBlock>

      <PlaceModal
        isOpen={isModalOpen}
        place={selectedPlace}
        onClose={closeModal}
        onOpenPlace={handleOpenPlaceById}
        isLoading={modalLoading}
      />
    </main>
  )
}
