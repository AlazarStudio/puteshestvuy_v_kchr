'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './ServiceTabBlock.module.css'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import { publicServicesAPI, publicHomeAPI, getImageUrl } from '@/lib/api'

const FILTER_TO_CATEGORY = {
  'Гиды': 'Гид',
  'Активности': 'Активности',
  'Прокат оборудования': 'Прокат оборудования',
  'Пункты придорожного сервиса': 'Придорожный пункт',
  'Торговые точки': 'Торговая точка',
  'Сувениры': 'Сувениры',
  'Гостиницы': 'Гостиница',
  'Кафе и рестораны': 'Кафе и ресторан',
  'Трансфер': 'Трансфер',
  'АЗС': 'АЗС',
  'Санитарные узлы': 'Санитарные узлы',
  'Пункты медпомощи': 'Пункт медпомощи',
  'МВД': 'МВД',
  'Пожарная охрана': 'Пожарная охрана',
  'Музеи': 'Музей',
}

const TAB_ORDER = [
  'Гиды',
  'Активности',
  'Прокат оборудования',
  'Пункты придорожного сервиса',
  'Торговые точки',
  'Сувениры',
  'Гостиницы',
  'Кафе и рестораны',
  'Трансфер',
  'АЗС',
  'Санитарные узлы',
  'Музеи',
  'Пункты медпомощи',
  'МВД',
  'Пожарная охрана',
]

const DEFAULT_CARDS_PER_TAB = 8

export default function ServiceTabBlock() {
  const [tabs, setTabs] = useState([])
  const [activeTab, setActiveTab] = useState(null)
  const [servicesByCategory, setServicesByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [cardsLimit, setCardsLimit] = useState(DEFAULT_CARDS_PER_TAB)

  // Загружаем настройки главной страницы для получения лимита карточек
  useEffect(() => {
    let cancelled = false
    publicHomeAPI.get()
      .then(({ data }) => {
        if (!cancelled && data?.servicesCardsLimit) {
          const limit = typeof data.servicesCardsLimit === 'number' && data.servicesCardsLimit > 0 
            ? data.servicesCardsLimit 
            : DEFAULT_CARDS_PER_TAB
          setCardsLimit(limit)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCardsLimit(DEFAULT_CARDS_PER_TAB)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Одна загрузка всех услуг — данные по категориям сохраняются для всех табов
  useEffect(() => {
    let cancelled = false
    publicServicesAPI.getAll({ limit: 500 })
      .then(({ data }) => {
        if (!cancelled && data?.items?.length) {
          const byCategory = {}
          data.items.forEach((s) => {
            const cat = s.category || ''
            if (cat) {
              if (!byCategory[cat]) byCategory[cat] = []
              byCategory[cat].push(s)
            }
          })
          
          // Сортируем услуги в каждой категории по популярности (uniqueViewsCount) от большего к меньшему
          Object.keys(byCategory).forEach((cat) => {
            byCategory[cat].sort((a, b) => {
              const viewsA = a.uniqueViewsCount ?? 0
              const viewsB = b.uniqueViewsCount ?? 0
              return viewsB - viewsA // От большего к меньшему
            })
          })
          
          setServicesByCategory(byCategory)
          const filledTabs = TAB_ORDER.filter((label) => {
            const cat = FILTER_TO_CATEGORY[label]
            return cat && (byCategory[cat]?.length || 0) > 0
          })
          setTabs(filledTabs)
          if (filledTabs.length > 0) {
            setActiveTab(filledTabs[0])
          }
        } else if (!cancelled) {
          setServicesByCategory({})
          setTabs([])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServicesByCategory({})
          setTabs([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const services = activeTab
    ? (servicesByCategory[FILTER_TO_CATEGORY[activeTab]] || []).slice(0, cardsLimit)
    : []

  if (loading || tabs.length === 0) {
    return null
  }

  return (
    <section className={styles.service}>
      <nav className={styles.tabs}>
        <ul>
          {tabs.map((label) => (
            <li
              key={label}
              className={activeTab === label ? styles.active : ''}
              onClick={() => setActiveTab(label)}
            >
              {label}
            </li>
          ))}
        </ul>
        <div className={styles.line}></div>
      </nav>
      <div className={styles.cards}>
        {services.length === 0 ? (
          <div className={styles.empty}>Услуги не найдены</div>
        ) : (
          services.map((service) => {
            const hasReviews = (service.reviewsCount ?? 0) > 0
            const displayRating = hasReviews && service.rating != null && service.rating !== '' 
              ? (Number(service.rating) % 1 === 0 ? String(service.rating) : Number(service.rating).toFixed(1))
              : null
            
            const formatReviews = (n) => {
              if (n === 1) return '1 отзыв'
              if (n >= 2 && n <= 4) return `${n} отзыва`
              return `${n} отзывов`
            }

            return (
              <Link
                key={service.id}
                to={`/services/${service.slug || service.id}`}
                className={styles.serviceCard}
              >
                <div className={styles.serviceCardImg}>
                  <img src={getImageUrl(service.image || service.images?.[0]) || '/serviceImg1.png'} alt={service.title} />
                </div>
                <div className={styles.serviceCardTopLine} data-no-navigate onClick={(e) => e.preventDefault()}>
                  <div className={styles.serviceCardLike}>
                    <FavoriteButton entityType="service" entityId={service.id} />
                  </div>
                </div>
                <div className={styles.serviceCardInfo}>
                  <div className={styles.serviceCardCategory}>{service.category || 'Услуга'}</div>
                  {hasReviews && (
                    <div className={styles.serviceCardRating}>
                      <div className={styles.serviceCardStars}>
                        <img src="/star.png" alt="" />
                        {displayRating}
                      </div>
                      <div className={styles.serviceCardFeedback}>
                        {formatReviews(service.reviewsCount ?? 0)}
                      </div>
                    </div>
                  )}
                  <div className={styles.serviceCardName}>{service.title}</div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </section>
  )
}
