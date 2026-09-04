import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import styles from './ScrollToTopButton.module.css'

const SHOW_AFTER_PX = 600

/** Плавающая кнопка возврата к началу страницы, появляется после прокрутки */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ''}`}
      onClick={handleClick}
      aria-label="Наверх"
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp size={22} aria-hidden />
    </button>
  )
}
