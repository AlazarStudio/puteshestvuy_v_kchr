'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './NewsDetail.module.css'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RichTextContent from '@/components/RichTextContent/RichTextContent'
import { Link } from 'react-router-dom'
import { publicNewsAPI, getImageUrl } from '@/lib/api'
import { slugFromText } from '@/app/admin/components/NewsBlockEditor'
import NewsGalleryBlock from '@/components/NewsGalleryBlock'

export default function NewsDetail({ slug }) {
  const [news, setNews] = useState(null)
  const [popularNews, setPopularNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('')
  const contentRef = useRef(null)

  const blocks = Array.isArray(news?.blocks) ? news.blocks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []
  const sections = blocks
    .filter((b) => b.type === 'heading' && b.data?.text?.trim())
    .map((b) => ({
      id: slugFromText(b.data.text) || `h-${b.id}`,
      title: b.data.text.trim(),
    }))

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const [detailRes, listRes] = await Promise.all([
          publicNewsAPI.getByIdOrSlug(slug),
          publicNewsAPI.getAll({ limit: 4, page: 1 }),
        ])
        if (cancelled) return
        setNews(detailRes.data)
        const items = listRes.data?.items || []
        const others = items.filter((n) => n.id !== detailRes.data?.id).slice(0, 3)
        setPopularNews(others)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.status === 404 ? 'Запись не найдена' : 'Ошибка загрузки')
          setNews(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].id)
    }
  }, [sections, activeSection])

  useEffect(() => {
    if (sections.length === 0) return
    const handleScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150) {
            setActiveSection(sections[i].id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const offset = 100
      const top = el.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ top: top - offset, behavior: 'smooth' })
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.content}>
          <CenterBlock>
            <div className={styles.loading}>Загрузка...</div>
          </CenterBlock>
        </div>
      </main>
    )
  }

  if (error || !news) {
    return (
      <main className={styles.main}>
        <div className={styles.content}>
          <CenterBlock>
            <div className={styles.error}>{error || 'Запись не найдена'}</div>
            <Link to="/news" className={styles.backLink}>← Вернуться к списку</Link>
          </CenterBlock>
        </div>
      </main>
    )
  }

  const heroImage = news.image || news.images?.[0]
  const tagLabel = news.type === 'article' ? 'Статья' : 'Новость'

  return (
    <main className={styles.main}>
      <div className={styles.heroImage}>
        {heroImage && <img src={getImageUrl(heroImage)} alt={news.title} />}
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <CenterBlock>
            <div className={styles.heroText}>
              <div className={styles.tagDate}>
                <div className={styles.tag}>{tagLabel}</div>
                <div className={styles.date}>{formatDate(news.publishedAt)}</div>
              </div>
              <h1 className={styles.heroTitle}>{news.title}</h1>
            </div>
          </CenterBlock>
        </div>
      </div>

      <div className={styles.content}>
        <CenterBlock>
          <div className={styles.breadCrumbs}>
            <Link to="/">Главная</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {news.type === 'article' ? (
              <Link to="/services?filter=articles">Услуги и сервисы</Link>
            ) : (
              <Link to="/news">Новости</Link>
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{news.title}</span>
          </div>

          <div className={styles.contentWrapper}>
            <article className={styles.article} ref={contentRef}>
              {blocks.map((block) => {
                if (block.type === 'heading') {
                  const text = block.data?.text?.trim() || ''
                  const id = slugFromText(text) || `h-${block.id}`
                  return (
                    <h2 key={block.id} id={id} className={styles.sectionTitle}>
                      {text}
                    </h2>
                  )
                }
                if (block.type === 'text') {
                  return (
                    <div key={block.id} className={styles.textBlock}>
                      <RichTextContent html={block.data?.content} />
                    </div>
                  )
                }
                if (block.type === 'image' && block.data?.url) {
                  return (
                    <div key={block.id} className={styles.imageBlock}>
                      <img src={getImageUrl(block.data.url)} alt="" />
                    </div>
                  )
                }
                if (block.type === 'gallery' && Array.isArray(block.data?.images) && block.data.images.length > 0) {
                  return (
                    <NewsGalleryBlock key={block.id} images={block.data.images} />
                  )
                }
                if (block.type === 'quote' && (block.data?.content?.trim() || block.data?.text?.trim())) {
                  const quoteContent = block.data?.content || block.data?.text || ''
                  return (
                    <div key={block.id} className={styles.quoteBlock}>
                      <div className={styles.quoteContent}>
                        <RichTextContent html={quoteContent} />
                      </div>
                      <div className={styles.quoteMarks}>&rdquo;</div>
                    </div>
                  )
                }
                if (block.type === 'video' && block.data?.url) {
                  return (
                    <div key={block.id} className={styles.videoEmbed}>
                      <iframe
                        title="Видео VK"
                        src={block.data.url}
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )
                }
                return null
              })}

              <div className={styles.share}>
                <span className={styles.shareLabel}>Поделиться:</span>
                <div className={styles.shareButtons}>
                  <button className={styles.shareButton}>
                    <img src="/vk.png" alt="VK" />
                  </button>
                  <button className={styles.shareButton}>
                    <img src="/tg.png" alt="Telegram" />
                  </button>
                </div>
              </div>
            </article>

            {sections.length > 0 && (
              <aside className={styles.sidebar}>
                <nav className={styles.tableOfContents}>
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      className={`${styles.tocItem} ${activeSection === s.id ? styles.tocItemActive : ''}`}
                      onClick={() => scrollToSection(s.id)}
                    >
                      {s.title}
                    </button>
                  ))}
                </nav>
              </aside>
            )}
          </div>
        </CenterBlock>
      </div>

      {popularNews.length > 0 && (
        <div className={styles.popularSection}>
          <CenterBlock>
            <h2 className={styles.popularTitle}>Популярные новости</h2>
            <div className={styles.popularGrid}>
              {popularNews.map((item) => (
                <Link to={`/news/${item.slug || item.id}`} key={item.id} className={styles.popularCard}>
                  <div className={styles.popularImage}>
                    <img src={getImageUrl(item.image)} alt={item.title} />
                  </div>
                  <div className={styles.popularInfo}>
                    <div className={styles.popularDate}>{formatDate(item.publishedAt)}</div>
                    <div className={styles.popularCardTitle}>{item.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CenterBlock>
        </div>
      )}
    </main>
  )
}
