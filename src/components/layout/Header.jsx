'use client'

import { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'
import { publicNewsAPI, getImageUrl } from '@/lib/api'
import GlobalSearch from '@/components/GlobalSearch/GlobalSearch'
import { useRouteConstructor } from '@/contexts/RouteConstructorContext'

// Данные для выпадающего меню "На помощь туристу"
const dropdownMenuData = {
  articles: {
    title: 'Статьи',
    viewAllHref: '/services?filter=articles',
  },
  services: {
    title: 'Сервис',
    columns: [
      [
        { title: 'Гиды', href: '/services?filter=guides' },
        { title: 'Активности', href: '/services?filter=activities' },
        { title: 'Прокат оборудования', href: '/services?filter=equipment-rental' },
        { title: 'Пункты придорожного сервиса', href: '/services?filter=roadside-service' },
        { title: 'Торговые точки', href: '/services?filter=shops' },
        { title: 'Сувениры', href: '/services?filter=souvenirs' },
      ],
      [
        { title: 'Гостиницы', href: '/services?filter=hotels' },
        { title: 'Кафе и рестораны', href: '/services?filter=restaurants' },
        { title: 'Трансфер', href: '/services?filter=transfer' },
        { title: 'АЗС', href: '/services?filter=gas-stations' },
        { title: 'Санитарные узлы', href: '/services?filter=restrooms' },
        { title: 'Музеи', href: '/services?filter=museums' },
      ],
    ],
    viewAllHref: '/services',
  },
  emergency: {
    title: 'Экстренные службы',
    items: [
      { title: 'Пункты медпомощи', href: '/services?filter=medical' },
      { title: 'МВД', href: '/services?filter=police' },
      { title: 'Пожарная охрана', href: '/services?filter=fire-department' },
    ],
  },
}

// Конфигурация для каждой страницы
const pageConfig = [
  {
    path: '/',
    initialColor: 'white',
    scrollThreshold: 100, // пикселей
    enableScrollChange: true,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
  },
  {
    path: '/routes',
    initialColor: 'white',
    scrollThreshold: 100,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/routes/*', // Динамические маршруты
    initialColor: 'black',
    scrollThreshold: 1, // Фон появится при скролле больше этого значения
    enableScrollChange: false,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/region',
    initialColor: 'white',
    scrollThreshold: 300,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/places',
    initialColor: 'white',
    scrollThreshold: 200,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/news',
    initialColor: 'white',
    scrollThreshold: 200,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/merch',
    initialColor: 'white',
    scrollThreshold: 200,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/services',
    initialColor: 'white',
    scrollThreshold: 200,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/services/*',
    initialColor: 'black',
    scrollThreshold: 1,
    enableScrollChange: false,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/login',
    initialColor: 'black',
    scrollThreshold: 1,
    enableScrollChange: false,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/register',
    initialColor: 'black',
    scrollThreshold: 1,
    enableScrollChange: false,
    backgroundColor: '#f1f3f8b7',
  },
  {
    path: '/profile',
    initialColor: 'black',
    scrollThreshold: 1,
    enableScrollChange: false,
    backgroundColor: '#f1f3f8b7',
  },
]

// Функция для поиска конфигурации страницы
const getPageConfig = (pathname) => {
  if (!pathname) return null

  // Сначала ищем точное совпадение
  let config = pageConfig.find(item => item.path === pathname)

  // Если не найдено, ищем паттерны с *
  if (!config) {
    config = pageConfig.find(item => {
      if (item.path.includes('*')) {
        const pattern = item.path.replace('*', '')
        return pathname.startsWith(pattern)
      }
      return false
    })
  }

  // Если ничего не найдено, возвращаем дефолтную конфигурацию
  return config || {
    path: pathname,
    initialColor: 'white',
    scrollThreshold: 200,
    enableScrollChange: true,
    backgroundColor: '#f1f3f8b7',
  }
}

export default function Header() {
  const { pathname } = useLocation()
  const { placeIds } = useRouteConstructor()
  const [isNotFound, setIsNotFound] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasBlur, setHasBlur] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeArticleIndex, setActiveArticleIndex] = useState(0)
  const [isArticleHovered, setIsArticleHovered] = useState(false)
  const [dropdownArticles, setDropdownArticles] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const dropdownRef = useRef(null)
  const dropdownTriggerRef = useRef(null)

  // Загрузка статей для блока "На помощь туристу"
  useEffect(() => {
    let cancelled = false
    publicNewsAPI.getAll({ type: 'article', limit: 6 })
      .then((res) => {
        if (!cancelled) {
          const items = (res.data?.items || []).map((a) => ({
            title: a.title,
            href: `/news/${a.slug || a.id}`,
            image: getImageUrl(a.image) || '/new1.png',
          }))
          setDropdownArticles(items)
        }
      })
      .catch(() => { if (!cancelled) setDropdownArticles([]) })
    return () => { cancelled = true }
  }, [])

  const articlesItems = dropdownArticles.length > 0 ? dropdownArticles : []

  // Автоматическая смена активной статьи
  useEffect(() => {
    if (!isDropdownOpen || isArticleHovered || articlesItems.length === 0) return

    const interval = setInterval(() => {
      setActiveArticleIndex((prev) => (prev + 1) % articlesItems.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isDropdownOpen, isArticleHovered, articlesItems.length])
  
  // Получаем конфигурацию для текущей страницы
  const currentConfig = getPageConfig(pathname)

  useEffect(() => {
    // Проверяем, есть ли класс not-found-page на body
    const checkNotFound = () => {
      if (typeof document !== 'undefined' && document.body) {
        setIsNotFound(document.body.classList.contains('not-found-page'))
      }
    }

    // Проверяем сразу и после загрузки
    checkNotFound()

    // Слушаем изменения DOM только если document доступен
    if (typeof document !== 'undefined' && document.body) {
      const observer = new MutationObserver(checkNotFound)
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      })

      return () => observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!currentConfig) return

    // Отслеживаем скролл для изменения стилей header
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset

      // Для страниц с черным header без изменения при скролле
      // Blur и фон появляются при скролле больше scrollThreshold
      if (currentConfig.initialColor === 'black' && !currentConfig.enableScrollChange) {
        const shouldShowBackground = scrollPosition > currentConfig.scrollThreshold
        setHasBlur(shouldShowBackground)
        setIsScrolled(shouldShowBackground)
      } else {
        // Blur появляется сразу при любом скролле
        setHasBlur(scrollPosition > 0)

        // Проверяем, нужно ли менять цвет при скролле
        if (currentConfig.enableScrollChange) {
          // Темные цвета появляются при прокрутке больше порога
          setIsScrolled(scrollPosition > currentConfig.scrollThreshold)
        } else {
          // Если изменение при скролле отключено, используем начальный цвет
          setIsScrolled(false)
        }
      }
    }

    // Проверяем начальную позицию
    handleScroll()

    // Добавляем слушатель скролла
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [currentConfig])

  // Определяем, должен ли header быть темным
  const isDarkMode = (() => {
    if (isNotFound) return true
    
    if (!currentConfig) return false

    // Если начальный цвет черный, header всегда темный
    if (currentConfig.initialColor === 'black') {
      return true
    }

    // Если начальный цвет белый и включено изменение при скролле
    if (currentConfig.initialColor === 'white' && currentConfig.enableScrollChange) {
      return isScrolled
    }

    return false
  })()

  // Определяем, нужен ли фон для header
  // Для страниц с черным header без изменения при скролле фон появляется при скролле больше scrollThreshold
  // Для остальных страниц фон появляется когда isDarkMode = true
  const needsBackground = (() => {
    if (!currentConfig) return false
    
    if (currentConfig.initialColor === 'black' && !currentConfig.enableScrollChange) {
      // Для черных страниц без изменения при скролле фон появляется при скролле
      return isScrolled
    }
    
    // Для остальных страниц фон появляется когда header темный
    return isDarkMode
  })()

  // Получаем цвет фона из конфигурации или используем дефолтный
  const backgroundColor = currentConfig?.backgroundColor || '#f1f3f8b7'

  // Определяем, нужен ли белый фон при открытом dropdown
  const isDropdownActive = isDropdownOpen

  return (
    <header 
      className={`${styles.header} ${hasBlur && needsBackground && !isDropdownActive ? styles.headerBlurred : ''} ${isDarkMode && needsBackground && !isDropdownActive ? styles.headerDark : ''} ${isDarkMode && !needsBackground && !isDropdownActive ? styles.headerDarkNoBg : ''} ${isDropdownActive ? styles.headerDropdownActive : ''}`} 
      style={needsBackground && !isDropdownActive ? { backgroundColor } : {}}
      role="banner"
    >
      <div className={styles.container}>
        <div className={styles.containerBotLine} aria-hidden="true"></div>

        {/* Логотип слева */}
        <Link
          to="/"
          className={styles.logo}
          aria-label="Карачаево-Черкесия - Главная страница"
        >
          {(isDarkMode || isDropdownActive) ? (
            <img src="/color_logo.png" alt="Логотип Карачаево-Черкесии" width={232} height={50} />
          ) : (
            <img src="/white_logo.png" alt="Логотип Карачаево-Черкесии" width={232} height={50} />
          )}
        </Link>

        {/* Навигационное меню по центру */}
        <nav className={styles.nav} role="navigation" aria-label="Основная навигация">
          <Link
            to="/region"
            className={`${styles.navLink} ${pathname === '/region' ? styles.navLink_active : ''}`}
            title="Информация о регионе Карачаево-Черкесия"
          >
            О регионе
          </Link>
          <Link
            to="/routes"
            className={`${styles.navLink} ${pathname === '/routes' || (pathname?.startsWith('/routes/') && pathname !== '/routes') ? styles.navLink_active : ''}`}
            title="Туристические маршруты"
          >
            Маршруты
          </Link>
          <Link
            to="/places"
            className={`${styles.navLink} ${pathname === '/places' || pathname?.startsWith('/places/') ? styles.navLink_active : ''}`}
            title="Интересные места для посещения"
          >
            Интересные места
          </Link>
          <Link
            to="/news"
            className={`${styles.navLink} ${pathname === '/news' || pathname?.startsWith('/news/') ? styles.navLink_active : ''}`}
            title="Новости"
          >
            Новости
          </Link>
          {/* <Link
            href="/merch"
            className={`${styles.navLink} ${pathname === '/merch' ? styles.navLink_active : ''}`}
            title="Мерч поддержки туризма"
          >
            Мерч
          </Link> */}
          <div 
            className={styles.navDropdown}
            ref={dropdownTriggerRef}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <Link
              to="/services"
              className={`${styles.navLink} ${pathname === '/services' || pathname?.startsWith('/services/') ? styles.navLink_active : ''}`}
              title="Услуги и сервисы для туристов"
            >
              На помощь туристу
            </Link>
            <svg
              className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.dropdownIconRotated : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Выпадающее меню */}
            <div 
              ref={dropdownRef}
              className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.dropdownMenuOpen : ''}`}
            >
              <div className={styles.dropdownContent}>
                {/* Изображение-превью слева */}
                <div className={styles.dropdownImageWrapper}>
                  <img
                    src={articlesItems[activeArticleIndex]?.image || '/new1.png'}
                    alt="Превью статьи"
                    width={200}
                    height={200}
                    className={styles.dropdownImage}
                  />
                </div>

                {/* Статьи */}
                <div className={`${styles.dropdownSection} ${styles.dropdownSectionBorder} ${styles.dropdownSectionArticles}`}>
                  <h3 className={styles.dropdownSectionTitle}>{dropdownMenuData.articles.title}</h3>
                  <ul className={styles.dropdownList}>
                    {articlesItems.map((item, index) => (
                      <li key={index}>
                        <Link 
                          to={item.href} 
                          className={`${styles.dropdownLink} ${activeArticleIndex === index ? styles.dropdownLinkActive : ''}`}
                          onMouseEnter={() => {
                            setIsArticleHovered(true)
                            setActiveArticleIndex(index)
                          }}
                          onMouseLeave={() => setIsArticleHovered(false)}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link to={dropdownMenuData.articles.viewAllHref} className={styles.dropdownViewAll}>
                    Смотреть все
                  </Link>
                </div>

                {/* Сервис */}
                <div className={`${styles.dropdownSection} ${styles.dropdownSectionBorder} ${styles.dropdownSectionServices}`}>
                  <h3 className={styles.dropdownSectionTitle}>{dropdownMenuData.services.title}</h3>
                  <div className={styles.dropdownColumns}>
                    {dropdownMenuData.services.columns.map((column, colIndex) => (
                      <ul key={colIndex} className={styles.dropdownList}>
                        {column.map((item, index) => (
                          <li key={index}>
                            <Link to={item.href} className={styles.dropdownLink}>
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                  <Link to={dropdownMenuData.services.viewAllHref} className={styles.dropdownViewAll}>
                    Смотреть все
                  </Link>
                </div>

                {/* Экстренные службы */}
                <div className={styles.dropdownSection}>
                  <h3 className={styles.dropdownSectionTitle}>{dropdownMenuData.emergency.title}</h3>
                  <ul className={styles.dropdownList}>
                    {dropdownMenuData.emergency.items.map((item, index) => (
                      <li key={index}>
                        <Link to={item.href} className={styles.dropdownLink}>
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Иконки справа */}
        <div className={styles.icons} aria-label="Дополнительные действия">
          <Link
            to="/profile?tab=routes-constructor"
            className={styles.iconButton}
            aria-label="Конструктор маршрутов"
            title="Конструктор маршрутов"
          >
            <img src="/konst_tours.png" alt="Конструктор маршрутов" width={20} height={21} />
            {placeIds.length > 0 && (
              <span className={styles.iconBadge}>{placeIds.length}</span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={styles.iconButton}
            aria-label="Поиск"
            title="Поиск по сайту"
          >
            <img src="/search.png" alt="Поиск" width={17} height={17} />
          </button>
          
          <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

          {/* <Link
            href="/accessibility"
            className={styles.iconButton}
            aria-label="Версия для слабовидящих"
            title="Включить версию для слабовидящих"
          >
            <Image
              src="/vision.png"
              alt="Версия для слабовидящих"
              width={22}
              height={15}
            />
          </Link> */}

          <Link
            to="/profile"
            className={styles.iconButton}
            aria-label="Личный кабинет"
            title="Войти в личный кабинет"
          >
            <img src="/profile.png" alt="Личный кабинет" width={16} height={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
