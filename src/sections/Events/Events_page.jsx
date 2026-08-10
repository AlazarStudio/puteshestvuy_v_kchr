import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import EventBlock from '@/components/EventBlock/EventBlock'
import Seo from '@/components/Seo/Seo'
import { collectionPage, itemList, breadcrumbList } from '@/lib/seo/schema'
import { absoluteUrl } from '@/lib/seo/config'
import { publicEventsAPI } from '@/lib/api'
import { EVENT_CATEGORIES } from '@/lib/eventCategories'
import styles from './Events_page.module.css'

const LIMIT = 12

export default function Events_page() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const page = parseInt(searchParams.get('page'), 10) || 1

  const [items, setItems] = useState([])
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    publicEventsAPI
      .getAll({ page, limit: LIMIT, ...(category ? { category } : {}) })
      .then(({ data }) => {
        if (cancelled) return
        setItems(data?.items || [])
        setPages(data?.pagination?.pages || 1)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setPages(1)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, category])

  // Смена категории всегда возвращает на первую страницу: page в адрес не переносится
  const selectCategory = (value) => {
    const next = {}
    if (value) next.category = value
    setSearchParams(next)
  }

  const goToPage = (p) => {
    const next = {}
    if (category) next.category = category
    if (p > 1) next.page = String(p)
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className={styles.main}>
      <Seo
        title="Афиша событий Карачаево-Черкесии"
        description="События Карачаево-Черкесии: фестивали, концерты, выставки и народные праздники."
        path="/events"
        jsonLd={[
          collectionPage({
            name: 'Афиша событий',
            description: 'Предстоящие события Карачаево-Черкесии: фестивали, концерты, выставки и народные праздники.',
            url: absoluteUrl('/events'),
          }),
          itemList(items.slice(0, 20).map((e) => ({ name: e.title, url: absoluteUrl(`/events/${e.slug}`) }))),
          breadcrumbList([
            { name: 'Главная', url: absoluteUrl('/') },
            { name: 'Афиша событий', url: absoluteUrl('/events') },
          ]),
        ]}
      />

      <CenterBlock>
        <section className={styles.section}>
          <h1 className={styles.title}>Афиша событий</h1>

          <div className={styles.filters}>
            <button
              type="button"
              className={`${styles.filter} ${!category ? styles.filterActive : ''}`}
              onClick={() => selectCategory('')}
            >
              Все
            </button>
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.filter} ${category === c ? styles.filterActive : ''}`}
                onClick={() => selectCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles.empty}>Загрузка...</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              {category
                ? 'В этой категории пока нет предстоящих событий'
                : 'Предстоящих событий пока нет'}
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((event) => (
                <EventBlock key={event.id} event={event} />
              ))}
            </div>
          )}

          {!loading && pages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.page} ${p === page ? styles.pageActive : ''}`}
                  onClick={() => goToPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>
      </CenterBlock>
    </main>
  )
}
