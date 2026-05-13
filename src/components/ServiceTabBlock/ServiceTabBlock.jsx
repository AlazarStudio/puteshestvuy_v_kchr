

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './ServiceTabBlock.module.css'
import ServiceCardWithParallax from '@/components/ServiceCardWithParallax/ServiceCardWithParallax'
import { publicServicesAPI } from '@/lib/api'

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

const LABEL_TO_URL_FILTER = {
  'Гиды': 'guides',
  'Активности': 'activities',
  'Прокат оборудования': 'equipment-rental',
  'Пункты придорожного сервиса': 'roadside-service',
  'Торговые точки': 'shops',
  'Сувениры': 'souvenirs',
  'Гостиницы': 'hotels',
  'Кафе и рестораны': 'restaurants',
  'Трансфер': 'transfer',
  'АЗС': 'gas-stations',
  'Санитарные узлы': 'restrooms',
  'Пункты медпомощи': 'medical',
  'МВД': 'police',
  'Пожарная охрана': 'fire-department',
  'Музеи': 'museums',
}

const TAB_ORDER = [
  'Гиды',
  'Гостиницы',
  'Кафе и рестораны',
  'АЗС',
  'Музеи',
]

export default function ServiceTabBlock() {
  const [tabs, setTabs] = useState([])
  const [servicesByCategory, setServicesByCategory] = useState({})
  const [loading, setLoading] = useState(true)

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

          Object.keys(byCategory).forEach((cat) => {
            byCategory[cat].sort((a, b) => (b.uniqueViewsCount ?? 0) - (a.uniqueViewsCount ?? 0))
          })

          setServicesByCategory(byCategory)
          setTabs(TAB_ORDER.filter((label) => {
            const cat = FILTER_TO_CATEGORY[label]
            return cat && (byCategory[cat]?.length || 0) > 0
          }))
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

  if (loading || tabs.length === 0) return null

  return (
    <section className={styles.service}>
      {tabs.map((label) => {
        const category = FILTER_TO_CATEGORY[label]
        const items = (servicesByCategory[category] || []).slice(0, 4)
        if (!items.length) return null
        return (
          <div key={label} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitle}>{label}</h3>
              <Link to={`/services?filter=${LABEL_TO_URL_FILTER[label]}`} className={styles.categoryViewAll}>
                Смотреть все
              </Link>
            </div>
            <div className={styles.cards}>
              {items.map((service) => (
                <ServiceCardWithParallax
                  key={service.id}
                  service={service}
                  serviceUrl={`/services/${service.slug || service.id}`}
                  isArticle={false}
                  styles={styles}
                />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
