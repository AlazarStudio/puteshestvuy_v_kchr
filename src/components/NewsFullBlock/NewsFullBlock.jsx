'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
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

function NewsItemParallax({ item, formatDate, styles }) {
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  const xSpring = useSpring(x, { stiffness: 160, damping: 18, mass: 0.5 })
  const ySpring = useSpring(y, { stiffness: 160, damping: 18, mass: 0.5 })
  const scaleSpring = useSpring(scaleValue, { stiffness: 100, damping: 25, mass: 1 })

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const dx = px - 0.5
    const dy = py - 0.5

    x.set(dx * 10)
    y.set(dy * 10)
  }

  const handleMouseEnter = () => {
    scaleValue.set(1.02)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    scaleValue.set(1)
  }

  return (
    <Link 
      ref={cardRef}
      to={`/news/${item.slug || item.id}`} 
      className={styles.anotherNew}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.img}>
        <motion.img 
          src={getImageUrl(item.image || item.preview || item.images?.[0]) || '/new1.png'} 
          alt={item.title}
          style={{
            x: xSpring,
            y: ySpring,
            scale: scaleSpring,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.tagDate}>
          <div className={styles.tag}>новости</div>
          <div className={styles.date}>{formatDate(item.publishedAt)}</div>
        </div>
        <div className={styles.shortTitle}>{item.title}</div>
      </div>
    </Link>
  )
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
              <NewsItemParallax 
                key={item.id} 
                item={item} 
                formatDate={formatDate}
                styles={styles}
              />
            ))}
          </div>
        )}
      </CenterBlock>
    </div>
  )
}
