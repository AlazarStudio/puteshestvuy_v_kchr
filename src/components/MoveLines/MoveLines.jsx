'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './MoveLines.module.css'
import { publicPlacesAPI, publicRoutesAPI, publicNewsAPI, getImageUrl } from '@/lib/api'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function duplicateItems(items, times = 4) {
  const result = []
  for (let i = 0; i < times; i++) {
    items.forEach((item, idx) => {
      result.push({ ...item, key: `${item.id}-${i}-${idx}` })
    })
  }
  return result
}

const MARQUEE_DURATION = 500

export default function MoveLines() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      publicPlacesAPI.getAll({ limit: 15, page: 1 }),
      publicRoutesAPI.getAll({ limit: 15, page: 1 }),
      publicNewsAPI.getAll({ limit: 15, page: 1 }),
      publicNewsAPI.getAll({ limit: 10, page: 1, type: 'article' }),
    ])
      .then(([placesRes, routesRes, newsRes, articlesRes]) => {
        if (cancelled) return
        const combined = []
        const places = (placesRes.data?.items || []).map((p) => ({
          id: `place-${p.id}`,
          title: p.title,
          image: getImageUrl(p.image || p.images?.[0]),
          url: `/places/${p.slug || p.id}`,
        }))
        const routes = (routesRes.data?.items || []).map((r) => ({
          id: `route-${r.id}`,
          title: r.title,
          image: getImageUrl(r.image || r.images?.[0]),
          url: `/routes/${r.slug || r.id}`,
        }))
        const news = (newsRes.data?.items || []).map((n) => ({
          id: `news-${n.id}`,
          title: n.title,
          image: getImageUrl(n.image || n.preview || n.images?.[0]),
          url: `/news/${n.slug || n.id}`,
        }))
        const articles = (articlesRes.data?.items || []).map((a) => ({
          id: `article-${a.id}`,
          title: a.title,
          image: getImageUrl(a.image || a.preview || a.images?.[0]),
          url: `/news/${a.slug || a.id}`,
        }))
        combined.push(...places, ...routes, ...news, ...articles)
        const filtered = combined.filter((i) => i.title?.trim())
        const shuffled = shuffle(filtered.length > 0 ? filtered : [])
        setItems(shuffled)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading || items.length === 0) {
    return null
  }

  const lineItems = duplicateItems(items, 4)

  const Tag = ({ item }) => (
    <Link to={item.url} className={styles.tag}>
      <span className={styles.tagText}>{item.title}</span>
      <div className={styles.circle}>
        <img src={item.image} alt="" />
      </div>
    </Link>
  )

  const Track = ({ reverse }) => (
    <div className={`${styles.track} ${reverse ? styles.trackReverse : ''}`} style={{ animationDuration: `${MARQUEE_DURATION}s` }}>
      <div className={styles.trackContent}>
        {lineItems.map((item) => (
          <Tag key={item.key} item={item} />
        ))}
      </div>
      <div className={styles.trackContent} aria-hidden="true">
        {lineItems.map((item) => (
          <Tag key={`dup-${item.key}`} item={item} />
        ))}
      </div>
    </div>
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.sliderLine}>
        <Track />
      </div>
      <div className={styles.sliderLine}>
        <Track reverse />
      </div>
      <div className={styles.sliderLine}>
        <Track />
      </div>
    </div>
  )
}
