'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import styles from './RouteDetail.module.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation, Autoplay } from 'swiper/modules'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Link from 'next/link'

export default function RouteDetail({ routeId }) {
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Здесь будет загрузка данных маршрута по ID
    // Пока используем моковые данные
    const fetchRouteData = async () => {
      setLoading(true)
      // В будущем здесь будет API запрос: const data = await fetch(`/api/routes/${routeId}`)
      
      // Моковые данные для примера
      setTimeout(() => {
        setRouteData({
          id: routeId,
          title: 'На границе регионов: Кисловодск - Медовые водопады',
          description: 'Летом эти места обязательны к посещению, ведь с июня по сентябрь водопады достигают максимальной полноводности.',
          duration: '3ч 30м',
          length: '100 км',
          difficulty: 'Легкий',
          season: 'Лето',
          transport: 'Автомобиль',
          type: 'Природный туризм',
          places: [
            '01 Село Красный курган',
            '02 Село Учкекен',
            '03 Перевал Гум-баши',
            '04 Медовые водопады'
          ],
          images: [
            '/routeSlide1.png',
            '/routeSlide1.png'
          ]
        })
        setLoading(false)
      }, 500)
    }

    fetchRouteData()
  }, [routeId])

  if (loading) {
    return (
      <main className={styles.main}>
        <CenterBlock>
          <div className={styles.loading}>Загрузка...</div>
        </CenterBlock>
      </main>
    )
  }

  if (!routeData) {
    return (
      <main className={styles.main}>
        <CenterBlock>
          <div className={styles.error}>
            <h1>Маршрут не найден</h1>
            <Link href="/routes" className={styles.backLink}>
              Вернуться к списку маршрутов
            </Link>
          </div>
        </CenterBlock>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <CenterBlock>
        Страница маршрута
      </CenterBlock>
    </main>
  )
}
