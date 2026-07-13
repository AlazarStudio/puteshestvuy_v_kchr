

import { useState, useEffect } from 'react'
import { publicServicesAPI, getImageUrl } from '@/lib/api'
import { CATEGORY_TO_TEMPLATE_KEY, DEFAULT_TEMPLATE_KEY } from '@/sections/Services/ServiceDetail/serviceTypeTemplates'
import { buildGenericServiceConfig } from '@/sections/Services/ServiceDetail/buildGenericServiceConfig'
import ServiceDetail from '@/sections/Services/ServiceDetail/ServiceDetail'
import ActivityDetail from '@/sections/Services/ServiceDetail/ActivityDetail'
import EquipmentRentalDetail from '@/sections/Services/ServiceDetail/EquipmentRentalDetail'
import RoadsideServiceDetail from '@/sections/Services/ServiceDetail/RoadsideServiceDetail'
import MuseumDetail from '@/sections/Services/ServiceDetail/MuseumDetail'
import TICDetail from '@/sections/Services/ServiceDetail/TICDetail'
import GenericServiceDetail from '@/sections/Services/ServiceDetail/GenericServiceDetail'
import Seo from '@/components/Seo/Seo'
import { localBusiness, breadcrumbList } from '@/lib/seo/schema'
import { getServiceSeo } from '@/lib/seo/serviceSeo'
import { absoluteUrl, truncate } from '@/lib/seo/config'

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
        <Seo noindex title="Услуга — Путешествуй КЧР" />
        <p>Загрузка...</p>
      </main>
    )
  }

  if (error || !service) {
    return (
      <main style={{ padding: 88, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Seo noindex title="Услуга — Путешествуй КЧР" />
        <p>{error || 'Услуга не найдена'}</p>
      </main>
    )
  }

  const templateKey = CATEGORY_TO_TEMPLATE_KEY[service.category] || DEFAULT_TEMPLATE_KEY

  const { title: seoTitle, schemaType } = getServiceSeo(service.category, service.title)
  const seoDesc = truncate(service.description || service.data?.aboutContent, 160)
  const hasBusinessData = Boolean(service.address || service.phone || service.email || (service.latitude != null && service.longitude != null))

  const seo = (
    <Seo
      title={seoTitle}
      description={seoDesc}
      path={`/services/${service.slug}`}
      image={service.images?.[0] ? getImageUrl(service.images[0]) : undefined}
      jsonLd={[
        ...(hasBusinessData ? [localBusiness(schemaType, {
          name: service.title,
          description: seoDesc,
          url: absoluteUrl(`/services/${service.slug}`),
          image: service.images?.[0] ? getImageUrl(service.images[0]) : undefined,
          address: service.address || undefined,
          phone: service.phone || undefined,
          email: service.email || undefined,
          geo: (service.latitude != null && service.longitude != null) ? { lat: service.latitude, lng: service.longitude } : undefined,
        })] : []),
        breadcrumbList([
          { name: 'Главная', url: absoluteUrl('/') },
          { name: 'Услуги и сервисы', url: absoluteUrl('/services') },
          { name: service.title, url: absoluteUrl(`/services/${service.slug}`) },
        ]),
      ]}
    />
  )

  switch (templateKey) {
    case 'guide':
      return <>{seo}<ServiceDetail serviceSlug={slug} serviceData={service} /></>
    case 'activities':
      return <>{seo}<ActivityDetail serviceSlug={slug} serviceData={service} /></>
    case 'equipment-rental':
      return <>{seo}<EquipmentRentalDetail serviceSlug={slug} serviceData={service} /></>
    case 'roadside-service':
      return <>{seo}<RoadsideServiceDetail serviceSlug={slug} serviceData={service} /></>
    case 'museum':
      return <>{seo}<MuseumDetail serviceSlug={slug} serviceData={service} /></>
    case 'tic':
      return <>{seo}<TICDetail serviceSlug={slug} serviceData={service} /></>
    default:
      return (
        <>
          {seo}
          <GenericServiceDetail
            config={buildGenericServiceConfig(service)}
            serviceId={service.id}
            serviceSlug={slug}
          />
        </>
      )
  }
}
