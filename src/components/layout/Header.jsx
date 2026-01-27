'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Header.module.css'

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
    path: '/help',
    initialColor: 'white',
    scrollThreshold: 200,
    enableScrollChange: true,
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
  const pathname = usePathname()
  const [isNotFound, setIsNotFound] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasBlur, setHasBlur] = useState(false)
  
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
          href="/"
          className={styles.logo}
          aria-label="Карачаево-Черкесия - Главная страница"
        >
          {isDarkMode ? <Image
            src="/color_logo.png"
            alt="Логотип Карачаево-Черкесии"
            width={232}
            height={50}
            priority
            quality={90}
          /> :
            <Image
              src="/white_logo.png"
              alt="Логотип Карачаево-Черкесии"
              width={232}
              height={50}
              priority
              quality={90}
            />
          }
        </Link>

        {/* Навигационное меню по центру */}
        <nav className={styles.nav} role="navigation" aria-label="Основная навигация">
          <Link
            href="/region"
            className={`${styles.navLink} ${pathname === '/region' ? styles.navLink_active : ''}`}
            title="Информация о регионе Карачаево-Черкесия"
          >
            О регионе
          </Link>
          <Link
            href="/routes"
            className={`${styles.navLink} ${pathname === '/routes' || (pathname?.startsWith('/routes/') && pathname !== '/routes') ? styles.navLink_active : ''}`}
            title="Туристические маршруты"
          >
            Маршруты
          </Link>
          <Link
            href="/places"
            className={`${styles.navLink} ${pathname === '/places' ? styles.navLink_active : ''}`}
            title="Интересные места для посещения"
          >
            Интересные места
          </Link>
          <Link
            href="/news"
            className={`${styles.navLink} ${pathname === '/news' ? styles.navLink_active : ''}`}
            title="Новости и события"
          >
            Новости
          </Link>
          <Link
            href="/merch"
            className={`${styles.navLink} ${pathname === '/merch' ? styles.navLink_active : ''}`}
            title="Мерч поддержки туризма"
          >
            Мерч
          </Link>
          <div className={styles.navDropdown}>
            <Link
              href="/help"
              className={`${styles.navLink} ${pathname === '/help' ? styles.navLink_active : ''}`}
              title="Помощь туристам"
            >
              На помощь туристу
            </Link>
            <svg
              className={styles.dropdownIcon}
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
          </div>
        </nav>

        {/* Иконки справа */}
        <div className={styles.icons} aria-label="Дополнительные действия">
          <Link
            href="/tours"
            className={styles.iconButton}
            aria-label="Конструктор туров"
            title="Создать свой тур"
          >
            <Image
              src="/konst_tours.png"
              alt="Конструктор туров"
              width={20}
              height={20}
            />
          </Link>

          <Link
            href="/search"
            className={styles.iconButton}
            aria-label="Поиск"
            title="Поиск по сайту"
          >
            <Image
              src="/search.png"
              alt="Поиск"
              width={17}
              height={17}
            />
          </Link>

          <Link
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
          </Link>

          <Link
            href="/profile"
            className={styles.iconButton}
            aria-label="Личный кабинет"
            title="Войти в личный кабинет"
          >
            <Image
              src="/profile.png"
              alt="Личный кабинет"
              width={16}
              height={18}
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
