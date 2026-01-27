'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './NewsDetail.module.css'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Link from 'next/link'

// Моковые данные для популярных новостей
const popularNews = [
  {
    id: 2,
    title: 'Советы от местных: Хычины - вкусный символ Карачаево-Черкесии',
    date: '12.01.2026',
    image: '/new2.png'
  },
  {
    id: 3,
    title: 'Вкусный Домбай: сувениры, которые продлят впечатление от отдыха',
    date: '10.01.2026',
    image: '/new1.png'
  },
  {
    id: 4,
    title: 'Открытие нового маршрута к водопадам Софийской долины',
    date: '08.01.2026',
    image: '/new2.png'
  }
]

// Секции статьи для навигации
const sections = [
  { id: 'intro', title: 'О проекте' },
  { id: 'history', title: 'Задача: построить то, чего ещё не строили' },
  { id: 'could-be', title: 'Он мог бы стать лучшим советским отелем' },
  { id: 'legend', title: 'Легенда советской архитектуры — всё!' },
  { id: 'future', title: 'Новому отелю Домбая быть!' }
]

export default function NewsDetail({ slug }) {
  const [activeSection, setActiveSection] = useState('intro')
  const contentRef = useRef(null)

  // Моковые данные новости
  const news = {
    title: 'АМАНАУЗ ОТ ГОСТИНИЦЫ-ПРИЗРАКА ДО ОТЕЛЯ ПЯТИЗВЁЗДОЧНИКА',
    date: '15 января 2026',
    tag: 'новости',
    image: '/new_openBG.png',
    author: 'Редакция'
  }

  // Отслеживание активной секции при скролле
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => document.getElementById(s.id))
      
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section) {
          const rect = section.getBoundingClientRect()
          if (rect.top <= 150) {
            setActiveSection(sections[i].id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  return (
    <main className={styles.main}>
      {/* Главное изображение */}
      <div className={styles.heroImage}>
        <img src={news.image} alt={news.title} />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <CenterBlock>
            <div className={styles.heroText}>
              <div className={styles.tagDate}>
                <div className={styles.tag}>{news.tag}</div>
                <div className={styles.date}>{news.date}</div>
              </div>
              <h1 className={styles.heroTitle}>{news.title}</h1>
            </div>
          </CenterBlock>
        </div>
      </div>

      {/* Контент статьи */}
      <div className={styles.content}>
        <CenterBlock>
          {/* Хлебные крошки */}
          <div className={styles.breadCrumbs}>
            <Link href="/">Главная</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link href="/news">Новости</Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{news.title.charAt(0).toUpperCase() + news.title.slice(1).toLowerCase()}</span>
          </div>

          <div className={styles.contentWrapper}>
            {/* Основной контент */}
            <article className={styles.article} ref={contentRef}>
              
              {/* Секция: О проекте */}
              <section id="intro" className={styles.section}>
                <h2 className={styles.sectionTitle}>О проекте</h2>
                <p>
                  Среди снежных вершин Домбая, окутанный легендами и тайнами, возвышается заброшенный отель «Аманауз». 
                  Этот величественный, но печально известный объект стал символом амбициозных планов и нереализованных мечтаний советской эпохи.
                </p>
                <p>
                  История «Аманауза» — это рассказ о грандиозном проекте, который так и не был завершен, 
                  оставив после себя лишь бетонный скелет, ставший местом притяжения для любителей заброшенных мест и урбанистов.
                </p>
              </section>

              {/* Секция: Задача */}
              <section id="history" className={styles.section}>
                <h2 className={styles.sectionTitle}>Задача: построить то, чего ещё не строили</h2>
                <div className={styles.imageBlock}>
                  <img src="/new1.png" alt="Строительство отеля" />
                </div>
                <p>
                  В 1980-х годах советские архитекторы получили амбициозную задачу — создать уникальный 
                  высокогорный отель, который стал бы жемчужиной курорта Домбай. Проект предполагал 
                  строительство 18-этажного здания с панорамными видами на горные вершины.
                </p>
                <p>
                  Архитекторы вдохновлялись альпийскими курортами, но стремились создать что-то принципиально новое — 
                  отель, который органично впишется в горный ландшафт и станет архитектурной доминантой региона.
                </p>
              </section>

              {/* Секция: Лучший отель */}
              <section id="could-be" className={styles.section}>
                <h2 className={styles.sectionTitle}>Он мог бы стать лучшим советским отелем</h2>
                <p>
                  Проект предусматривал 200 номеров различных категорий, ресторан на верхнем этаже с круговым 
                  обзором, спа-комплекс, конференц-залы и собственную канатную дорогу. По тем временам это 
                  был революционный проект.
                </p>
                <div className={styles.imageBlock}>
                  <img src="/new2.png" alt="Проект отеля" />
                </div>
                <p>
                  Интерьеры планировалось оформить в современном стиле с использованием натуральных 
                  материалов — дерева и камня. Каждый номер должен был иметь балкон с видом на горы.
                </p>
              </section>

              {/* Секция: Легенда */}
              <section id="legend" className={styles.section}>
                <h2 className={styles.sectionTitle}>Легенда советской архитектуры — всё!</h2>
                <p>
                  К сожалению, распад Советского Союза поставил крест на этом амбициозном проекте. 
                  Строительство было заморожено на стадии возведения каркаса здания. 
                  С тех пор отель стоит заброшенным, медленно разрушаясь под воздействием времени и суровых горных условий.
                </p>
                <div className={styles.imageBlock}>
                  <img src="/new1.png" alt="Заброшенный отель" />
                </div>
                <p>
                  Сегодня «Аманауз» стал культовым местом для любителей урбанистики и заброшенных объектов. 
                  Его часто называют «призраком Домбая» — величественным напоминанием о несбывшихся мечтах.
                </p>
              </section>

              {/* Секция: Будущее */}
              <section id="future" className={styles.section}>
                <h2 className={styles.sectionTitle}>Новому отелю Домбая быть!</h2>
                <p>
                  В 2024 году власти Карачаево-Черкесии объявили о планах по восстановлению отеля. 
                  Инвесторы готовы вложить значительные средства в реконструкцию здания и превращение 
                  его в современный пятизвёздочный отель.
                </p>
                <div className={styles.quoteBlock}>
                  <p>«Мы хотим сохранить уникальную архитектуру здания, но при этом оснастить его 
                  всеми современными удобствами. Это будет отель мирового уровня»</p>
                  <span>— представитель инвестора</span>
                </div>
                <p>
                  Планируется, что обновлённый «Аманауз» откроет свои двери для гостей уже в 2027 году, 
                  став флагманским отелем курорта Домбай.
                </p>
              </section>

              {/* Поделиться */}
              <div className={styles.share}>
                <span className={styles.shareLabel}>Поделиться:</span>
                <div className={styles.shareButtons}>
                  <button className={styles.shareButton}>
                    <img src="/vk.png" alt="VK" />
                  </button>
                  <button className={styles.shareButton}>
                    <img src="/tg.png" alt="Telegram" />
                  </button>
                </div>
              </div>
            </article>

            {/* Боковая навигация */}
            <aside className={styles.sidebar}>
              <nav className={styles.tableOfContents}>
                {sections.map(section => (
                  <button
                    key={section.id}
                    className={`${styles.tocItem} ${activeSection === section.id ? styles.tocItemActive : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        </CenterBlock>
      </div>

      {/* Популярные новости */}
      <div className={styles.popularSection}>
        <CenterBlock>
          <h2 className={styles.popularTitle}>Популярные новости</h2>
          <div className={styles.popularGrid}>
            {popularNews.map(item => (
              <Link href={`/news/${item.id}`} key={item.id} className={styles.popularCard}>
                <div className={styles.popularImage}>
                  <img src={item.image} alt={item.title} />
                </div>
                <div className={styles.popularInfo}>
                  <div className={styles.popularDate}>{item.date}</div>
                  <div className={styles.popularCardTitle}>{item.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </CenterBlock>
      </div>
    </main>
  )
}
