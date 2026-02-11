'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './News_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import NewsBlock from '@/components/NewsBlock/NewsBlock'
import { publicNewsAPI, publicPagesAPI, getImageUrl } from '@/lib/api'

const SCROLL_KEY = 'news_scroll_position'
const ITEMS_PER_PAGE = 6

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
  const [searchParams] = useSearchParams()
  const typeFilter = searchParams.get('type') || 'news' // 'news' | 'article'
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(null)
  const observerTarget = useRef(null)
  const [pageContent, setPageContent] = useState({
    hero: {
      title: 'НОВОСТИ',
      description: 'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии',
      image: '/newBG.png',
    },
  })

  const fetchNews = useCallback(async (page = 1, reset = false) => {
    const startTime = Date.now()
    const MIN_LOADING_TIME = 500 // минимум 500ms
    
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      const { data } = await publicNewsAPI.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchQuery.trim() || undefined,
        type: typeFilter,
      })
      const items = data?.items || []
      const totalItems = data?.pagination?.total ?? 0
      
      if (reset) {
        setNews(items)
        setHasMore(items.length === ITEMS_PER_PAGE && items.length < totalItems)
      } else {
        setNews(prev => {
          const updated = [...prev, ...items]
          setHasMore(updated.length < totalItems)
          return updated
        })
      }
      
      // Гарантируем минимальное время отображения лоадера
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err)
      setError('Не удалось загрузить новости')
      if (reset) {
        setNews([])
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
  }, [searchQuery, typeFilter])

  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    const t = setTimeout(() => fetchNews(1, true), searchQuery ? 400 : 0)
    return () => clearTimeout(t)
  }, [searchQuery, typeFilter, fetchNews])

  // Intersection Observer для lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1
          setCurrentPage(nextPage)
          fetchNews(nextPage, false)
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
  }, [hasMore, loading, loadingMore, currentPage, fetchNews])

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

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
    publicPagesAPI.get('news')
      .then(({ data }) => {
        if (!cancelled && data?.content?.hero) {
          setPageContent({
            hero: {
              title: data.content.hero.title || 'НОВОСТИ',
              description: data.content.hero.description || 'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии',
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
              description: 'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии',
              image: '/newBG.png',
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
        <section className={styles.newsSection}>
          <div className={styles.newsHeader}>
            <div className={styles.searchBlock}>
              <div className={styles.searchIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 19L14.65 14.65" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                {loading ? 'Загрузка...' : `Найдено ${sortedNews.length} ${sortedNews.length === 1 ? 'запись' : sortedNews.length < 5 ? 'записи' : 'записей'}`}
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
          
          {error && (
            <div className={styles.noResults}>
              {error}
            </div>
          )}

          <div className={styles.newsList}>
            {sortedNews.map(item => (
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
            {hasMore && <div ref={observerTarget} style={{ height: '20px', marginTop: '20px' }} />}
            {loadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.spinner} />
                <p>Загрузка...</p>
              </div>
            )}
          </div>

          {!loading && !error && sortedNews.length === 0 && (
            <div className={styles.noResults}>
              По вашему запросу ничего не найдено
            </div>
          )}
        </section>
      </CenterBlock>
    </main>
  )
}
