'use client'

import { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'
import GlobalSearch from '@/components/GlobalSearch/GlobalSearch'
import { useRouteConstructor } from '@/contexts/RouteConstructorContext'
import { publicNewsAPI, getImageUrl } from '@/lib/api'

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
  { path: '/', initialColor: 'white', scrollThreshold: 100, enableScrollChange: true, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  { path: '/routes', initialColor: 'white', scrollThreshold: 100, enableScrollChange: true, backgroundColor: '#f1f3f8b7' },
  { path: '/routes/*', initialColor: 'black', scrollThreshold: 1, enableScrollChange: false, backgroundColor: '#f1f3f8b7' },
  { path: '/region', initialColor: 'white', scrollThreshold: 300, enableScrollChange: true, backgroundColor: '#f1f3f8b7' },
  { path: '/places', initialColor: 'white', scrollThreshold: 200, enableScrollChange: true, backgroundColor: '#f1f3f8b7' },
  { path: '/news', initialColor: 'white', scrollThreshold: 200, enableScrollChange: true, backgroundColor: '#f1f3f8b7' },
  { path: '/merch', initialColor: 'white', scrollThreshold: 200, enableScrollChange: true, backgroundColor: '#f1f3f8b7' },
  { path: '/services', initialColor: 'white', scrollThreshold: 200, enableScrollChange: true, backgroundColor: '#f1f3f8b7' },
  { path: '/services/*', initialColor: 'black', scrollThreshold: 1, enableScrollChange: false, backgroundColor: '#f1f3f8b7' },
  { path: '/login', initialColor: 'black', scrollThreshold: 1, enableScrollChange: false, backgroundColor: '#f1f3f8b7' },
  { path: '/register', initialColor: 'black', scrollThreshold: 1, enableScrollChange: false, backgroundColor: '#f1f3f8b7' },
  { path: '/profile', initialColor: 'black', scrollThreshold: 1, enableScrollChange: false, backgroundColor: '#f1f3f8b7' },
]

const getPageConfig = (pathname) => {
  if (!pathname) return null

  let config = pageConfig.find((item) => item.path === pathname)

  if (!config) {
    config = pageConfig.find((item) => {
      if (item.path.includes('*')) {
        const pattern = item.path.replace('*', '')
        return pathname.startsWith(pattern)
      }
      return false
    })
  }

  return (
    config || {
      path: pathname,
      initialColor: 'white',
      scrollThreshold: 200,
      enableScrollChange: true,
      backgroundColor: '#f1f3f8b7',
    }
  )
}

export default function Header() {
  const { pathname } = useLocation()
  const { placeIds } = useRouteConstructor()

  const [isNotFound, setIsNotFound] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasBlur, setHasBlur] = useState(false)

  // dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeArticleIndex, setActiveArticleIndex] = useState(0)
  const [isArticleHovered, setIsArticleHovered] = useState(false)
  const [dropdownArticles, setDropdownArticles] = useState([])
  const dropdownRef = useRef(null)
  const dropdownTriggerRef = useRef(null)

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isBurgerOpen, setIsBurgerOpen] = useState(false)

  const currentConfig = getPageConfig(pathname)

  // not-found checker
  useEffect(() => {
    const checkNotFound = () => {
      if (typeof document !== 'undefined' && document.body) {
        setIsNotFound(document.body.classList.contains('not-found-page'))
      }
    }

    checkNotFound()

    if (typeof document !== 'undefined' && document.body) {
      const observer = new MutationObserver(checkNotFound)
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
      return () => observer.disconnect()
    }
  }, [])

  // Загрузка статей для dropdown
  useEffect(() => {
    let cancelled = false
    publicNewsAPI
      .getAll({ type: 'article', limit: 6 })
      .then((res) => {
        if (cancelled) return
        const items = (res.data?.items || []).map((a) => ({
          title: a.title,
          href: `/news/${a.slug || a.id}`,
          image: getImageUrl(a.image) || '/new1.png',
        }))
        setDropdownArticles(items)
      })
      .catch(() => {
        if (!cancelled) setDropdownArticles([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const articlesItems = dropdownArticles.length > 0 ? dropdownArticles : []

  // Автосмена активной статьи
  useEffect(() => {
    if (!isDropdownOpen || isArticleHovered || articlesItems.length === 0) return

    const interval = setInterval(() => {
      setActiveArticleIndex((prev) => (prev + 1) % articlesItems.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isDropdownOpen, isArticleHovered, articlesItems.length])

  // Закрывать dropdown при смене роута (чтобы не зависал)
  useEffect(() => {
    setIsDropdownOpen(false)
  }, [pathname])

  // scroll logic
  useEffect(() => {
    if (!currentConfig) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset

      if (currentConfig.initialColor === 'black' && !currentConfig.enableScrollChange) {
        const shouldShowBackground = scrollPosition > currentConfig.scrollThreshold
        setHasBlur(shouldShowBackground)
        setIsScrolled(shouldShowBackground)
      } else {
        setHasBlur(scrollPosition > 0)

        if (currentConfig.enableScrollChange) {
          setIsScrolled(scrollPosition > currentConfig.scrollThreshold)
        } else {
          setIsScrolled(false)
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentConfig])

  // isDarkMode
  const isDarkMode = (() => {
    if (isNotFound) return true
    if (!currentConfig) return false

    if (currentConfig.initialColor === 'black') return true
    if (currentConfig.initialColor === 'white' && currentConfig.enableScrollChange) return isScrolled

    return false
  })()

  // needsBackground
  const needsBackground = (() => {
    if (!currentConfig) return false

    if (currentConfig.initialColor === 'black' && !currentConfig.enableScrollChange) {
      return isScrolled
    }

    return isDarkMode
  })()

  const backgroundColor = currentConfig?.backgroundColor || '#f1f3f8b7'
  const isDropdownActive = isDropdownOpen

  // Закрытие бургер-меню при смене роута
  useEffect(() => {
    setIsBurgerOpen(false)
  }, [pathname])

  // Блокировка скролла при открытом бургер-меню
  useEffect(() => {
    if (isBurgerOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isBurgerOpen])

  const closeBurger = () => setIsBurgerOpen(false)

  return (
    <header
      className={[
        styles.header,
        hasBlur && needsBackground && !isDropdownActive ? styles.headerBlurred : '',
        isDarkMode && needsBackground && !isDropdownActive ? styles.headerDark : '',
        isDarkMode && !needsBackground && !isDropdownActive ? styles.headerDarkNoBg : '',
        isDropdownActive ? styles.headerDropdownActive : '',
      ].join(' ')}
      style={needsBackground && !isDropdownActive ? { backgroundColor } : {}}
      role="banner"
    >
      <div className={styles.container}>
        <div className={styles.containerBotLine} aria-hidden="true"></div>

        {/* Логотип слева */}
        <Link to="/" className={styles.logo} aria-label="Карачаево-Черкесия - Главная страница">
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

          {/* DROPDOWN: На помощь туристу */}
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
              className={`${styles.dropdownIcon} ${isDarkMode && styles.dropdownIconDark} ${isDropdownOpen ? styles.dropdownIconRotated : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div ref={dropdownRef} className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.dropdownMenuOpen : ''}`}>
              <div className={styles.dropdownContent}>
                {/* превью слева */}
                <div className={styles.dropdownImageWrapper}>
                  <img
                    src={articlesItems[activeArticleIndex]?.image || '/new1.png'}
                    alt="Превью статьи"
                    width={200}
                    height={200}
                    className={styles.dropdownImage}
                  />
                </div>

                {/* статьи */}
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

                {/* сервис */}
                <div className={`${styles.dropdownSection} ${styles.dropdownSectionBorder} ${styles.dropdownSectionServices}`}>
                  <h3 className={styles.dropdownSectionTitle}>{dropdownMenuData.services.title}</h3>
                  <div className={styles.dropdownColumns}>
                    {dropdownMenuData.services.columns.map((column, colIndex) => (
                      <ul key={colIndex} className={styles.dropdownList}>
                        {column.map((item, idx) => (
                          <li key={idx}>
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

                {/* экстренные */}
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

        {/* Кнопка бургер-меню (мобильные) */}
        <button
          type="button"
          className={styles.burgerButton}
          onClick={() => setIsBurgerOpen((p) => !p)}
          aria-label={isBurgerOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={isBurgerOpen}
        >
          <span className={`${styles.burgerLine} ${isBurgerOpen ? styles.burgerLineOpen1 : ''}`} />
          <span className={`${styles.burgerLine} ${isBurgerOpen ? styles.burgerLineOpen2 : ''}`} />
          <span className={`${styles.burgerLine} ${isBurgerOpen ? styles.burgerLineOpen3 : ''}`} />
        </button>

        {/* Иконки справа */}
        <div className={styles.icons} aria-label="Дополнительные действия">
          <Link
            to="/profile?tab=routes-constructor"
            className={styles.iconButton}
            aria-label="Конструктор маршрутов"
            title="Конструктор маршрутов"
          >
            <img src="/konst_tours.png" alt="Конструктор маршрутов" width={20} height={21} />
            {placeIds.length > 0 && <span className={styles.iconBadge}>{placeIds.length}</span>}
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

          <Link to="/profile" className={styles.iconButton} aria-label="Личный кабинет" title="Войти в личный кабинет">
            <img src="/profile.png" alt="Личный кабинет" width={16} height={18} />
          </Link>
        </div>
      </div>

      {/* Мобильное бургер-меню */}
      <div
        className={`${styles.burgerOverlay} ${isBurgerOpen ? styles.burgerOverlayOpen : ''}`}
        onClick={closeBurger}
        aria-hidden={!isBurgerOpen}
      />
      <div className={`${styles.burgerMenu} ${isBurgerOpen ? styles.burgerMenuOpen : ''}`}>
        <button type="button" className={styles.burgerClose} onClick={closeBurger} aria-label="Закрыть меню">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <Link to="/" className={styles.burgerLogo} onClick={closeBurger} aria-label="На главную">
          <img src="/color_logo.png" alt="Карачаево-Черкесия" />
        </Link>

        <nav className={styles.burgerNav}>
          <Link to="/region" className={`${styles.burgerLink} ${pathname === '/region' ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            О регионе
          </Link>
          <Link
            to="/routes"
            className={`${styles.burgerLink} ${pathname === '/routes' || (pathname?.startsWith('/routes/') && pathname !== '/routes') ? styles.burgerLinkActive : ''}`}
            onClick={closeBurger}
          >
            Маршруты
          </Link>
          <Link to="/places" className={`${styles.burgerLink} ${pathname === '/places' || pathname?.startsWith('/places/') ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            Интересные места
          </Link>
          <Link to="/news" className={`${styles.burgerLink} ${pathname === '/news' || pathname?.startsWith('/news/') ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            Новости
          </Link>
          <Link to="/services" className={`${styles.burgerLink} ${pathname === '/services' || pathname?.startsWith('/services/') ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            На помощь туристу
          </Link>
        </nav>

        <div className={styles.burgerIcons}>
          <Link to="/profile?tab=routes-constructor" className={styles.burgerIconItem} onClick={closeBurger}>
            <img src="/konst_tours.png" alt="" width={20} height={21} />
            <span>Конструктор маршрутов</span>
            {placeIds.length > 0 && <span className={styles.burgerIconBadge}>{placeIds.length}</span>}
          </Link>

          <button type="button" className={styles.burgerIconItem} onClick={() => { setIsSearchOpen(true); closeBurger() }}>
            <img src="/search.png" alt="" width={17} height={17} />
            <span>Поиск</span>
          </button>

          <Link to="/profile" className={styles.burgerIconItem} onClick={closeBurger}>
            <img src="/profile.png" alt="" width={16} height={18} />
            <span>Личный кабинет</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
