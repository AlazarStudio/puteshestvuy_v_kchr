'use client'

import { useState, useEffect } from 'react'
import { Select, MenuItem, FormControl } from '@mui/material'
import styles from './Routes_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import { publicRoutesAPI, getImageUrl } from '@/lib/api'

const SCROLL_KEY = 'routes_scroll_position'

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

const FIXED_GROUP_LABELS = {
  seasons: 'Сезон',
  transport: 'Способ передвижения',
  durationOptions: 'Время прохождения',
  difficultyLevels: 'Сложность',
  distanceOptions: 'Расстояние',
  elevationOptions: 'Перепад высот',
  isFamilyOptions: 'Семейный маршрут',
  hasOvernightOptions: 'С ночевкой',
}

const defaultFilters = Object.fromEntries(
  FIXED_GROUP_KEYS.map((k) => [k, []])
)

export default function Routes_page() {
  const [sortBy, setSortBy] = useState('popularity')
  const [searchQuery, setSearchQuery] = useState('')
  const [routes, setRoutes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(defaultFilters)
  const [filterOptions, setFilterOptions] = useState(null)

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  const handleFiltersChange = (next) => {
    setFilters(next)
  }

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
  const routeFilterGroups = [
    ...FIXED_GROUP_KEYS.map((key) => {
      const meta = filterOptions?.fixedGroupMeta?.[key]
      const label = (meta?.label && meta.label.trim()) || FIXED_GROUP_LABELS[key] || key
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
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Ошибка загрузки опций фильтров маршрутов:', err)
      })
    return () => { cancelled = true }
  }, [])

  // Загрузка маршрутов с API (с учётом фильтров и поиска)
  useEffect(() => {
    let cancelled = false
    async function fetchRoutes() {
      setLoading(true)
      try {
        const params = {
          limit: 100,
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          ...(sortBy === 'difficulty' && { sortBy: 'difficulty' }),
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
        if (!cancelled) {
          setRoutes(data.items || [])
          setTotal(data.pagination?.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setRoutes([])
          setTotal(0)
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRoutes()
    return () => { cancelled = true }
  }, [filters, searchQuery, sortBy])

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

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img={'/full_roates_bg.jpg'}
        title={'МАРШРУТЫ'}
        desc={'Наши маршруты созданы для самостоятельного прохождения. Вы можете создать свой собственный маршрут в конструкторе во вкладке "Интересные места"'}
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
                routes.map((route) => (
                  <RouteBlock key={route.id} route={route} />
                ))
              )}
            </div>
          </div>
        </section>
      </CenterBlock>
    </main>
  )
}
