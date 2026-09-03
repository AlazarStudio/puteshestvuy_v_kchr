

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'
import TitleButton from '@/components/TitleButton/TitleButton'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RouteSeasoneBanner from '@/components/RouteSeasoneBanner/RouteSeasoneBanner'
import SwiperSliderMain from '@/components/SwiperSliderMain/SwiperSliderMain'
import FirstTimeTabs from '@/components/FirstTimeTabs/FirstTimeTabs'
import NewsFullBlock from '@/components/NewsFullBlock/NewsFullBlock'
import ServiceTabBlock from '@/components/ServiceTabBlock/ServiceTabBlock'
import EventBlock from '@/components/EventBlock/EventBlock'
import SuggestEventModal from '@/components/SuggestEventModal/SuggestEventModal'
import MoveLines from '@/components/MoveLines/MoveLines'
import ParallaxImage from '@/components/ParallaxImage'
import CtaSection from '@/components/CtaSection/CtaSection'
import AppImage from '@/components/ui/AppImage'
import { publicHomeAPI, publicEventsAPI, getImageUrl } from '@/lib/api'
import DynamicIcon from '@/components/ui/DynamicIcon'
import Seo from '@/components/Seo/Seo'
import { touristDestination } from '@/lib/seo/schema'
import { absoluteUrl } from '@/lib/seo/config'

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
  servicesTitle: 'УСЛУГИ И СЕРВИСЫ',
  servicesButtonLink: '/services',
  servicesCardsLimit: 8,
  backgroundImage: '/mountainBG.png',
  banners: [],
}

export default function Main_page() {
  const location = useLocation()
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT)
  const [newsTab, setNewsTab] = useState('news')
  const [events, setEvents] = useState([])
  const [eventsTab, setEventsTab] = useState('upcoming')
  // Первая выборка завершена: до неё блок не показываем, чтобы он не мигал
  const [eventsResolved, setEventsResolved] = useState(false)
  // null — ещё не спрашивали (активная вкладка непустая, спрашивать незачем)
  const [hasOtherTabEvents, setHasOtherTabEvents] = useState(null)
  const [emergencyTabKey, setEmergencyTabKey] = useState(null)
  const [emergencyScrollId, setEmergencyScrollId] = useState(null)
  const [suggestEventOpen, setSuggestEventOpen] = useState(false)

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

  const isPastEvents = eventsTab === 'past'

  useEffect(() => {
    let cancelled = false
    setHasOtherTabEvents(null)
    publicEventsAPI.getAll({ page: 1, limit: 4, ...(isPastEvents ? { when: 'past' } : {}) })
      .then(({ data }) => {
        if (cancelled) return null
        const items = data?.items || []
        setEvents(items)
        if (items.length > 0) return null
        // Активная вкладка пуста — дёшево проверяем вторую: если события есть там,
        // блок остаётся на месте, у него есть переключатель
        return publicEventsAPI
          .getAll({ page: 1, limit: 1, ...(isPastEvents ? {} : { when: 'past' }) })
          .then(({ data: other }) => {
            if (!cancelled) setHasOtherTabEvents((other?.items || []).length > 0)
          })
      })
      // Список чистим: иначе после ошибки на экране останутся события другой вкладки
      .catch(() => {
        if (!cancelled) {
          setEvents([])
          setHasOtherTabEvents(false)
        }
      })
      .finally(() => {
        if (!cancelled) setEventsResolved(true)
      })
    return () => { cancelled = true }
  }, [isPastEvents])

  // Блок афиши скрываем целиком, только когда событий нет ни в одной вкладке
  const showEvents = eventsResolved && (events.length > 0 || hasOtherTabEvents === true)

  return (
    <main className={styles.main}>
      <Seo
        title="Путешествуй КЧР — путеводитель по Карачаево-Черкесии"
        description="Интересные места, маршруты, достопримечательности, услуги и идеи для путешествий по Карачаево-Черкесии."
        path="/"
        jsonLd={[touristDestination({
          name: 'Карачаево-Черкесская Республика',
          description: 'Интересные места, маршруты, достопримечательности и услуги для путешествий по Карачаево-Черкесии.',
          url: absoluteUrl('/'),
          image: absoluteUrl('/color_logo.png'),
        })]}
      />
      <SliderFullScreen heading="Карачаево-Черкесская Республика" />

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
                        alt={banner.alt || banner.title || banner.buttonText || 'Баннер Путешествуй КЧР'}
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
                            {banner.buttonIconName && <DynamicIcon name={banner.buttonIconName} size={18} style={{ flexShrink: 0 }} />}
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
                            {banner.button2IconName && <DynamicIcon name={banner.button2IconName} size={18} style={{ flexShrink: 0 }} />}
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

        {showEvents && (
          <>
            <CenterBlock>
              <TitleButton title="Афиша событий" buttonLink={isPastEvents ? '/events?when=past' : '/events'} />
            </CenterBlock>

            <CenterBlock>
              <div className={styles.sectionTabs}>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${!isPastEvents ? styles.sectionTabActive : ''}`}
                  onClick={() => setEventsTab('upcoming')}
                >
                  Ближайшие
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${isPastEvents ? styles.sectionTabActive : ''}`}
                  onClick={() => setEventsTab('past')}
                >
                  Прошедшие
                </button>
              </div>
            </CenterBlock>

            {events.length > 0 ? (
              <CenterBlock>
                <section className={styles.flexBlock}>
                  {events.map((event) => (
                    <EventBlock key={event.id} event={event} />
                  ))}
                </section>
              </CenterBlock>
            ) : (
              <CenterBlock>
                <div className={styles.eventsEmpty}>
                  <p>{isPastEvents ? 'Прошедших событий пока нет' : 'В ближайшее время событий не запланировано'}</p>
                  {!isPastEvents && (
                    <button type="button" onClick={() => setSuggestEventOpen(true)}>
                      Предложить событие
                    </button>
                  )}
                </div>
              </CenterBlock>
            )}
          </>
        )}

        <section className={styles.servicesBand}>
          <div className={styles.servicesHead}>
            <CenterBlock>
              <TitleButton title={homeContent.servicesTitle} buttonLink={homeContent.servicesButtonLink} />
            </CenterBlock>
          </div>

          <ServiceTabBlock />
        </section>

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
          <TitleButton title="Новости и статьи" buttonLink="/news" />
        </CenterBlock>

        <CenterBlock>
          <div className={styles.sectionTabs}>
            <button
              type="button"
              className={`${styles.sectionTab} ${newsTab === 'news' ? styles.sectionTabActive : ''}`}
              onClick={() => setNewsTab('news')}
            >
              Новости
            </button>
            <button
              type="button"
              className={`${styles.sectionTab} ${newsTab === 'article' ? styles.sectionTabActive : ''}`}
              onClick={() => setNewsTab('article')}
            >
              Статьи
            </button>
          </div>
        </CenterBlock>

        {newsTab === 'news' ? (
          <NewsFullBlock />
        ) : (
          <CenterBlock>
            <SwiperSliderMain />
          </CenterBlock>
        )}

        <MoveLines />

        <div className={styles.imgBG}>
          <AppImage src={homeContent.backgroundImage} alt="" variant="cover" />
          <CtaSection
            title="Начните своё путешествие"
            text="Карачаево-Черкесия ждёт вас — горы, ущелья, водопады и гостеприимные люди. Узнайте больше о регионе, выберите интересные места и спланируйте свои маршруты."
            primaryButtonText="Начать знакомство"
            primaryButtonLink="/region"
          />
        </div>
      </div>

      <SuggestEventModal isOpen={suggestEventOpen} onClose={() => setSuggestEventOpen(false)} />
    </main>
  )
}
