'use client'

import { useState, useEffect } from 'react'
import styles from './NewsFullBlock.module.css'
import CenterBlock from '../CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'
import { publicNewsAPI, getImageUrl } from '@/lib/api'

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function NewsFullBlock() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    publicNewsAPI.getAll({ type: 'news', limit: 3, page: 1 })
      .then(({ data }) => {
        if (!cancelled && data?.items?.length) {
          setNews(data.items)
        } else if (!cancelled) {
          setNews([])
        }
      })
      .catch(() => {
        if (!cancelled) setNews([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const [featured, ...rest] = news
  const bgImage = getImageUrl(featured?.image || featured?.preview || featured?.images?.[0]) || '/newBG.png'

  if (loading) {
    return (
      <div className={styles.news} style={{ background: 'url(/newBG.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>
        <CenterBlock>
          <div className={styles.loading}>Загрузка новостей...</div>
        </CenterBlock>
      </div>
    )
  }

  if (!featured) {
    return null
  }

  return (
    <div className={styles.news} style={{
      background: `url(${bgImage})`,
    }}>
      <CenterBlock>
        <div className={styles.top}>
          <div className={styles.tagDate}>
            <div className={styles.tag}>новости</div>
            <div className={styles.date}>{formatDate(featured.publishedAt)}</div>
          </div>
          <div className={styles.title}>
            {featured.title}
          </div>
          <div className={styles.description}>
            {stripHtml(featured.shortDescription) || ''}
          </div>
          <Link to={`/news/${featured.slug || featured.id}`} className={styles.button}>Читать далее</Link>
        </div>
        {rest.length > 0 && (
          <div className={styles.bottom}>
            {rest.slice(0, 2).map((item) => (
              <Link to={`/news/${item.slug || item.id}`} key={item.id} className={styles.anotherNew}>
                <div className={styles.img}>
                  <img src={getImageUrl(item.image || item.preview || item.images?.[0]) || '/new1.png'} alt={item.title} />
                </div>
                <div className={styles.info}>
                  <div className={styles.tagDate}>
                    <div className={styles.tag}>новости</div>
                    <div className={styles.date}>{formatDate(item.publishedAt)}</div>
                  </div>
                  <div className={styles.shortTitle}>{item.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CenterBlock>
    </div>
  )
}
