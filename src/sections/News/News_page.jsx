'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './News_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import NewsBlock from '@/components/NewsBlock/NewsBlock'
import { publicNewsAPI, getImageUrl } from '@/lib/api'

const SCROLL_KEY = 'news_scroll_position'

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
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await publicNewsAPI.getAll({
        page: 1,
        limit: 100,
        search: searchQuery.trim() || undefined,
        type: typeFilter,
      })
      const items = data?.items || []
      setNews(items)
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err)
      setError('Не удалось загрузить новости')
      setNews([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, typeFilter])

  useEffect(() => {
    const t = setTimeout(fetchNews, searchQuery ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchNews, searchQuery])

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

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img={'/newBG.png'}
        title={'НОВОСТИ'}
        desc={'Актуальные новости о туризме, событиях и интересных местах Карачаево-Черкесии'}
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
