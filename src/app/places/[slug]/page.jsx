'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Places_page from '@/sections/Places/Places_page'

export default function PlacePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug

  useEffect(() => {
    if (slug) {
      // Изменяем URL на /places с сохранением slug в истории
      // Модалка откроется автоматически через Places_page компонент
      window.history.replaceState({ place: slug }, '', `/places/${slug}`)
    }
  }, [slug])

  // Рендерим ту же страницу places, модалка откроется через логику в Places_page
  return <Places_page />
}
