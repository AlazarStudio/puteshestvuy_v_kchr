'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './News_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import NewsBlock from '@/components/NewsBlock/NewsBlock'
import { publicNewsAPI, publicPagesAPI, getImageUrl } from '@/lib/api'

const SCROLL_KEY = 'news_scroll_position'
const ITEMS_PER_PAGE = 10

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export default function News_page() {
  const [searchParams, setSearchParams] = useSearchParams()

  // type — из URL, как было
  const typeFilter = searchParams.get('type') || 'news' // 'news' | 'article'

  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const heroRef = useRef(null)

  const [pageOverlayLoading, setPageOverlayLoading] = useState(false)
  const navTokenRef = useRef(0)
  const navStartedAtRef = useRef(0)
  const pendingNavPageRef = useRef(null)

  const lastCriteriaRef = useRef('')
  const didInitCriteriaRef = useRef(false)

  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'НОВОСТИ',
      description: 'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии',
      image: '/newBG.png',
    },
  })

  // currentPage — ТОЛЬКО из URL (сохраняется при refresh)
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return Number.isFinite(p) && p >= 1 ? p : 1
  }, [searchParams])

  const fetchNews = useCallback(
    async (page = 1) => {
      const startTime = Date.now()
      const MIN_LOADING_TIME = 500

      try {
        setLoading(true)
        setError(null)

        const { data } = await publicNewsAPI.getAll({
          page,
          limit: ITEMS_PER_PAGE,
          search: searchQuery.trim() || undefined,
          type: typeFilter,
        })

        const items = data?.items || []
        const totalItems = data?.pagination?.total ?? 0
        const pages =
          data?.pagination?.pages ?? Math.max(1, Math.ceil((totalItems || 0) / ITEMS_PER_PAGE))

        setNews(items)
        setTotal(totalItems)
        setTotalPages(pages)

        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
        await new Promise((resolve) => setTimeout(resolve, remainingTime))
      } catch (err) {
        console.error('Ошибка загрузки новостей:', err)
        setError('Не удалось загрузить новости')
        setNews([])
        setTotal(0)
        setTotalPages(1)

        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
        await new Promise((resolve) => setTimeout(resolve, remainingTime))
      } finally {
        setLoading(false)
      }
    },
    [searchQuery, typeFilter]
  )

  // Сброс page=1 при изменении критериев (поиск / type), но не на первом запуске (чтобы refresh не ломался)
  useEffect(() => {
    const criteria = JSON.stringify({
      searchQuery,
      typeFilter,
    })

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
  }, [searchQuery, typeFilter, setSearchParams])

  // загрузка при смене page или критериев
  useEffect(() => {
    // debounce поиска как у тебя было (400ms)
    const t = setTimeout(() => fetchNews(currentPage), searchQuery ? 400 : 0)
    return () => clearTimeout(t)
  }, [currentPage, searchQuery, fetchNews])

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

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
    const headerOffset = 0 // если есть фикс-хедер — поставь, например, 80
    window.scrollTo({ top: Math.max(0, heroBottom - headerOffset), behavior: 'auto' })

    root.style.scrollBehavior = prev
  }, [])

  const waitForScrollToSettle = useCallback(() => {
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
      if (nextPage === currentPage) return

      const token = ++navTokenRef.current
      pendingNavPageRef.current = nextPage
      navStartedAtRef.current = Date.now()

      setPageOverlayLoading(true)

      // 1) мгновенно скроллим
      scrollToAfterHeroInstant()

      // 2) ждём стабилизации
      await waitForScrollToSettle()
      if (token !== navTokenRef.current) return

      // 3) меняем URL
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(nextPage))
        return next
      }, { replace: true })
    },
    [currentPage, scrollToAfterHeroInstant, waitForScrollToSettle, setSearchParams]
  )

  // гасим overlay минимум через 500мс после старта клика,
  // и только когда загрузка завершилась
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
      const link = e.target.closest('a[href^="/news/"]')
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

  // Сортировка (поиск уже на бэке)
  const sortedNews = [...news].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB
  })

  // Загрузка данных страницы
  useEffect(() => {
    let cancelled = false
    publicPagesAPI
      .get('news')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'НОВОСТИ',
              description:
                data.content.hero.description ||
                'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии',
              image: data.content.hero.image || '/newBG.png',
            },
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPageContent({
            hero: {
              title: 'НОВОСТИ',
              description:
                'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии',
              image: '/newBG.png',
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
        <section className={styles.newsSection}>
          <div className={styles.newsHeader}>
            <div className={styles.searchBlock}>
              <div className={styles.searchIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                    stroke="#999"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 19L14.65 14.65"
                    stroke="#999"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Поиск новостей и статей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.sortBlock}>
              <div className={styles.newsCount}>
                {loading
                  ? 'Загрузка...'
                  : `Найдено ${total} ${
                      total === 1 ? 'запись' : total >= 2 && total <= 4 ? 'записи' : 'записей'
                    }`}
              </div>

              <div className={styles.sortWrapper}>
                <div className={styles.sortLabel}>Сортировать:</div>
                <FormControl className={styles.selectWrapper}>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Сортировка новостей и статей' }}
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
                      value="newest"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      Сначала новые
                    </MenuItem>
                    <MenuItem
                      value="oldest"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      Сначала старые
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          </div>

          {error && <div className={styles.noResults}>{error}</div>}

          <div className={styles.newsList}>
            {sortedNews.map((item) => (
              <NewsBlock
                key={item.id}
                title={item.title}
                date={formatDate(item.publishedAt)}
                tag={item.type === 'article' ? 'Статья' : 'Новость'}
                description={stripHtml(item.shortDescription) || ''}
                image={getImageUrl(item.image)}
                slug={item.slug}
              />
            ))}
          </div>

          {/* Пагинация */}
          {!loading && !error && totalPages > 1 && (
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
                        className={`${styles.paginationPage} ${
                          currentPage === page ? styles.paginationPageActive : ''
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

          {!loading && !error && total === 0 && (
            <div className={styles.noResults}>По вашему запросу ничего не найдено</div>
          )}
        </section>
      </CenterBlock>
    </main>
  )
}
