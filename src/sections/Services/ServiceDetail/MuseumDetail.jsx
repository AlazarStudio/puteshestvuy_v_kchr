'use client'

import { useMemo } from 'react'
import GenericServiceDetail from './GenericServiceDetail'
import { buildGenericServiceConfig } from './buildGenericServiceConfig'

export default function MuseumDetail({ serviceSlug, serviceData }) {
  const config = useMemo(() => {
    const baseConfig = buildGenericServiceConfig(serviceData)

    return {
      ...baseConfig,
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
