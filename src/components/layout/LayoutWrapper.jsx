'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import styles from './LayoutWrapper.module.css'

export default function LayoutWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstLoad = useRef(true)
  const prevRoute = useRef(null)

  // Проверяем, находимся ли мы в админке
  const isAdminPage = pathname?.startsWith('/admin')

  // Показываем прелоадер при первой загрузке или при переходе по ссылке
  const showPreloader = isLoading || isNavigating

  // Управление классом loading на body: в админке всегда снимаем, на сайте — по showPreloader
  useLayoutEffect(() => {
    if (isAdminPage) {
      document.body.classList.remove('loading')
      return
    }
    if (showPreloader) {
      document.body.classList.add('loading')
    } else {
      document.body.classList.remove('loading')
    }
    return () => {
      document.body.classList.remove('loading')
    }
  }, [showPreloader, isAdminPage])

  // Первоначальная загрузка страницы
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false)
        isFirstLoad.current = false
      }, 800)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }

    return () => {
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  // При клике по внутренней ссылке или программном переходе — показываем прелоадер
  useEffect(() => {
    if (isAdminPage) return

    const handleClick = (e) => {
      const link = e.target.closest('a[href^="/"]')
      if (!link) return
      // Не показываем прелоадер, если клик по зоне, где переход по ссылке отключён (слайдер и т.п.)
      if (e.target.closest('[data-no-navigate]')) return
      // Пропускаем внешние ссылки (//), открытие в новой вкладке, якоря без смены страницы
      const href = link.getAttribute('href') || ''
      if (href.startsWith('//') || link.target === '_blank') return
      // Не показываем прелоадер при клике по текущей странице (тот же path + query)
      const pathAndQuery = href.split('#')[0]
      const currentRoute = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')
      if (pathAndQuery === currentRoute || pathAndQuery === '' || pathAndQuery === pathname) return
      setIsNavigating(true)
    }

    const handleNavigateStart = () => setIsNavigating(true)

    document.addEventListener('click', handleClick, true)
    window.addEventListener('navigate-start', handleNavigateStart)
    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('navigate-start', handleNavigateStart)
    }
  }, [isAdminPage, pathname, searchParams])

  // Когда pathname или searchParams изменились — страница/фильтр загрузились, скрываем прелоадер
  useEffect(() => {
    if (isAdminPage) return

    const search = searchParams.toString()
    const currentRoute = pathname + (search ? '?' + search : '')
    const prev = prevRoute.current

    if (prev === null) {
      prevRoute.current = currentRoute
      return
    }

    if (currentRoute !== prev) {
      prevRoute.current = currentRoute
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsNavigating(false)
        })
      })
      return () => cancelAnimationFrame(timer)
    }
  }, [pathname, searchParams, isAdminPage])

  // Для админки показываем только children без Header/Footer и прелоадера
  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showPreloader && (
          <motion.div
            key="preloader"
            className={styles.preloader}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div className={styles.content}>
              <div className={styles.logo}>
                <img src="/color_logo.png" alt="Путешествуй в КЧР" />
              </div>
              <div className={styles.loader}>
                <div className={styles.loaderDot}></div>
                <div className={styles.loaderDot}></div>
                <div className={styles.loaderDot}></div>
              </div>
              <div className={styles.text}>Загрузка...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ opacity: showPreloader ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        <Header />
        {children}
        <Footer />
      </div>
    </>
  )
}
