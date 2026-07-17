

import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styles from './Header.module.css'
import GlobalSearch from '@/components/GlobalSearch/GlobalSearch'
import { useRouteConstructor } from '@/contexts/RouteConstructorContext'
import AccessibilityButton from '@/components/AccessibilityButton/AccessibilityButton'

function getCurrentLang() {
  const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('googtrans='))
  return cookie?.trim().slice('googtrans='.length).includes('/en') ? 'en' : 'ru'
}

function switchLang(lang) {
  if (lang === 'en') {
    document.cookie = 'googtrans=/ru/en; path=/'
    document.cookie = `googtrans=/ru/en; path=/; domain=${window.location.hostname}`
  } else {
    const exp = new Date(0).toUTCString()
    document.cookie = `googtrans=; expires=${exp}; path=/`
    document.cookie = `googtrans=; expires=${exp}; path=/; domain=${window.location.hostname}`
  }
  window.location.reload()
}

function LangSwitcher({ className }) {
  const lang = getCurrentLang()
  const inactive = lang === 'ru' ? 'en' : 'ru'
  return (
    <div className={`${styles.langSwitcher} ${className || ''}`}>
      <div className={styles.langInner}>
        <span className={styles.langActive}>{lang.toUpperCase()}</span>
        <button
          type="button"
          onClick={() => switchLang(inactive)}
          className={styles.langInactiveBtn}
        >
          {inactive.toUpperCase()}
        </button>
      </div>
    </div>
  )
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
  const navigate = useNavigate()
  const { placeIds } = useRouteConstructor()

  const [isNotFound, setIsNotFound] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasBlur, setHasBlur] = useState(false)

  // dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
            to="/places"
            className={`${styles.navLink} ${(pathname === '/places' || pathname?.startsWith('/places/')) && pathname !== '/places/artefakty-ekspeditsii-kollektsiya-amanauz-1774863515273' ? styles.navLink_active : ''}`}
            title="Интересные места для посещения"
          >
            Интересные места
          </Link>

          <Link
            to="/routes"
            className={`${styles.navLink} ${pathname === '/routes' || (pathname?.startsWith('/routes/') && pathname !== '/routes') ? styles.navLink_active : ''}`}
            title="Туристические маршруты"
          >
            Маршруты
          </Link>

          <Link
            to="/services"
            className={`${styles.navLink} ${pathname === '/services' || pathname?.startsWith('/services/') ? styles.navLink_active : ''}`}
            title="Услуги и сервисы для туристов"
          >
            Услуги и сервисы
          </Link>

          <Link
            to="/news"
            className={`${styles.navLink} ${pathname === '/news' || pathname?.startsWith('/news/') ? styles.navLink_active : ''}`}
            title="Новости и статьи"
          >
            Новости и статьи
          </Link>

          <Link
            to="/places/artefakty-ekspeditsii-kollektsiya-amanauz-1774863515273"
            className={`${styles.navLink} ${styles.navLinkAmanauz} ${pathname === '/places/artefakty-ekspeditsii-kollektsiya-amanauz-1774863515273' ? styles.navLink_active : ''}`}
            title="Экспедиция «Аманауз»"
          >
            Экспедиция «Аманауз»
          </Link>

        </nav>

        {/* Кнопка поиска (мобильные) — дублирует десктопную лупу */}
        <button
          type="button"
          className={styles.mobileSearchButton}
          onClick={() => setIsSearchOpen(true)}
          aria-label="Поиск"
          title="Поиск по сайту"
        >
          <img src="/search.png" alt="Поиск" width={18} height={18} />
        </button>

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
          <AccessibilityButton
            className={styles.iconButton}
            src={(isDarkMode || isDropdownActive) ? '/bvi.png' : '/bvi_white.png'}
          />
          <LangSwitcher />
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

          <Link to="/profile" className={styles.iconButton} aria-label="Личный кабинет" title="Войти в личный кабинет">
            <img src="/profile.png" alt="Личный кабинет" width={16} height={18} />
          </Link>
        </div>
      </div>

      {/* Общий поиск — вне .icons (которая display:none на мобилке), иначе модалка не показывается */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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

        {/* Строка поиска по платформе — открывает общий поиск */}
        <button
          type="button"
          className={styles.burgerSearch}
          onClick={() => { setIsSearchOpen(true); closeBurger() }}
          aria-label="Поиск по сайту"
        >
          <img src="/search.png" alt="" width={18} height={18} />
          <span>Поиск по сайту...</span>
        </button>

        <nav className={styles.burgerNav}>
          <Link to="/region" className={`${styles.burgerLink} ${pathname === '/region' ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            О регионе
          </Link>
          <Link to="/places" className={`${styles.burgerLink} ${(pathname === '/places' || pathname?.startsWith('/places/')) && pathname !== '/places/artefakty-ekspeditsii-kollektsiya-amanauz-1774863515273' ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            Интересные места
          </Link>
          <Link
            to="/routes"
            className={`${styles.burgerLink} ${pathname === '/routes' || (pathname?.startsWith('/routes/') && pathname !== '/routes') ? styles.burgerLinkActive : ''}`}
            onClick={closeBurger}
          >
            Маршруты
          </Link>
          <Link to="/services" className={`${styles.burgerLink} ${pathname === '/services' || pathname?.startsWith('/services/') ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            Услуги и сервисы
          </Link>
          <Link to="/news" className={`${styles.burgerLink} ${pathname === '/news' || pathname?.startsWith('/news/') ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            Новости и статьи
          </Link>
          <Link to="/places/artefakty-ekspeditsii-kollektsiya-amanauz-1774863515273" className={`${styles.burgerLink} ${pathname === '/places/artefakty-ekspeditsii-kollektsiya-amanauz-1774863515273' ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
            Экспедиция «Аманауз»
          </Link>
        </nav>

        <div className={styles.burgerIcons}>
          <button
            type="button"
            className={styles.burgerIconItem}
            onClick={() => { document.getElementById('specialButton')?.click(); closeBurger() }}
          >
            <img src="/bvi.png" alt="" width={20} height={20} />
            <span>Версия для слабовидящих</span>
          </button>
          <LangSwitcher className={styles.burgerLangSwitcher} />
          <Link to="/profile?tab=routes-constructor" className={styles.burgerIconItem} onClick={closeBurger}>
            <img src="/konst_tours.png" alt="" width={20} height={21} />
            <span>Конструктор маршрутов {placeIds.length > 0 && <>({placeIds.length})</>}</span>
          </Link>

          {/* <button type="button" className={styles.burgerIconItem} onClick={() => { setIsSearchOpen(true); closeBurger() }}>
            <img src="/search.png" alt="" width={17} height={17} />
            <span>Поиск</span>
          </button> */}

          <Link to="/profile" className={styles.burgerIconItem} onClick={closeBurger}>
            <img src="/profile.png" alt="" width={16} height={18} />
            <span>Личный кабинет</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
