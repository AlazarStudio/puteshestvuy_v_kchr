'use client'

import { useState, useEffect } from 'react'
import styles from './SliderFullScreen.module.css'

// Данные слайдов — вместо жёстко забитой верстки
const SLIDES = [
  {
    id: 1,
    image: '/slider1.png',
    place: 'Архыз',
    title: 'СОФИЙСКИЕ ОЗЕРА',
    topic: 'ANIMAL',
    rating: '4.8',
    description:
      'Ярко-голубая вода, в которой отражаются бегущие по небу облака и зеленая, сочная трава среди обломков камней – такие краски ожидают каждого, кто решится посетить Софийские озера в Архызе. Это место идеально подходит для незабываемых фотосессий. Да и душе есть, где разгуляться – посещение этого чуда природы наполняет грудь особым воздухом свободы, которого так не хватает в ежедневной рутине.',
  },
  {
    id: 2,
    image: '/slider2.png',
    place: '​Зеленчукский район',
    title: 'ЛЕДНИК АЛИБЕК',
    topic: 'ANIMAL',
    rating: '4.8',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur assumenda odio molestiae! Accusamus deserunt reiciendis quibusdam porro? Qui reiciendis ratione cum commodi quam sit quo hic, eos, perspiciatis dolorum libero.',
  },
  {
    id: 3,
    image: '/slider3.png',
    place: 'Малокарачаевский район',
    title: 'ПЛАТО БЕРМАМЫТ',
    topic: 'ANIMAL',
    rating: '4.8',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur assumenda odio molestiae! Accusamus deserunt reiciendis quibusdam porro? Qui reiciendis ratione cum commodi quam sit quo hic, eos, perspiciatis dolorum libero.',
  },
  {
    id: 4,
    image: '/slider4.png',
    place: '​с. Красный Курган, Малокарачаевский район',
    title: 'МЕДОВЫЕ ВОДОПАДЫ',
    topic: 'ANIMAL',
    rating: '4.8',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur assumenda odio molestiae! Accusamus deserunt reiciendis quibusdam porro? Qui reiciendis ratione cum commodi quam sit quo hic, eos, perspiciatis dolorum libero.',
  },
]

const TIME_RUNNING = 500

export default function SliderFullScreen() {
  // порядок элементов в основном списке/превью
  const [slides, setSlides] = useState(SLIDES)
  // направление анимации: 'next' | 'prev' | null — вместо add/remove className
  const [direction, setDirection] = useState(null)

  const handleNext = () => {
    setSlides((prev) => {
      const [first, ...rest] = prev
      return [...rest, first]
    })
    setDirection('next')
  }

  const handlePrev = () => {
    setSlides((prev) => {
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, prev.length - 1)
      return [last, ...rest]
    })
    setDirection('prev')
  }

  // Сбрасываем направление через TIME_RUNNING, чтобы анимационный класс убирался
  useEffect(() => {
    if (!direction) return
    const timeout = setTimeout(() => setDirection(null), TIME_RUNNING)
    return () => clearTimeout(timeout)
  }, [direction])

  // Отдельный список для thumbnail:
  // первый элемент основного списка показываем в конце,
  // чтобы в превью порядок был: [2, 3, 4, 1]
  const thumbnailSlides =
    slides.length > 0 ? [...slides.slice(1), slides[0]] : []

  const carouselClassNames = [
    styles.carousel,
    direction === 'next' ? styles.next : '',
    direction === 'prev' ? styles.prev : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Находим текущий слайд (первый в массиве slides) в исходном массиве SLIDES
  const currentSlideIndex = SLIDES.findIndex((slide) => slide.id === slides[0]?.id)
  const currentSlideNumber = currentSlideIndex >= 0 ? currentSlideIndex + 1 : 1
  const formattedSlideNumber = String(currentSlideNumber).padStart(2, '0')

  return (
    <section className={carouselClassNames}>
      {/* Основной список */}
      <div className={styles.list}>
        {slides.map((slide) => (
          <div key={slide.id} className={styles.item}>
            <div className={styles.image}>
              <img src={slide.image} alt={slide.title} />
            </div>
            <div className={styles.content}>
              <div className={styles.place}><img src="/place.png" alt="" />{slide.place}</div>
              <div className={styles.title}>{slide.title}</div>
              <div className={styles.topic}>
                <div className={styles.stars}>
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                  <img src="/star.png" alt="" />
                </div>
                <div className={styles.rating}>
                  {slide.rating}
                </div>
              </div>
              <div className={styles.des}>{slide.description}</div>
              <div className={styles.buttons}>
                <button>Начать путешествие</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Превью (thumbnail) */}
      <div className={styles.thumbnail}>
        {thumbnailSlides.map((slide) => (
          <div key={slide.id} className={styles.item}>
            <img src={slide.image} alt={slide.title} />
            <div className={styles.content}>
              <div className={styles.place}><img src="/place.png" alt="" />{slide.place}</div>
              <div className={styles.title}>{slide.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопки навигации */}
      <div className={styles.arrows}>
        <div className={styles.buttons}>
          <button onClick={handlePrev}>
            <img src="/slider-arrow-left.png" alt="Prev slide" />
          </button>
          <button onClick={handleNext}>
            <img src="/slider-arrow-right.png" alt="Next slide" />
          </button>
        </div>
        <div className={styles.line}>
          <div className={styles.time}></div>
        </div>
        <div className={styles.slidesNum}>{formattedSlideNumber}</div>
      </div>

      {/* Полоса времени/анимация — можно анимировать через CSS по классу .next/.prev */}

    </section>
  )
}
