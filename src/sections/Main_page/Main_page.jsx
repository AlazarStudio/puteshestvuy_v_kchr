'use client'

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
import { publicPlacesAPI, publicHomeAPI, getImageUrl } from '@/lib/api'

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatReviews(n) {
  if (n === 1) return '1 отзыв'
  if (n >= 2 && n <= 4) return `${n} отзыва`
  return `${n} отзывов`
}

const DEFAULT_HOME_CONTENT = {
  routesTitle: 'Маршруты',
  routesButtonLink: '/routes',
  seasons: [
    {
      title: 'Зима',
      bgColor: '#73BFE7',
      patternColor: '#296587',
      logo: 'logoPattern1.png',
      routeLink: '/routes?seasons=Зима',
    },
    {
      title: 'Весна',
      bgColor: '#FF9397',
      patternColor: '#DB224A',
      logo: 'logoPattern2.png',
      routeLink: '/routes?seasons=Весна',
    },
    {
      title: 'Лето',
      bgColor: '#66D7CA',
      patternColor: '#156A60',
      logo: 'logoPattern3.png',
      routeLink: '/routes?seasons=Лето',
    },
    {
      title: 'Осень',
      bgColor: '#CD8A67',
      patternColor: '#7C4B42',
      logo: 'logoPattern4.png',
      routeLink: '/routes?seasons=Осень',
    },
  ],
  firstTimeTitle: 'ВПЕРВЫЕ В КЧР?',
  firstTimeDesc: 'Специально для вас мы создали раздел, в котором собрали всю полезную информацию, чтобы помочь сделать ваше путешествие по нашей удивительной республике комфортным, интересным и незабываемым!',
  servicesTitle: 'СЕРВИС И УСЛУГИ',
  servicesButtonLink: '/services',
  servicesCardsLimit: 8,
  placesTitle: 'КУДА ПОЕХАТЬ?',
  placesButtonLink: '/places',
  backgroundImage: '/mountainBG.png',
  banners: [],
}

export default function Main_page() {
  const navigate = useNavigate()
  const [places, setPlaces] = useState([])
  const [placesLoading, setPlacesLoading] = useState(true)
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT)

  useEffect(() => {
    let cancelled = false
    publicHomeAPI.get()
      .then(({ data }) => {
        if (!cancelled && data) {
          setHomeContent({ ...DEFAULT_HOME_CONTENT, ...data })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHomeContent(DEFAULT_HOME_CONTENT)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setPlacesLoading(true)
    
    // Проверяем, есть ли выбранные места в настройках главной страницы
    const placesItems = homeContent.placesItems || []
    
    if (placesItems.length > 0) {
      // Загружаем полные данные мест по их ID, чтобы получить актуальные images[0]
      const placeIds = placesItems.map(p => p.placeId || p.id).filter(Boolean)
      if (placeIds.length > 0) {
        publicPlacesAPI.getAll({ limit: 500 })
          .then(({ data }) => {
            if (cancelled) return
            const allPlaces = data?.items || []
            const placesMap = new Map(allPlaces.map(p => [p.id, p]))
            
            // Используем выбранные места из настроек, но берем актуальные данные из API
            const list = placesItems
              .map((savedPlace) => {
                const placeId = savedPlace.placeId || savedPlace.id
                const fullPlace = placesMap.get(placeId)
                
                // Используем полные данные места, если они есть
                if (fullPlace) {
                  return fullPlace
                }
                
                // Если место не найдено в API, возвращаем null (будет отфильтровано)
                return null
              })
              .filter(Boolean)
            
            if (!cancelled) {
              setPlaces(list)
              setPlacesLoading(false)
            }
          })
          .catch(() => {
            if (!cancelled) {
              setPlaces([])
              setPlacesLoading(false)
            }
          })
        return
      }
    }
    
    // Если выбранных мест нет, загружаем из API
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
  }, [homeContent.placesItems])

  return (
    <main className={styles.main}>
      <SliderFullScreen />

      <div className={styles.content}>
        <CenterBlock>
          <TitleButton title={homeContent.routesTitle} buttonLink={homeContent.routesButtonLink} />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlock}>
            {homeContent.seasons.map((season, index) => (
              <RouteSeasoneBanner
                key={index}
                routeLink={season.routeLink}
                bgColor={season.bgColor}
                patternColor={season.patternColor}
                title={season.title}
                logo={season.logo}
              />
            ))}
          </section>
        </CenterBlock>

        {/* Баннеры */}
        {homeContent.banners && homeContent.banners.length > 0 && (() => {
          const activeBanners = homeContent.banners.filter((banner) => banner.isActive === true);
          if (activeBanners.length === 0) return null;
          
          return (
            <CenterBlock>
              <section style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 20,
                width: '100%',
                gridAutoRows: 'auto',
                alignItems: 'stretch',
              }}>
                {activeBanners.map((banner, index) => {
                  const isExternal = banner.link && (banner.link.startsWith('http://') || banner.link.startsWith('https://'));
                  // Логика размещения:
                  // - 1 баннер: на всю ширину
                  // - 2 баннера: оба рядом (каждый по 50%)
                  // - 3 баннера: первые два рядом, третий на всю ширину
                  // - 4 баннера: первые два рядом, третий и четвертый рядом
                  // Паттерн: пары баннеров рядом, если нечетное количество - последний на всю ширину
                  const totalBanners = activeBanners.length;
                  let isFullWidth = false;
                  
                  if (totalBanners === 1) {
                    // Один баннер - на всю ширину
                    isFullWidth = true;
                  } else {
                    // Определяем, в какой паре находится баннер
                    const pairIndex = Math.floor(index / 2);
                    const positionInPair = index % 2;
                    const isLastBanner = index === totalBanners - 1;
                    const isOddTotal = totalBanners % 2 === 1;
                    
                    if (isLastBanner && isOddTotal) {
                      // Последний баннер при нечетном количестве - на всю ширину
                      isFullWidth = true;
                    } else {
                      // Все остальные - рядом (по 50%)
                      isFullWidth = false;
                    }
                  }
                  
                  const bannerStyle = {
                    display: 'flex',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    gridColumn: isFullWidth ? '1 / -1' : 'auto',
                    width: '100%',
                  };
                  
                  const BannerComponent = isExternal ? 'a' : Link;
                  const bannerProps = isExternal
                    ? { href: banner.link, target: '_blank', rel: 'noopener noreferrer' }
                    : { to: banner.link || '#' };
                  
                  return (
                    <BannerComponent
                      key={banner.id || index}
                      {...bannerProps}
                      style={bannerStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <img
                        src={getImageUrl(banner.image) || '/placeholder.png'}
                        alt="Баннер"
                        style={{
                          width: '100%',
                          height: isFullWidth ? 'auto' : '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </BannerComponent>
                  );
                })}
              </section>
            </CenterBlock>
          );
        })()}

        <CenterBlock>
          <TitleButton
            title={homeContent.firstTimeTitle}
            desc={homeContent.firstTimeDesc}
          />
        </CenterBlock>

        <CenterBlock>
          <SwiperSliderMain />
        </CenterBlock>

        <NewsFullBlock />

        <CenterBlock>
          <TitleButton title={homeContent.servicesTitle} buttonLink={homeContent.servicesButtonLink} />
        </CenterBlock>

        <CenterBlock>
          <ServiceTabBlock />
        </CenterBlock>

        {/* Переделать */}
        <MoveLines />

        <CenterBlock>
          <TitleButton title={homeContent.placesTitle} buttonLink={homeContent.placesButtonLink} />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlock}>
            {placesLoading ? (
              <div className={`${styles.placesLoading} ${styles.placesLoadingFull}`}>Загрузка интересных мест...</div>
            ) : places.length === 0 ? null : (
              places.map((place) => (
                <PlaceBlock
                  key={place.id}
                  placeId={place.id}
                  rating={place.rating != null ? String(place.rating) : '—'}
                  feedback={formatReviews(place.reviewsCount ?? 0)}
                  reviewsCount={place.reviewsCount ?? 0}
                  place={place.location || '—'}
                  title={place.title}
                  desc={stripHtml(place.shortDescription || place.description || '')}
                  img={getImageUrl(place.images?.[0] || place.image) || '/placeImg1.png'}
                  onClick={() => navigate(`/places/${place.slug || place.id}`)}
                />
              ))
            )}
          </section>
        </CenterBlock>

        <div className={styles.imgBG}>
          <img src={getImageUrl(homeContent.backgroundImage) || '/mountainBG.png'} alt="" />
        </div>
      </div>
    </main>
  )
}
