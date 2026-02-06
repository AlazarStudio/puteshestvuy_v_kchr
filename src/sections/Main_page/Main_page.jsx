'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'
import TitleButton from '@/components/TitleButton/TitleButton'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RouteSeasoneBanner from '@/components/RouteSeasoneBanner/RouteSeasoneBanner'
import SwiperSliderMain from '@/components/SwiperSliderMain/SwiperSliderMain'
import NewsFullBlock from '@/components/NewsFullBlock/NewsFullBlock'
import ServiceTabBlock from '@/components/ServiceTabBlock/ServiceTabBlock'
import MoveLines from '@/components/MoveLines/MoveLines'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import { publicPlacesAPI, getImageUrl } from '@/lib/api'

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatReviews(n) {
  if (n === 1) return '1 отзыв'
  if (n >= 2 && n <= 4) return `${n} отзыва`
  return `${n} отзывов`
}

export default function Main_page() {
  const navigate = useNavigate()
  const [places, setPlaces] = useState([])
  const [placesLoading, setPlacesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setPlacesLoading(true)
    publicPlacesAPI.getAll({ limit: 4, page: 1 })
      .then(({ data }) => {
        if (!cancelled) {
          setPlaces(data?.items || [])
        }
      })
      .catch(() => {
        if (!cancelled) setPlaces([])
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <main className={styles.main}>
      <SliderFullScreen />

      <div className={styles.content}>
        <CenterBlock>
          <TitleButton title="Маршруты" buttonLink="/routes" />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlock}>
            <RouteSeasoneBanner showFrom={'left'} routeLink={'/routes?seasons=Зима'} bgColor={'#73BFE7'} patternColor={'#296587'} title={'Зима'} logo={'logoPattern1.png'} />
            <RouteSeasoneBanner showFrom={'right'} routeLink={'/routes?seasons=Весна'} bgColor={'#FF9397'} patternColor={'#DB224A'} title={'Весна'} logo={'logoPattern2.png'} />
            <RouteSeasoneBanner showFrom={'left'} routeLink={'/routes?seasons=Лето'} bgColor={'#66D7CA'} patternColor={'#156A60'} title={'Лето'} logo={'logoPattern3.png'} />
            <RouteSeasoneBanner showFrom={'right'} routeLink={'/routes?seasons=Осень'} bgColor={'#CD8A67'} patternColor={'#7C4B42'} title={'Осень'} logo={'logoPattern4.png'} />
          </section>
        </CenterBlock>

        <CenterBlock>
          <TitleButton
            title="ВПЕРВЫЕ В КЧР?"
            desc="Специально для вас мы создали раздел, в котором собрали всю полезную информацию, чтобы помочь сделать ваше путешествие по нашей удивительной республике комфортным, интересным и незабываемым!"
          />
        </CenterBlock>

        <CenterBlock>
          <SwiperSliderMain />
        </CenterBlock>

        <NewsFullBlock />

        <CenterBlock>
          <TitleButton title="СЕРВИС И УСЛУГИ" buttonLink="/services" />
        </CenterBlock>

        <CenterBlock>
          <ServiceTabBlock />
        </CenterBlock>

        {/* Переделать */}
        <MoveLines />

        <CenterBlock>
          <TitleButton title="КУДА ПОЕХАТЬ?" buttonLink="/places" />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlock}>
            {placesLoading ? (
              <div className={`${styles.placesLoading} ${styles.placesLoadingFull}`}>Загрузка интересных мест...</div>
            ) : places.length === 0 ? null : (
              places.map((place) => (
                <PlaceBlock
                  key={place.id}
                  rating={place.rating != null ? String(place.rating) : '—'}
                  feedback={formatReviews(place.reviewsCount ?? 0)}
                  reviewsCount={place.reviewsCount ?? 0}
                  place={place.location || '—'}
                  title={place.title}
                  desc={stripHtml(place.shortDescription || place.description || '')}
                  img={getImageUrl(place.image) || '/placeImg1.png'}
                  onClick={() => navigate(`/places/${place.slug || place.id}`)}
                />
              ))
            )}
          </section>
        </CenterBlock>

        <div className={styles.imgBG}>
          <img src="/mountainBG.png" alt="" />
        </div>
      </div>
    </main>
  )
}
