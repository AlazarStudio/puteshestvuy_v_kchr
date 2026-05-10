'use client'

import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'
import TitleButton from '@/components/TitleButton/TitleButton'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RouteSeasoneBanner from '@/components/RouteSeasoneBanner/RouteSeasoneBanner'
import SwiperSliderMain from '@/components/SwiperSliderMain/SwiperSliderMain'
import FirstTimeTabs from '@/components/FirstTimeTabs/FirstTimeTabs'
import NewsFullBlock from '@/components/NewsFullBlock/NewsFullBlock'
import ServiceTabBlock from '@/components/ServiceTabBlock/ServiceTabBlock'
import MoveLines from '@/components/MoveLines/MoveLines'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import ParallaxImage from '@/components/ParallaxImage'
import { publicPlacesAPI, publicHomeAPI, getImageUrl } from '@/lib/api'
import { getMuiIconComponent } from '@/app/admin/components/WhatToBringIcons'

function getBtnPosition(pos) {
  switch (pos) {
    case 'top-left':      return { top: 24, left: 24 }
    case 'top-center':    return { top: 24, left: '50%', transform: 'translateX(-50%)' }
    case 'top-right':     return { top: 24, right: 24 }
    case 'middle-left':   return { top: '50%', left: 24, transform: 'translateY(-50%)' }
    case 'middle-center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    case 'middle-right':  return { top: '50%', right: 24, transform: 'translateY(-50%)' }
    case 'bottom-center': return { bottom: 24, left: '50%', transform: 'translateX(-50%)' }
    case 'bottom-right':  return { bottom: 24, right: 24 }
    default:              return { bottom: 24, left: 24 }
  }
}

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
  firstTimeTitle: 'Впервые в КЧР?',
  firstTimeDesc: 'Специально для вас нами собрана вся необходимая информация, чтобы знакомство с нашей удивительной республикой было легким, насыщенным и вдохновляющим, а путешествие по ней — комфортным, интересным и незабываемым.',
  firstTimeTabs: [],
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
  const location = useLocation()
  const [places, setPlaces] = useState([])
  const [placesLoading, setPlacesLoading] = useState(true)
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT)
  const [emergencyTabKey, setEmergencyTabKey] = useState(null)
  const [emergencyScrollId, setEmergencyScrollId] = useState(null)

  useEffect(() => {
    const section = location.state?.emergencySection
    if (section) {
      setEmergencyTabKey('emergency')
      setEmergencyScrollId(`emergency-${section}`)
    }
  }, [location.state])

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
        <div className={styles.firstTime} id="firstTime">
          <CenterBlock>
            <TitleButton
              title={homeContent.firstTimeTitle}
              desc={homeContent.firstTimeDesc}
            />
          </CenterBlock>
          <CenterBlock>
            <FirstTimeTabs
              tabs={(homeContent.firstTimeTabs || []).filter(t => t.type !== 'climate')}
              activeTabKey={emergencyTabKey}
              scrollToId={emergencyScrollId}
            />
          </CenterBlock>
        </div>

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
              }} 
              className={styles.mainBanner}>
                {activeBanners.map((banner, index) => {
                  const isExternal = banner.link && (banner.link.startsWith('http://') || banner.link.startsWith('https://'));
                  const btn1Link = banner.button1Link || banner.link;
                  const isBtn1External = btn1Link && (btn1Link.startsWith('http://') || btn1Link.startsWith('https://'));
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
                    display: 'block',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    gridColumn: isFullWidth ? '1 / -1' : 'auto',
                    width: '100%',
                    height: isFullWidth ? 'fit-content' : '300px', // Фиксированная высота для ParallaxImage
                  };

                  const hasButton = !!banner.buttonText;
                  const BannerComponent = !hasButton && banner.link ? (isExternal ? 'a' : Link) : 'div';
                  const bannerProps = !hasButton && banner.link
                    ? isExternal
                      ? { href: banner.link, target: '_blank', rel: 'noopener noreferrer' }
                      : { to: banner.link }
                    : {};

                  const BtnComponent = isBtn1External ? 'a' : Link;
                  const btnProps = isBtn1External
                    ? { href: btn1Link, target: '_blank', rel: 'noopener noreferrer' }
                    : { to: btn1Link || '#' };

                  const hasBtn2 = !!banner.button2Text;
                  const isBtn2External = banner.button2Link && (banner.button2Link.startsWith('http://') || banner.button2Link.startsWith('https://'));
                  const Btn2Component = isBtn2External ? 'a' : Link;
                  const btn2Props = isBtn2External
                    ? { href: banner.button2Link, target: '_blank', rel: 'noopener noreferrer' }
                    : { to: banner.button2Link || '#' };

                  return (
                    <BannerComponent
                      key={banner.id || index}
                      {...bannerProps}
                      style={bannerStyle}
                      className={hasButton ? styles.bannerWrap : undefined}
                    >
                      <ParallaxImage
                        src={getImageUrl(banner.image) || '/placeholder.png'}
                        alt="Баннер"
                        maxOffset={15}
                        scale={1.03}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '20px',
                        }}
                        imgStyle={{
                          objectFit: 'cover',
                        }}
                      />
                      {hasButton && banner.link && (
                        isExternal
                          ? <a href={banner.link} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label="Баннер" />
                          : <Link to={banner.link} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label="Баннер" />
                      )}
                      {hasButton && (() => {
                        const btn1Pos = banner.buttonPosition || 'bottom-left';
                        const btn2Pos = banner.button2Position || 'bottom-left';
                        const samePosition = hasBtn2 && btn1Pos === btn2Pos;

                        const Btn1 = (
                          <BtnComponent
                            {...btnProps}
                            className={styles.bannerBtn}
                            style={{
                              background: banner.buttonBgColor || undefined,
                              color: banner.buttonTextColor || undefined,
                              borderRadius: banner.buttonBorderRadius != null ? `${banner.buttonBorderRadius}px` : undefined,
                            }}
                          >
                            {banner.buttonIconName && (() => { const IC = getMuiIconComponent(banner.buttonIconName); return IC ? <IC size={18} style={{ flexShrink: 0 }} /> : null; })()}
                            {!banner.buttonIconName && banner.buttonIcon && (
                              <img src={getImageUrl(banner.buttonIcon)} alt="" style={{ height: '1.2em', objectFit: 'contain', flexShrink: 0 }} />
                            )}
                            {banner.buttonText}
                          </BtnComponent>
                        );

                        const Btn2 = hasBtn2 ? (
                          <Btn2Component
                            {...btn2Props}
                            className={styles.bannerBtn}
                            style={{
                              background: banner.button2BgColor || undefined,
                              color: banner.button2TextColor || undefined,
                              borderRadius: banner.button2BorderRadius != null ? `${banner.button2BorderRadius}px` : undefined,
                            }}
                          >
                            {banner.button2IconName && (() => { const IC = getMuiIconComponent(banner.button2IconName); return IC ? <IC size={18} style={{ flexShrink: 0 }} /> : null; })()}
                            {!banner.button2IconName && banner.button2Icon && (
                              <img src={getImageUrl(banner.button2Icon)} alt="" style={{ height: '1.2em', objectFit: 'contain', flexShrink: 0 }} />
                            )}
                            {banner.button2Text}
                          </Btn2Component>
                        ) : null;

                        if (samePosition) {
                          return (
                            <div className={styles.bannerBtns} style={getBtnPosition(btn1Pos)}>
                              {Btn1}
                              {Btn2}
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className={styles.bannerBtns} style={getBtnPosition(btn1Pos)}>
                              {Btn1}
                            </div>
                            {hasBtn2 && (
                              <div className={styles.bannerBtns} style={getBtnPosition(btn2Pos)}>
                                {Btn2}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </BannerComponent>
                  );
                })}
              </section>
            </CenterBlock>
          );
        })()}

        <NewsFullBlock />

        <CenterBlock>
          <TitleButton title={homeContent.servicesTitle} buttonLink={homeContent.servicesButtonLink} />
        </CenterBlock>

        <CenterBlock>
          <ServiceTabBlock />
        </CenterBlock>

        <MoveLines />

        <CenterBlock>
          <TitleButton title={homeContent.placesTitle} buttonLink={homeContent.placesButtonLink} />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlockPlaces}>
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

        <CenterBlock>
          <SwiperSliderMain />
        </CenterBlock>

        <div className={styles.imgBG}>
          <img src={getImageUrl(homeContent.backgroundImage) || '/mountainBG.png'} alt="" />
        </div>
      </div>
    </main>
  )
}
