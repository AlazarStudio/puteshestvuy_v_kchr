import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import EventBlock from '@/components/EventBlock/EventBlock'
import SuggestEventModal from '@/components/SuggestEventModal/SuggestEventModal'
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
  const when = searchParams.get('when') === 'past' ? 'past' : 'upcoming'
  const isPast = when === 'past'

  const [items, setItems] = useState([])
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [suggestEventOpen, setSuggestEventOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    publicEventsAPI
      .getAll({ page, limit: LIMIT, ...(category ? { category } : {}), ...(isPast ? { when: 'past' } : {}) })
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
  }, [page, category, isPast])

  // Единственное место, где собирается адрес: с тремя параметрами
  // потерять один при переходе — вопрос времени
  const buildParams = ({ category: c = category, when: w = when, page: p = 1 }) => {
    const next = {}
    if (c) next.category = c
    if (w === 'past') next.when = 'past'
    if (p > 1) next.page = String(p)
    return next
  }

  // Смена категории и вкладки всегда возвращает на первую страницу:
  // на четвёртой странице архива и анонсов лежат разные события
  const selectCategory = (value) => setSearchParams(buildParams({ category: value, page: 1 }))

  const selectWhen = (value) => setSearchParams(buildParams({ when: value, page: 1 }))

  const goToPage = (p) => {
    setSearchParams(buildParams({ page: p }))
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
            description: isPast
              ? 'Прошедшие события Карачаево-Черкесии: фестивали, концерты, выставки и народные праздники.'
              : 'Предстоящие события Карачаево-Черкесии: фестивали, концерты, выставки и народные праздники.',
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
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Афиша событий</h1>
            <button type="button" className={styles.suggestBtn} onClick={() => setSuggestEventOpen(true)}>
              Предложить событие
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${!isPast ? styles.tabActive : ''}`}
              onClick={() => selectWhen('upcoming')}
            >
              Ближайшие
            </button>
            <button
              type="button"
              className={`${styles.tab} ${isPast ? styles.tabActive : ''}`}
              onClick={() => selectWhen('past')}
            >
              Прошедшие
            </button>
          </div>

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
              <p>
                {isPast
                  ? (category ? 'В этой категории нет прошедших событий' : 'Прошедших событий пока нет')
                  : (category ? 'В этой категории пока нет предстоящих событий' : 'Предстоящих событий пока нет')}
              </p>
              {!isPast && (
                <button type="button" className={styles.suggestBtn} onClick={() => setSuggestEventOpen(true)}>
                  Предложить событие
                </button>
              )}
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

      <SuggestEventModal isOpen={suggestEventOpen} onClose={() => setSuggestEventOpen(false)} />
    </main>
  )
}
