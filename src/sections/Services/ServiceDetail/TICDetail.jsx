import { useMemo } from 'react'
import GenericServiceDetail from './GenericServiceDetail'
import { buildGenericServiceConfig } from './buildGenericServiceConfig'

export default function TICDetail({ serviceSlug, serviceData }) {
  const config = useMemo(() => {
    const baseConfig = buildGenericServiceConfig(serviceData)
    return {
      ...baseConfig,
      breadcrumbTitle: baseConfig.serviceName || 'ТИЦ',
      categoryLabel: 'ТИЦ',
      aboutTitle: baseConfig.aboutContent ? 'О центре' : '',
      reviewPlaceholder: 'Ваш отзыв',
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
