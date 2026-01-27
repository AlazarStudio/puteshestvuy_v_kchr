'use client'

import { useState, useEffect } from 'react'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './News_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import NewsBlock from '@/components/NewsBlock/NewsBlock'

const SCROLL_KEY = 'news_scroll_position'

// Моковые данные новостей
const newsData = [
  {
    id: 1,
    title: 'Горный поход: с гидом или самостоятельно?',
    date: '15.01.2026',
    tag: 'новости',
    description: 'Если в путешествии вам хочется совместить приятное с полезным, походы в горы — точно для вас. Даже небольшая прогулка по свежему воздуху подарит вам заряд бодрости и хорошо скажется на организме...',
    image: '/new1.png'
  },
  {
    id: 2,
    title: 'Советы от местных: Хычины - вкусный символ Карачаево-Черкесии',
    date: '12.01.2026',
    tag: 'новости',
    description: 'Хычины — это традиционные лепёшки с разнообразными начинками, которые готовят в Карачаево-Черкесии. Узнайте, где попробовать самые вкусные хычины и как их готовят местные жители...',
    image: '/new2.png'
  },
  {
    id: 3,
    title: 'Вкусный Домбай: сувениры, которые продлят впечатление от отдыха',
    date: '10.01.2026',
    tag: 'новости',
    description: 'Домбай славится не только горнолыжными трассами, но и вкуснейшими местными продуктами. Какие сувениры привезти из Домбая, чтобы продлить воспоминания об отдыхе...',
    image: '/new1.png'
  },
  {
    id: 4,
    title: 'Открытие нового маршрута к водопадам Софийской долины',
    date: '08.01.2026',
    tag: 'маршруты',
    description: 'В этом году открылся новый пешеходный маршрут, который позволяет добраться до живописных водопадов Софийской долины безопасным и комфортным путём...',
    image: '/new2.png'
  },
  {
    id: 5,
    title: 'Зимние развлечения в Архызе: что нового в этом сезоне',
    date: '05.01.2026',
    tag: 'новости',
    description: 'Горнолыжный курорт Архыз подготовил множество новинок для туристов в этом зимнем сезоне. Новые трассы, обновлённая инфраструктура и интересные мероприятия...',
    image: '/new1.png'
  },
  {
    id: 6,
    title: 'Как подготовиться к походу в горы: советы для начинающих',
    date: '02.01.2026',
    tag: 'гайды',
    description: 'Планируете свой первый поход в горы Карачаево-Черкесии? Мы подготовили подробное руководство о том, что взять с собой, как одеться и на что обратить внимание...',
    image: '/new2.png'
  }
]

export default function News_page() {
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')

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

  // Фильтрация и сортировка новостей
  const filteredNews = newsData
    .filter(news => 
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.date.split('.').reverse().join('')
      const dateB = b.date.split('.').reverse().join('')
      return sortBy === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB)
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
                placeholder="Поиск новостей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.sortBlock}>
              <div className={styles.newsCount}>
                Найдено {filteredNews.length} {filteredNews.length === 1 ? 'новость' : filteredNews.length < 5 ? 'новости' : 'новостей'}
              </div>
              <div className={styles.sortWrapper}>
                <div className={styles.sortLabel}>Сортировать:</div>
                <FormControl className={styles.selectWrapper}>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Сортировка новостей' }}
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
          
          <div className={styles.newsList}>
            {filteredNews.map(news => (
              <NewsBlock
                key={news.id}
                title={news.title}
                date={news.date}
                tag={news.tag}
                description={news.description}
                image={news.image}
              />
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className={styles.noResults}>
              По вашему запросу ничего не найдено
            </div>
          )}
        </section>
      </CenterBlock>
    </main>
  )
}
