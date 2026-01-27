'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Region_page.module.css'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Link from 'next/link'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'

const facts = [
  { number: '14 277', label: 'км²', description: 'Площадь региона' },
  { number: '466 000', label: 'чел.', description: 'Население' },
  { number: '80+', label: '', description: 'Народностей' },
  { number: '4 046', label: 'м', description: 'Высота Домбай-Ульген' },
]

const timelineData = [
  { year: 'V-IV тыс. до н.э.', title: 'Древние поселения', description: 'На территории современной КЧР появляются первые поселения. Археологические находки свидетельствуют о развитой культуре местных племён.' },
  { year: 'I-II век н.э.', title: 'Аланское царство', description: 'Формирование аланского государства. Аланы становятся одним из могущественных народов Северного Кавказа.' },
  { year: 'X-XIII век', title: 'Расцвет Алании', description: 'Период расцвета аланской культуры и государственности. Строительство храмов, развитие торговли по Великому Шёлковому пути.' },
  { year: '1828', title: 'Присоединение к России', description: 'Карачай добровольно входит в состав Российской империи, начинается новый этап развития региона.' },
  { year: '1922', title: 'Образование автономии', description: 'Создание Карачаево-Черкесской автономной области в составе РСФСР.' },
  { year: '1992', title: 'Современная республика', description: 'Карачаево-Черкесия получает статус республики в составе Российской Федерации.' },
]

const cultures = [
  {
    name: 'Карачаевцы',
    description: 'Тюркоязычный народ, потомки алан. Славятся горским гостеприимством, традиционным овцеводством и уникальной кухней.',
    traditions: ['Нальчикский танец', 'Кузнечное ремесло', 'Ковроткачество'],
  },
  {
    name: 'Черкесы',
    description: 'Адыгский народ с богатой воинской историей. Хранители древних традиций Кавказа и знаменитого адыгского этикета.',
    traditions: ['Адыгэ хабзэ', 'Златокузнечество', 'Джигитовка'],
  },
  {
    name: 'Абазины',
    description: 'Древний народ Кавказа, родственный абхазам. Сохранили уникальный язык и богатый фольклор.',
    traditions: ['Эпос о нартах', 'Горное земледелие', 'Народная медицина'],
  },
  {
    name: 'Ногайцы',
    description: 'Тюркский народ со степной культурой. Известны мастерством коневодства и богатой устной традицией.',
    traditions: ['Эпос «Эдиге»', 'Коневодство', 'Войлочное производство'],
  },
]

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    const numericValue = parseInt(target.replace(/\s/g, ''), 10)
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
  const [activeAnchor, setActiveAnchor] = useState('intro')

  const anchors = [
    { id: 'intro', label: 'О регионе' },
    { id: 'facts', label: 'Факты' },
    { id: 'history', label: 'История' },
    { id: 'nature', label: 'Природа' },
    { id: 'culture', label: 'Культура' },
    { id: 'places', label: 'Достопримечательности' },
  ]

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

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImg}>
          <img src="/full_roates_bg.jpg" alt="Карачаево-Черкесия" />
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            КАРАЧАЕВО-ЧЕРКЕСИЯ
          </motion.h1>
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Край величественных гор, древних традиций и гостеприимных народов
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link href="/routes" className={styles.heroButton}>
              Исследовать маршруты
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
          {/* Sidebar Navigation */}
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

          {/* Main Content */}
          <div className={styles.content}>
            {/* Intro Section */}
            <section id="intro" className={styles.section}>
              <h2 className={styles.sectionTitle}>Добро пожаловать в КЧР</h2>
              <div className={styles.introGrid}>
                <div className={styles.introText}>
                  <p>
                    Карачаево-Черкесская Республика — это уникальный регион на северных склонах 
                    Главного Кавказского хребта, где величественные горы встречаются с бескрайними 
                    альпийскими лугами, а древние традиции гармонично переплетаются с современностью.
                  </p>
                  <p>
                    Здесь расположены знаменитые курорты Домбай и Архыз, привлекающие туристов 
                    со всего мира. Уникальная природа региона включает заповедные леса, 
                    кристально чистые горные озёра и реки, питаемые ледниками.
                  </p>
                  <p>
                    Республика является домом для множества народов — карачаевцев, черкесов, 
                    абазин, ногайцев, русских и представителей других национальностей, 
                    создающих неповторимую культурную мозаику региона.
                  </p>
                </div>
                <div className={styles.introImage}>
                  <img src="/slider1.png" alt="Природа КЧР" />
                </div>
              </div>
            </section>

            {/* Facts Section */}
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

            {/* History Section */}
            <section id="history" className={styles.section}>
              <h2 className={styles.sectionTitle}>История региона</h2>
              <p className={styles.historyIntro}>
                История Карачаево-Черкесии насчитывает тысячелетия. Эта земля помнит 
                древние цивилизации, величие Аланского царства и становление современной республики.
              </p>
              <div className={styles.timeline}>
                {timelineData.map((item, index) => (
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
                      <p className={styles.timelineDescription}>{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Nature Section */}
            <section id="nature" className={styles.section}>
              <h2 className={styles.sectionTitle}>Природа и география</h2>
              <div className={styles.natureGrid}>
                <div className={styles.natureCard}>
                  <div className={styles.natureCardImg}>
                    <img src="/slider2.png" alt="Горы" />
                  </div>
                  <div className={styles.natureCardContent}>
                    <h3>Горные вершины</h3>
                    <p>
                      Главный Кавказский хребет с вершинами свыше 4000 метров. 
                      Домбай-Ульген (4046 м) — высочайшая точка региона. 
                      Идеальные условия для альпинизма и горнолыжного спорта.
                    </p>
                  </div>
                </div>
                <div className={styles.natureCard}>
                  <div className={styles.natureCardImg}>
                    <img src="/slider3.png" alt="Озёра" />
                  </div>
                  <div className={styles.natureCardContent}>
                    <h3>Горные озёра</h3>
                    <p>
                      Более 130 высокогорных озёр с кристально чистой водой. 
                      Озеро Туманлы-Кёль, Бадукские озёра, озеро Любви — 
                      жемчужины карачаево-черкесской природы.
                    </p>
                  </div>
                </div>
                <div className={styles.natureCard}>
                  <div className={styles.natureCardImg}>
                    <img src="/slider4.png" alt="Леса" />
                  </div>
                  <div className={styles.natureCardContent}>
                    <h3>Заповедные леса</h3>
                    <p>
                      Тебердинский государственный заповедник — один из старейших 
                      на Кавказе. Реликтовые леса, эндемичные виды растений 
                      и редкие животные.
                    </p>
                  </div>
                </div>
                <div className={styles.natureCard}>
                  <div className={styles.natureCardImg}>
                    <img src="/slider5.png" alt="Водопады" />
                  </div>
                  <div className={styles.natureCardContent}>
                    <h3>Водопады и реки</h3>
                    <p>
                      Живописные водопады Софийские, Алибекский, 
                      Чучхурский. Горные реки Теберда, Кубань, Большой Зеленчук 
                      берут начало от ледников.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Culture Section */}
            <section id="culture" className={styles.section}>
              <h2 className={styles.sectionTitle}>Народы и культура</h2>
              <p className={styles.cultureIntro}>
                Карачаево-Черкесия — многонациональная республика, где веками живут 
                в мире и согласии представители разных народов, каждый со своей 
                уникальной культурой, языком и традициями.
              </p>
              <div className={styles.culturesGrid}>
                {cultures.map((culture, index) => (
                  <motion.div 
                    key={index} 
                    className={styles.cultureCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h3 className={styles.cultureName}>{culture.name}</h3>
                    <p className={styles.cultureDescription}>{culture.description}</p>
                    <div className={styles.cultureTraditions}>
                      <span className={styles.traditionsLabel}>Традиции:</span>
                      <div className={styles.traditionsTags}>
                        {culture.traditions.map((tradition, i) => (
                          <span key={i} className={styles.traditionTag}>{tradition}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Places Section */}
            <section id="places" className={styles.section}>
              <h2 className={styles.sectionTitle}>Достопримечательности</h2>
              <div className={styles.placesGrid}>
                <PlaceBlock 
                  rating={"5.0"} 
                  feedback={"124 отзыва"} 
                  place={"Домбай"} 
                  title={"Горнолыжный курорт Домбай"} 
                  desc={"Один из старейших горнолыжных курортов России с живописными трассами и развитой инфраструктурой"} 
                  link={"/places/dombay"} 
                  img={'/slider1.png'} 
                />
                <PlaceBlock 
                  rating={"4.9"} 
                  feedback={"89 отзывов"} 
                  place={"Архыз"} 
                  title={"Курорт Архыз"} 
                  desc={"Современный всесезонный курорт с горнолыжными трассами, канатными дорогами и экотропами"} 
                  link={"/places/arkhyz"} 
                  img={'/slider2.png'} 
                />
                <PlaceBlock 
                  rating={"5.0"} 
                  feedback={"67 отзывов"} 
                  place={"Теберда"} 
                  title={"Тебердинский заповедник"} 
                  desc={"Биосферный заповедник с уникальной флорой и фауной, музеем природы и экологическими тропами"} 
                  link={"/places/teberda"} 
                  img={'/slider3.png'} 
                />
                <PlaceBlock 
                  rating={"4.8"} 
                  feedback={"45 отзывов"} 
                  place={"Нижний Архыз"} 
                  title={"Древние аланские храмы"} 
                  desc={"Комплекс средневековых христианских храмов X века — памятники аланской архитектуры"} 
                  link={"/places/alan-temples"} 
                  img={'/slider4.png'} 
                />
              </div>
              <div className={styles.placesMore}>
                <Link href="/places" className={styles.placesMoreButton}>
                  Смотреть все места
                </Link>
              </div>
            </section>
          </div>
        </div>
      </CenterBlock>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOverlay}></div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Готовы к путешествию?</h2>
          <p className={styles.ctaText}>
            Откройте для себя красоту Карачаево-Черкесии. Выберите маршрут и отправляйтесь в незабываемое приключение!
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/routes" className={styles.ctaButtonPrimary}>
              Выбрать маршрут
            </Link>
            <Link href="/services" className={styles.ctaButtonSecondary}>
              Найти гида
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
