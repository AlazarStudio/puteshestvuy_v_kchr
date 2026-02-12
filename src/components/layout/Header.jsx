'use client'

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'
import GlobalSearch from '@/components/GlobalSearch/GlobalSearch'
import { useRouteConstructor } from '@/contexts/RouteConstructorContext'

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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isBurgerOpen, setIsBurgerOpen] = useState(false)
  
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

  // Закрытие бургер-меню при смене роута
  useEffect(() => {
    setIsBurgerOpen(false)
  }, [pathname])

  // Блокировка скролла при открытом бургер-меню
  useEffect(() => {
    if (isBurgerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isBurgerOpen])

  const closeBurger = () => setIsBurgerOpen(false)

  return (
    <header 
      className={`${styles.header} ${hasBlur && needsBackground ? styles.headerBlurred : ''} ${isDarkMode && needsBackground ? styles.headerDark : ''} ${isDarkMode && !needsBackground ? styles.headerDarkNoBg : ''}`} 
      style={needsBackground ? { backgroundColor } : {}}
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
          {isDarkMode ? (
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
          <Link
            to="/services"
            className={`${styles.navLink} ${pathname === '/services' || pathname?.startsWith('/services/') ? styles.navLink_active : ''}`}
            title="Услуги и сервисы для туристов"
          >
            На помощь туристу
          </Link>
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

      {/* Мобильное бургер-меню */}
      <div
        className={`${styles.burgerOverlay} ${isBurgerOpen ? styles.burgerOverlayOpen : ''}`}
        onClick={closeBurger}
        aria-hidden={!isBurgerOpen}
      />
      <div className={`${styles.burgerMenu} ${isBurgerOpen ? styles.burgerMenuOpen : ''}`}>
        <button
          type="button"
          className={styles.burgerClose}
          onClick={closeBurger}
          aria-label="Закрыть меню"
        >
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
          <Link to="/routes" className={`${styles.burgerLink} ${pathname === '/routes' || (pathname?.startsWith('/routes/') && pathname !== '/routes') ? styles.burgerLinkActive : ''}`} onClick={closeBurger}>
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
          <button
            type="button"
            className={styles.burgerIconItem}
            onClick={() => { setIsSearchOpen(true); closeBurger() }}
          >
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
