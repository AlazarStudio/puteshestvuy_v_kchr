'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './ServiceTabBlock.module.css'
import ServiceCard from '../ServiceCard/ServiceCard'
import { publicServicesAPI, getImageUrl } from '@/lib/api'

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
  'Пункты медпомощи',
  'МВД',
  'Пожарная охрана',
]

const CARDS_PER_TAB = 8

export default function ServiceTabBlock() {
  const [tabs, setTabs] = useState([])
  const [activeTab, setActiveTab] = useState(null)
  const [servicesByCategory, setServicesByCategory] = useState({})
  const [loading, setLoading] = useState(true)

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
    ? (servicesByCategory[FILTER_TO_CATEGORY[activeTab]] || []).slice(0, CARDS_PER_TAB)
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
          services.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.slug || service.id}`}
              className={styles.cardLink}
            >
              <ServiceCard
                img={getImageUrl(service.image || service.images?.[0]) || '/serviceImg1.png'}
                name={service.title}
                rating={service.rating ?? '—'}
                reviewsCount={service.reviewsCount ?? 0}
                isVerified={service.isVerified}
              />
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
