'use client'

import { useState, useEffect } from 'react'
import { publicServicesAPI } from '@/lib/api'
import { CATEGORY_TO_TEMPLATE_KEY, DEFAULT_TEMPLATE_KEY } from '@/sections/Services/ServiceDetail/serviceTypeTemplates'
import { buildGenericServiceConfig } from '@/sections/Services/ServiceDetail/buildGenericServiceConfig'
import ServiceDetail from '@/sections/Services/ServiceDetail/ServiceDetail'
import ActivityDetail from '@/sections/Services/ServiceDetail/ActivityDetail'
import EquipmentRentalDetail from '@/sections/Services/ServiceDetail/EquipmentRentalDetail'
import RoadsideServiceDetail from '@/sections/Services/ServiceDetail/RoadsideServiceDetail'
import GenericServiceDetail from '@/sections/Services/ServiceDetail/GenericServiceDetail'

export default function ServicePageContent({ slug }) {
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setError('Не указан адрес услуги')
      return
    }
    setLoading(true)
    setError(null)
    publicServicesAPI
      .getByIdOrSlug(slug)
      .then((res) => {
        setService(res.data)
        setError(null)
      })
      .catch((err) => {
        setService(null)
        setError(err?.response?.status === 404 ? 'Услуга не найдена' : 'Не удалось загрузить услугу')
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <main style={{ padding: 88, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Загрузка...</p>
      </main>
    )
  }

  if (error || !service) {
    return (
      <main style={{ padding: 88, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>{error || 'Услуга не найдена'}</p>
      </main>
    )
  }

  const templateKey = CATEGORY_TO_TEMPLATE_KEY[service.category] || DEFAULT_TEMPLATE_KEY

  switch (templateKey) {
    case 'guide':
      return <ServiceDetail serviceSlug={slug} serviceData={service} />
    case 'activities':
      return <ActivityDetail serviceSlug={slug} serviceData={service} />
    case 'equipment-rental':
      return <EquipmentRentalDetail serviceSlug={slug} serviceData={service} />
    case 'roadside-service':
      return <RoadsideServiceDetail serviceSlug={slug} serviceData={service} />
    default:
      return (
        <GenericServiceDetail
          config={buildGenericServiceConfig(service)}
          serviceId={service.id}
          serviceSlug={slug}
        />
      )
  }
}
