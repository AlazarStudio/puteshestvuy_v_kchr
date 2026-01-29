'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import styles from './LayoutWrapper.module.css'

export default function LayoutWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const isFirstLoad = useRef(true)
  const prevPathname = useRef(pathname)

  // Проверяем, находимся ли мы в админке
  const isAdminPage = pathname?.startsWith('/admin')

  // Управление классом loading на body: в админке всегда снимаем, на сайте — по isLoading
  useLayoutEffect(() => {
    if (isAdminPage) {
      document.body.classList.remove('loading')
      return
    }
    if (isLoading) {
      document.body.classList.add('loading')
    } else {
      document.body.classList.remove('loading')
    }
    return () => {
      document.body.classList.remove('loading')
    }
  }, [isLoading, isAdminPage])

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

  // Отслеживаем SPA-навигацию между страницами (только для основного сайта)
  useEffect(() => {
    if (isAdminPage) return
    if (isFirstLoad.current) return

    const getBasePath = (path) => {
      const parts = path.split('/').filter(Boolean)
      return parts[0] || ''
    }

    const currentBase = getBasePath(pathname)
    const prevBase = getBasePath(prevPathname.current)

    if (currentBase !== prevBase) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }

    prevPathname.current = pathname
  }, [pathname, isAdminPage])

  // Для админки показываем только children без Header/Footer и прелоадера
  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
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

      <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        <Header />
        {children}
        <Footer />
      </div>
    </>
  )
}
