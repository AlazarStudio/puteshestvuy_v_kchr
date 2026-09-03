

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './ServiceTabBlock.module.css'
import ServiceCardWithParallax from '@/components/ServiceCardWithParallax/ServiceCardWithParallax'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
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
  'МЧС': 'МЧС',
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
  'МЧС': 'fire-department',
  'Музеи': 'museums',
}

const TAB_ORDER = [
  'Гиды',
  'Гостиницы',
  'Кафе и рестораны',
  'АЗС',
  'Музеи',
]

// Сколько карточек показываем в каждой категории
const CARDS_PER_TAB = 4

export default function ServiceTabBlock() {
  const [tabs, setTabs] = useState([])
  const [servicesByLabel, setServicesByLabel] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // По запросу на категорию: фильтрация и сортировка по популярности — на сервере,
    // забираем ровно те карточки, которые показываем
    Promise.all(
      TAB_ORDER.map((label) =>
        publicServicesAPI
          .getAll({
            category: FILTER_TO_CATEGORY[label],
            sortBy: 'popularity',
            limit: CARDS_PER_TAB,
          })
          .then(({ data }) => data?.items || [])
          .catch(() => [])
      )
    )
      .then((results) => {
        if (cancelled) return
        const byLabel = {}
        TAB_ORDER.forEach((label, index) => {
          byLabel[label] = results[index]
        })
        setServicesByLabel(byLabel)
        setTabs(TAB_ORDER.filter((label) => byLabel[label].length > 0))
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
        const items = servicesByLabel[label] || []
        if (!items.length) return null
        return (
          <div key={label} className={styles.categorySection}>
            <CenterBlock>
              <div className={styles.categoryInner}>
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
            </CenterBlock>
          </div>
        )
      })}
    </section>
  )
}
