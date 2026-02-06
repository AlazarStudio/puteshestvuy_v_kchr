'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Region_page.module.css'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import RichTextContent from '@/components/RichTextContent/RichTextContent'
import { publicRegionAPI, getImageUrl } from '@/lib/api'

const DEFAULT_CONTENT = {
  hero: {
    title: 'КАРАЧАЕВО-ЧЕРКЕСИЯ',
    subtitle: 'Край величественных гор, древних традиций и гостеприимных народов',
    image: '/full_roates_bg.jpg',
    buttonText: 'Исследовать маршруты',
    buttonLink: '/routes',
  },
  intro: {
    title: 'Добро пожаловать в КЧР',
    content: '<p>Карачаево-Черкесская Республика — это уникальный регион на северных склонах Главного Кавказского хребта, где величественные горы встречаются с бескрайними альпийскими лугами, а древние традиции гармонично переплетаются с современностью.</p><p>Здесь расположены знаменитые курорты Домбай и Архыз, привлекающие туристов со всего мира. Уникальная природа региона включает заповедные леса, кристально чистые горные озёра и реки, питаемые ледниками.</p><p>Республика является домом для множества народов — карачаевцев, черкесов, абазин, ногайцев, русских и представителей других национальностей, создающих неповторимую культурную мозаику региона.</p>',
    image: '/slider1.png',
  },
  facts: [
    { number: '14 277', label: 'км²', description: 'Площадь региона' },
    { number: '466 000', label: 'чел.', description: 'Население' },
    { number: '80+', label: '', description: 'Народностей' },
    { number: '4 046', label: 'м', description: 'Высота Домбай-Ульген' },
  ],
  history: {
    intro: 'История Карачаево-Черкесии насчитывает тысячелетия. Эта земля помнит древние цивилизации, величие Аланского царства и становление современной республики.',
    timeline: [
      { year: 'V-IV тыс. до н.э.', title: 'Древние поселения', description: 'На территории современной КЧР появляются первые поселения. Археологические находки свидетельствуют о развитой культуре местных племён.' },
      { year: 'I-II век н.э.', title: 'Аланское царство', description: 'Формирование аланского государства. Аланы становятся одним из могущественных народов Северного Кавказа.' },
      { year: 'X-XIII век', title: 'Расцвет Алании', description: 'Период расцвета аланской культуры и государственности. Строительство храмов, развитие торговли по Великому Шёлковому пути.' },
      { year: '1828', title: 'Присоединение к России', description: 'Карачай добровольно входит в состав Российской империи, начинается новый этап развития региона.' },
      { year: '1922', title: 'Образование автономии', description: 'Создание Карачаево-Черкесской автономной области в составе РСФСР.' },
      { year: '1992', title: 'Современная республика', description: 'Карачаево-Черкесия получает статус республики в составе Российской Федерации.' },
    ],
  },
  nature: {
    title: 'Природа и география',
    cards: [
      { title: 'Горные вершины', description: 'Главный Кавказский хребет с вершинами свыше 4000 метров. Домбай-Ульген (4046 м) — высочайшая точка региона. Идеальные условия для альпинизма и горнолыжного спорта.', image: '/slider2.png' },
      { title: 'Горные озёра', description: 'Более 130 высокогорных озёр с кристально чистой водой. Озеро Туманлы-Кёль, Бадукские озёра, озеро Любви — жемчужины карачаево-черкесской природы.', image: '/slider3.png' },
      { title: 'Заповедные леса', description: 'Тебердинский государственный заповедник — один из старейших на Кавказе. Реликтовые леса, эндемичные виды растений и редкие животные.', image: '/slider4.png' },
      { title: 'Водопады и реки', description: 'Живописные водопады Софийские, Алибекский, Чучхурский. Горные реки Теберда, Кубань, Большой Зеленчук берут начало от ледников.', image: '/slider5.png' },
    ],
  },
  culture: {
    title: 'Народы и культура',
    intro: 'Карачаево-Черкесия — многонациональная республика, где веками живут в мире и согласии представители разных народов, каждый со своей уникальной культурой, языком и традициями.',
    items: [
      { name: 'Карачаевцы', description: 'Тюркоязычный народ, потомки алан. Славятся горским гостеприимством, традиционным овцеводством и уникальной кухней.', traditions: ['Нальчикский танец', 'Кузнечное ремесло', 'Ковроткачество'] },
      { name: 'Черкесы', description: 'Адыгский народ с богатой воинской историей. Хранители древних традиций Кавказа и знаменитого адыгского этикета.', traditions: ['Адыгэ хабзэ', 'Златокузнечество', 'Джигитовка'] },
      { name: 'Абазины', description: 'Древний народ Кавказа, родственный абхазам. Сохранили уникальный язык и богатый фольклор.', traditions: ['Эпос о нартах', 'Горное земледелие', 'Народная медицина'] },
      { name: 'Ногайцы', description: 'Тюркский народ со степной культурой. Известны мастерством коневодства и богатой устной традицией.', traditions: ['Эпос «Эдиге»', 'Коневодство', 'Войлочное производство'] },
    ],
  },
  places: {
    title: 'Достопримечательности',
    items: [
      { place: 'Домбай', title: 'Горнолыжный курорт Домбай', desc: 'Один из старейших горнолыжных курортов России с живописными трассами и развитой инфраструктурой', link: '/places/dombay', img: '/slider1.png', rating: '5.0', feedback: '124 отзыва' },
      { place: 'Архыз', title: 'Курорт Архыз', desc: 'Современный всесезонный курорт с горнолыжными трассами, канатными дорогами и экотропами', link: '/places/arkhyz', img: '/slider2.png', rating: '4.9', feedback: '89 отзывов' },
      { place: 'Теберда', title: 'Тебердинский заповедник', desc: 'Биосферный заповедник с уникальной флорой и фауной, музеем природы и экологическими тропами', link: '/places/teberda', img: '/slider3.png', rating: '5.0', feedback: '67 отзывов' },
      { place: 'Нижний Архыз', title: 'Древние аланские храмы', desc: 'Комплекс средневековых христианских храмов X века — памятники аланской архитектуры', link: '/places/alan-temples', img: '/slider4.png', rating: '4.8', feedback: '45 отзывов' },
    ],
    moreButtonText: 'Смотреть все места',
    moreButtonLink: '/places',
  },
  cta: {
    title: 'Готовы к путешествию?',
    text: 'Откройте для себя красоту Карачаево-Черкесии. Выберите маршрут и отправляйтесь в незабываемое приключение!',
    primaryButtonText: 'Выбрать маршрут',
    primaryButtonLink: '/routes',
    secondaryButtonText: 'Найти гида',
    secondaryButtonLink: '/services',
  },
}

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    const numericValue = parseInt(String(target || '0').replace(/\s/g, ''), 10)
    if (!numericValue || isNaN(numericValue)) return

    const duration = 2000
    const steps = 60
    const increment = numericValue / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, target])

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  return (
    <span ref={ref}>
      {formatNumber(count)} {suffix && ` ${suffix}`}
    </span>
  )
}

export default function Region_page() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [isLoading, setIsLoading] = useState(true)
  const [activeAnchor, setActiveAnchor] = useState('intro')

  const anchors = [
    { id: 'intro', label: 'О регионе' },
    { id: 'facts', label: 'Факты' },
    { id: 'history', label: 'История' },
    { id: 'nature', label: 'Природа' },
    { id: 'culture', label: 'Культура' },
    { id: 'places', label: 'Достопримечательности' },
  ]

  useEffect(() => {
    let cancelled = false
    publicRegionAPI.get()
      .then((res) => {
        if (!cancelled && res.data) {
          const c = res.data
          setContent({
            hero: { ...DEFAULT_CONTENT.hero, ...c.hero },
            intro: (() => {
              const ci = c.intro || {};
              let content = ci.content;
              if ((!content || content === '') && Array.isArray(ci.paragraphs) && ci.paragraphs.some(Boolean)) {
                content = (ci.paragraphs || []).filter(Boolean).map((p) => `<p>${String(p).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
              }
              return {
                ...DEFAULT_CONTENT.intro,
                ...ci,
                title: ci.title ?? DEFAULT_CONTENT.intro.title,
                content: content ?? DEFAULT_CONTENT.intro.content,
              };
            })(),
            facts: Array.isArray(c.facts) && c.facts.length > 0 ? c.facts : DEFAULT_CONTENT.facts,
            history: { ...DEFAULT_CONTENT.history, ...c.history, timeline: Array.isArray(c.history?.timeline) && c.history.timeline.length > 0 ? c.history.timeline : DEFAULT_CONTENT.history.timeline },
            nature: { ...DEFAULT_CONTENT.nature, ...c.nature, cards: Array.isArray(c.nature?.cards) && c.nature.cards.length > 0 ? c.nature.cards : DEFAULT_CONTENT.nature.cards },
            culture: { ...DEFAULT_CONTENT.culture, ...c.culture, items: Array.isArray(c.culture?.items) && c.culture.items.length > 0 ? c.culture.items : DEFAULT_CONTENT.culture.items },
            places: { ...DEFAULT_CONTENT.places, ...c.places, items: Array.isArray(c.places?.items) && c.places.items.length > 0 ? c.places.items : DEFAULT_CONTENT.places.items },
            cta: { ...DEFAULT_CONTENT.cta, ...c.cta },
          })
        }
      })
      .catch(() => {
        if (!cancelled) setContent(DEFAULT_CONTENT)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const scrollToAnchor = (anchorId) => {
    const element = document.getElementById(anchorId)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150

      for (let i = anchors.length - 1; i >= 0; i--) {
        const element = document.getElementById(anchors[i].id)
        if (element) {
          const elementTop = element.offsetTop
          if (scrollPosition >= elementTop) {
            setActiveAnchor(anchors[i].id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <p>Загрузка...</p>
        </div>
      </main>
    )
  }

  const hero = content.hero || DEFAULT_CONTENT.hero
  const intro = content.intro || DEFAULT_CONTENT.intro
  const facts = content.facts || DEFAULT_CONTENT.facts
  const history = content.history || DEFAULT_CONTENT.history
  const nature = content.nature || DEFAULT_CONTENT.nature
  const culture = content.culture || DEFAULT_CONTENT.culture
  const places = content.places || DEFAULT_CONTENT.places
  const cta = content.cta || DEFAULT_CONTENT.cta

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImg}>
          <img src={getImageUrl(hero.image)} alt="Карачаево-Черкесия" />
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {hero.title}
          </motion.h1>
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {hero.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link to={hero.buttonLink || '/routes'} className={styles.heroButton}>
              {hero.buttonText}
            </Link>
          </motion.div>
        </div>
        <div className={styles.scrollIndicator}>
          <motion.div 
            className={styles.scrollIcon}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </div>
      </section>

      <CenterBlock>
        <div className={styles.pageContent}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSticky}>
              <div className={styles.anchorsList}>
                {anchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    className={`${styles.anchorItem} ${activeAnchor === anchor.id ? styles.anchorItemActive : ''}`}
                    onClick={() => scrollToAnchor(anchor.id)}
                  >
                    {anchor.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            {/* Intro */}
            <section id="intro" className={styles.section}>
              <h2 className={styles.sectionTitle}>{intro.title}</h2>
              <div className={styles.introGrid}>
                <div className={styles.introText}>
                  <RichTextContent html={intro.content} className={styles.introRichText} />
                </div>
                <div className={styles.introImage}>
                  <img src={getImageUrl(intro.image)} alt="Природа КЧР" />
                </div>
              </div>
            </section>

            {/* Facts */}
            {facts.length > 0 && (
              <section id="facts" className={styles.section}>
                <h2 className={styles.sectionTitle}>Карачаево-Черкесия в цифрах</h2>
                <div className={styles.factsGrid}>
                  {facts.map((fact, index) => (
                    <motion.div 
                      key={index} 
                      className={styles.factCard}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className={styles.factNumber}>
                        <AnimatedCounter target={fact.number} suffix={fact.label} />
                      </div>
                      <div className={styles.factDescription}>{fact.description}</div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* History */}
            <section id="history" className={styles.section}>
              <h2 className={styles.sectionTitle}>История региона</h2>
              {history.intro && <RichTextContent html={history.intro} className={styles.historyIntro} />}
              <div className={styles.timeline}>
                {(history.timeline || []).map((item, index) => (
                  <motion.div 
                    key={index} 
                    className={styles.timelineItem}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className={styles.timelineYear}>{item.year}</div>
                    <div className={styles.timelineContent}>
                      <h3 className={styles.timelineTitle}>{item.title}</h3>
                      {item.description && <RichTextContent html={item.description} className={styles.timelineDescription} />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Nature */}
            {(nature.cards || []).length > 0 && (
              <section id="nature" className={styles.section}>
                <h2 className={styles.sectionTitle}>{nature.title}</h2>
                <div className={styles.natureGrid}>
                  {nature.cards.map((card, index) => (
                    <div key={index} className={styles.natureCard}>
                      <div className={styles.natureCardImg}>
                        <img src={getImageUrl(card.image)} alt={card.title} />
                      </div>
                      <div className={styles.natureCardContent}>
                        <h3>{card.title}</h3>
                        {card.description && <RichTextContent html={card.description} className={styles.natureCardDesc} />}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Culture */}
            <section id="culture" className={styles.section}>
              <h2 className={styles.sectionTitle}>{culture.title}</h2>
              {culture.intro && <RichTextContent html={culture.intro} className={styles.cultureIntro} />}
              <div className={styles.culturesGrid}>
                {(culture.items || []).map((item, index) => (
                  <motion.div 
                    key={index} 
                    className={styles.cultureCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h3 className={styles.cultureName}>{item.name}</h3>
                    {item.description && <RichTextContent html={item.description} className={styles.cultureDescription} />}
                    {Array.isArray(item.traditions) && item.traditions.length > 0 && (
                      <div className={styles.cultureTraditions}>
                        <span className={styles.traditionsLabel}>Традиции:</span>
                        <div className={styles.traditionsTags}>
                          {item.traditions.map((t, i) => (
                            <span key={i} className={styles.traditionTag}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Places */}
            <section id="places" className={styles.section}>
              <h2 className={styles.sectionTitle}>{places.title}</h2>
              <div className={styles.placesGrid}>
                {(places.items || []).map((item, index) => (
                  <Link key={index} to={item.link || '/places'} className={styles.placeBlockLink}>
                    <PlaceBlock 
                      rating={item.rating || ''} 
                      feedback={item.feedback || ''} 
                      reviewsCount={item.reviewsCount ?? parseInt((item.feedback || '').match(/\d+/)?.[0] || '0', 10)}
                      place={item.place || ''} 
                      title={item.title || ''} 
                      desc={item.desc || ''} 
                      img={getImageUrl(item.img)} 
                    />
                  </Link>
                ))}
              </div>
              <div className={styles.placesMore}>
                <Link to={places.moreButtonLink || '/places'} className={styles.placesMoreButton}>
                  {places.moreButtonText}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </CenterBlock>

      {/* CTA */}
      <section
        className={styles.ctaSection}
        style={cta.image ? { backgroundImage: `url(${getImageUrl(cta.image)})` } : undefined}
      >
        <div className={styles.ctaOverlay}></div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>{cta.title}</h2>
          <p className={styles.ctaText}>{cta.text}</p>
          <div className={styles.ctaButtons}>
            <Link to={cta.primaryButtonLink || '/routes'} className={styles.ctaButtonPrimary}>
              {cta.primaryButtonText}
            </Link>
            <Link to={cta.secondaryButtonLink || '/services'} className={styles.ctaButtonSecondary}>
              {cta.secondaryButtonText}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
