'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Header.module.css'

export default function Header() {
  const pathname = usePathname()
  const [isNotFound, setIsNotFound] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasBlur, setHasBlur] = useState(false)

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
    // Отслеживаем скролл для изменения стилей header
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset
      const screenHeight = window.innerHeight - 200

      // Blur появляется сразу при любом скролле
      setHasBlur(scrollPosition > 0)

      // Темные цвета появляются при прокрутке больше одного экрана
      setIsScrolled(scrollPosition > screenHeight)
    }

    // Проверяем начальную позицию
    handleScroll()

    // Добавляем слушатель скролла
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const isDarkMode = isNotFound || isScrolled

  return (
    <header className={`${styles.header} ${hasBlur ? styles.headerBlurred : ''} ${isDarkMode ? styles.headerDark : ''}`} role="banner">
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
            className={`${styles.navLink} ${pathname === '/routes' ? styles.navLink_active : ''}`}
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
            href="/measures"
            className={`${styles.navLink} ${pathname === '/measures' ? styles.navLink_active : ''}`}
            title="Меры поддержки туризма"
          >
            Меры
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
