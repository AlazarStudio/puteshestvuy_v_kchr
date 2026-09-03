import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Seo from '@/components/Seo/Seo'
import styles from './not-found.module.css'

const POPULAR_LINKS = [
  { to: '/places', label: 'Интересные места' },
  { to: '/routes', label: 'Маршруты' },
  { to: '/services', label: 'Услуги' },
  { to: '/news', label: 'Новости' },
]

export default function NotFound() {
  // Класс читает Header: у 404 нет обложки, поэтому шапке нужен тёмный вариант
  useEffect(() => {
    document.documentElement.classList.add('not-found-page')
    document.body.classList.add('not-found-page')

    return () => {
      document.documentElement.classList.remove('not-found-page')
      document.body.classList.remove('not-found-page')
    }
  }, [])

  return (
    <main className={styles.page}>
      <Seo noindex title="Страница не найдена — Путешествуй КЧР" />

      <CenterBlock width={900}>
        <div className={styles.inner}>
          <div className={styles.code}>404</div>
          <h1 className={styles.title}>Страница не найдена</h1>
          <p className={styles.subtitle}>
            Возможно, страница была перемещена или удалена, а ссылка устарела. Начните с главной
            или выберите один из популярных разделов.
          </p>

          <div className={styles.action}>
            <Link to="/">
              <Button
                size="lg"
                className="!rounded-full !bg-[#156A60] hover:!bg-[#0d5248] focus:!ring-[#156A60]"
              >
                Вернуться на главную
              </Button>
            </Link>
          </div>

          <div className={styles.linksTitle}>Популярные разделы</div>
          <nav className={styles.links} aria-label="Популярные разделы">
            {POPULAR_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={styles.link}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </CenterBlock>
    </main>
  )
}
