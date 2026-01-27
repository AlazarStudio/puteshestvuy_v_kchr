'use client'

import { useState, useEffect } from 'react'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Routes_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import RouteBlock from '@/components/RouteBlock/RouteBlock'

const SCROLL_KEY = 'routes_scroll_position'

export default function Routes_page() {
  const [sortBy, setSortBy] = useState('popularity')

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  // Восстанавливаем позицию скролла при возврате на страницу
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      // Используем setTimeout для гарантии восстановления после рендера
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScroll, 10),
          behavior: 'instant'
        })
      }, 0)
      // Очищаем сохранённую позицию
      sessionStorage.removeItem(SCROLL_KEY)
    }
  }, [])

  // Сохраняем позицию скролла перед уходом со страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
    }

    // Сохраняем скролл при клике на ссылку маршрута
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

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img={'/full_roates_bg.jpg'}
        title={'МАРШРУТЫ'}
        desc={'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"'}
      />

      <CenterBlock>
        <section className={styles.flexBlock}>
          <FilterBlock />
          <div className={styles.routes}>
            <div className={styles.routesSort}>
              <div className={styles.routesSortFind}>
                Найдено 46 маршрутов
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
              <RouteBlock title="На границе регионов: Кисловодск - Медовые водопады" />
              <RouteBlock title="Горные вершины Карачаево-Черкесии" />
              <RouteBlock title="Водопады и озера региона" />
            </div>
          </div>
        </section>
      </CenterBlock>
    </main >
  )
}
