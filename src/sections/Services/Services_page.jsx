import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, MenuItem, FormControl } from '@mui/material'
import { Link } from 'react-router-dom'
import styles from './Services_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import { publicServicesAPI, getImageUrl } from '@/lib/api'
import { CATEGORY_TO_TEMPLATE_KEY, DEFAULT_TEMPLATE_KEY } from './ServiceDetail/serviceTypeTemplates'

const SCROLL_KEY = 'services_scroll_position'

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
]

const EMERGENCY_FILTER_OPTIONS = [
  'Пункты медпомощи',
  'МВД',
  'Пожарная охрана',
]

const URL_FILTER_TO_LABEL = {
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
}

const filterGroups = [
  { key: 'articles', label: 'Статьи', options: ['Статьи'] },
  { key: 'service', label: 'Сервис', options: SERVICE_FILTER_OPTIONS },
  { key: 'emergency', label: 'Экстренные службы', options: EMERGENCY_FILTER_OPTIONS },
]

export default function Services_page() {
  const [searchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState('popularity')
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => {
    const filterFromUrl = searchParams.get('filter')
    const label = filterFromUrl ? URL_FILTER_TO_LABEL[filterFromUrl] : null
    if (!label) return {}
    if (EMERGENCY_FILTER_OPTIONS.includes(label)) {
      return { emergency: [label] }
    }
    return { service: [label] }
  })
  const [searchQuery, setSearchQuery] = useState('')

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  const buildCategoryParams = () => {
    const serviceSelected = (filters.service || []).map((v) => FILTER_TO_CATEGORY[v] || v)
    const emergencySelected = (filters.emergency || []).map((v) => FILTER_TO_CATEGORY[v] || v)
    return [...serviceSelected, ...emergencySelected]
  }

  useEffect(() => {
    let cancelled = false

    async function fetchServices() {
      setLoading(true)
      try {
        const categories = buildCategoryParams()
        const params = {
          limit: 100,
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          ...(categories.length > 0 && { category: categories }),
        }
        const { data } = await publicServicesAPI.getAll(params)
        if (!cancelled) {
          let items = data.items || []
          if (sortBy === 'rating') {
            items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          } else if (sortBy === 'reviews') {
            items = [...items].sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
          }
          setServices(items)
          setTotal(data.pagination?.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setServices([])
          setTotal(0)
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchServices()
    return () => {
      cancelled = true
    }
  }, [filters.service, filters.emergency, searchQuery, sortBy])

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

  const showArticlesLink = (filters.articles || []).includes('Статьи')

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img="/full_roates_bg.jpg"
        title="УСЛУГИ И СЕРВИСЫ"
        desc="Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии"
      />

      <CenterBlock>
        <section className={styles.flexBlock}>
          <FilterBlock
            filterGroups={filterGroups}
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Поиск по услугам..."
          />
          <div className={styles.services}>
            <div className={styles.servicesSort}>
              <div className={styles.servicesSortFind}>
                Найдено {total} услуг
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

            {showArticlesLink && (
              <Link to="/news" className={styles.articlesLink}>
                Читать статьи в разделе «Новости»
              </Link>
            )}

            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Загрузка...</p>
              </div>
            ) : services.length === 0 ? (
              <div className={styles.emptyState}>
                <p>По выбранным фильтрам услуг не найдено.</p>
              </div>
            ) : (
              <div className={styles.servicesGrid}>
                {services.map((service) => {
                  const templateKey = CATEGORY_TO_TEMPLATE_KEY[service.category] || DEFAULT_TEMPLATE_KEY
                  return (
                  <Link
                    key={service.id}
                    to={`/services/template/${templateKey}`}
                    className={styles.serviceCard}
                  >
                    <div className={styles.serviceCardImg}>
                      <img src={getImageUrl(service.image || service.images?.[0])} alt={service.title} />
                    </div>
                    <div className={styles.serviceCardTopLine}>
                      {service.isVerified && (
                        <div className={styles.serviceCardVerification}>
                          <img src="/verification.png" alt="Верифицирован" />
                        </div>
                      )}
                      <div className={styles.serviceCardLike}>
                        <img src="/like.png" alt="В избранное" />
                      </div>
                    </div>
                    <div className={styles.serviceCardInfo}>
                      <div className={styles.serviceCardCategory}>{service.category || 'Услуга'}</div>
                      <div className={styles.serviceCardRating}>
                        <div className={styles.serviceCardStars}>
                          <img src="/star.png" alt="" />
                          {service.rating ?? '—'}
                        </div>
                        <div className={styles.serviceCardFeedback}>
                          {service.reviewsCount ?? 0} отзывов
                        </div>
                      </div>
                      <div className={styles.serviceCardName}>{service.title}</div>
                    </div>
                  </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </CenterBlock>
    </main>
  )
}
