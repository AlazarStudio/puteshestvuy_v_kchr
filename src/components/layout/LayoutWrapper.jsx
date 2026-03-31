'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import styles from './LayoutWrapper.module.css'

export default function LayoutWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isFirstLoad = useRef(true)
  const prevRoute = useRef(null)
  const navigationStartRef = useRef(0)
  const PRELOADER_MIN_MS = 500

  // Проверяем, находимся ли мы в админке
  const isAdminPage = pathname?.startsWith('/admin')

  // Показываем прелоадер при первой загрузке или при переходе по ссылке
  const showPreloader = isLoading || isNavigating

  // При показе прелоадера прокручиваем страницу вверх
  useEffect(() => {
    if (showPreloader) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [showPreloader])

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

  // Первоначальная загрузка страницы (прелоадер минимум 0.5 сек)
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false)
        isFirstLoad.current = false
      }, PRELOADER_MIN_MS)
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
      const currentRoute = pathname + (searchParams?.toString() ? '?' + searchParams.toString() : '')
      if (pathAndQuery === currentRoute || pathAndQuery === '' || pathAndQuery === pathname) return
      navigationStartRef.current = Date.now()
      setIsNavigating(true)
    }

    const handleNavigateStart = () => {
      navigationStartRef.current = Date.now()
      setIsNavigating(true)
    }

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

    const search = searchParams?.toString?.() ?? ''
    const currentRoute = pathname + (search ? '?' + search : '')
    const prev = prevRoute.current

    if (prev === null) {
      prevRoute.current = currentRoute
      return
    }

    if (currentRoute !== prev) {
      prevRoute.current = currentRoute
      const elapsed = Date.now() - navigationStartRef.current
      const remaining = Math.max(0, PRELOADER_MIN_MS - elapsed)
      const timer = setTimeout(() => setIsNavigating(false), remaining)
      return () => clearTimeout(timer)
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
            {/*
              Старый прелоудер (оставляем, но не используем)
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
            */}

            <div className={styles.preloaderNew}>
              <div className={styles.preloaderMark} aria-hidden="true">
                <svg width="202" height="202" viewBox="0 0 202 202" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0.0398785 59.9529C-0.7948 78.8188 11.5584 92.4137 28.9435 93.4631C35.2155 93.8924 40.8913 90.7442 40.8913 86.141C40.8913 80.703 22.8862 73.1423 22.8862 60.573C22.8862 55.9698 26.2249 52.6069 31.686 52.6069C49.2858 52.6069 81.1228 85.2823 81.3374 101C81.1228 116.718 49.2858 149.393 31.686 149.393C26.2487 149.393 22.8861 146.054 22.8861 141.427C22.8861 128.858 40.8913 121.321 40.8913 115.859C40.8913 111.256 35.2394 108.107 28.9435 108.537C11.5584 109.586 -0.794804 123.205 0.0398713 142.047C0.469133 151.683 2.54391 158.814 2.75854 169.905C2.97317 178.92 -0.174764 186.672 0.0398668 193.994C0.0398666 196.522 0.77913 198.502 2.13846 199.861C3.49779 201.221 5.50104 201.96 8.00507 201.96C15.3264 202.175 23.0769 199.026 32.0914 199.241C43.2046 199.456 50.3113 201.555 59.9458 201.96C78.8095 202.795 92.4028 190.44 93.4521 173.053C93.8814 166.78 90.7335 161.104 86.1308 161.104C80.6935 161.104 73.1337 179.111 60.5659 179.111C55.9632 179.111 52.6007 175.748 52.6007 170.31C52.6007 152.708 85.2723 120.868 100.988 120.653C116.704 120.868 149.375 152.708 149.375 170.31C149.375 175.748 146.037 179.111 141.41 179.111C128.842 179.111 121.307 161.104 115.845 161.104C111.243 161.104 108.095 166.756 108.524 173.053C109.573 190.44 123.19 202.795 142.054 201.96C151.689 201.531 158.819 199.456 169.909 199.241C178.923 199.026 186.674 202.175 193.995 201.96C196.523 201.96 198.502 201.221 199.862 199.861C201.221 198.502 201.96 196.498 201.96 193.994C202.175 186.672 199.027 178.92 199.241 169.905C199.456 158.79 201.555 151.683 201.96 142.047C202.795 123.181 190.442 109.586 173.056 108.537C166.784 108.108 161.109 111.256 161.109 115.859C161.109 121.297 179.114 128.858 179.114 141.427C179.114 146.03 175.751 149.393 170.314 149.393C152.714 149.393 120.877 116.718 120.663 101C120.877 85.2823 152.714 52.6069 170.314 52.6069C175.751 52.6069 179.114 55.9698 179.114 60.573C179.114 73.1423 161.109 80.6792 161.109 86.141C161.109 90.7442 166.761 93.8925 173.056 93.4631C190.442 92.4137 202.795 78.795 201.96 59.9529C201.555 50.3172 199.456 43.1859 199.241 32.0953C199.027 23.0797 202.175 15.3282 201.96 8.00601C201.96 5.47784 201.221 3.49818 199.862 2.13869C198.502 0.779195 196.523 0.0398891 193.995 0.0398889C186.674 -0.174768 178.923 2.97349 169.909 2.75884C158.795 2.54418 151.689 0.445348 142.054 0.0398843C123.19 -0.794893 109.597 11.5598 108.548 28.9469C108.119 35.2197 111.267 40.8961 115.869 40.8961C121.306 40.8961 128.866 22.8888 141.434 22.8888C146.037 22.8888 149.399 26.2518 149.399 31.6898C149.399 49.2916 116.728 81.1323 101.012 81.347C85.2962 81.1323 52.6245 49.2916 52.6245 31.6898C52.6245 26.2518 55.9632 22.8888 60.5897 22.8888C73.1576 22.8888 80.6935 40.8961 86.1547 40.8961C90.7573 40.8961 93.9052 35.2435 93.476 28.9469C92.4267 11.5598 78.8095 -0.794897 59.9697 0.0398771C50.3351 0.445339 43.2046 2.54417 32.1153 2.75882C23.1008 2.97348 15.3502 -0.174783 8.02891 0.0398726C5.52488 0.0398724 3.52168 0.779178 2.16235 2.13867C0.803019 3.49816 0.0637238 5.47782 0.0637236 8.006C-0.150908 15.3282 2.99701 23.0797 2.78237 32.0952C2.56774 43.2097 0.469134 50.3172 0.0637191 59.9529L0.0398785 59.9529Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
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
