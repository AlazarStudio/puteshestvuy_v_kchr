'use client'

import { useMemo } from 'react'
import GenericServiceDetail from './GenericServiceDetail'
import { buildGenericServiceConfig } from './buildGenericServiceConfig'
import common from './ServiceDetailCommon.module.css'

export default function MuseumDetail({ serviceSlug, serviceData }) {
  const config = useMemo(() => {
    const baseConfig = buildGenericServiceConfig(serviceData)
    const d = serviceData?.data || {}
    
    // Добавляем специфичные для музея секции
    const sections = [...baseConfig.sections]
    
    // Экспозиции и выставки
    if (Array.isArray(d.exhibitionsList) && d.exhibitionsList.length > 0) {
      const exhibitions = d.exhibitionsList
        .filter((s) => String(s).trim())
        .map((s) => String(s).trim())
      if (exhibitions.length > 0) {
        sections.push({
          id: 'exhibitions',
          title: 'Экспозиции и выставки',
          content: (
            <ul className={common.bulletList}>
              {exhibitions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ),
        })
      }
    }
    
    // Коллекции
    if (Array.isArray(d.collectionsList) && d.collectionsList.length > 0) {
      const collections = d.collectionsList
        .filter((s) => String(s).trim())
        .map((s) => String(s).trim())
      if (collections.length > 0) {
        sections.push({
          id: 'collections',
          title: 'Коллекции',
          content: (
            <ul className={common.bulletList}>
              {collections.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ),
        })
      }
    }
    
    return {
      ...baseConfig,
      sections,
      breadcrumbTitle: baseConfig.serviceName || 'Музей',
      categoryLabel: 'Музей',
      reviewPlaceholder: 'Ваш отзыв о музее',
    }
  }, [serviceData])

  return (
    <GenericServiceDetail
      config={config}
      serviceId={serviceData?.id}
      serviceSlug={serviceSlug}
    />
  )
}
