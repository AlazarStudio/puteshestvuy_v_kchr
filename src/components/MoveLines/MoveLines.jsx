'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'
import styles from './MoveLines.module.css'

import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';


// import required modules
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

const BASE_TOUR_TYPES_1 = [
  'Водный туризм',
  'Культурно-позновательный туризм',
  'Гастрономический туризм',
  'Лечебно-оздоровительный туризм',
  'Природный туризм',
  'Рыболовно-охотничий туризм',
]

const BASE_TOUR_TYPES_2 = [
  'Отдых у воды',
  'Палаточный лагерь',
  'Кемпинги и глэмпинги',
  'Семейный отдых',
  'Сельский туризм',
  'Отдых с детьми',
  'Активный отдых',
]

const BASE_TOUR_TYPES_3 = [
  'Водный туризм',
  'Культурно-позновательный туризм',
  'Гастрономический туризм',
  'Лечебно-оздоровительный туризм',
  'Природный туризм',
  'Рыболовно-охотничий туризм',
  'Семейный отдых',
  'Сельский туризм',
]

export default function MoveLines() {
  const swiperRef = useRef(null)

  return (
    <div className={styles.slider}>
      <div
        className={styles.sliderLine}
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          slidesPerView={8}
          spaceBetween={20}
          autoplay={{
            delay: 0,
          }}
          speed={5000}
          loop={true}
          modules={[Autoplay]}
          className="mySwiper1"
        >
          <SwiperSlide><div className={styles.item}>Slide 1</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 2</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 3</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 4</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 5</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 6</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 7</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 8</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 9</div></SwiperSlide>
        </Swiper>
      </div>

      <div
        className={styles.sliderLine}
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          slidesPerView={8}
          spaceBetween={20}
          autoplay={{
            delay: 0,
            reverseDirection: true,
          }}
          speed={5000}
          loop={true}
          modules={[Autoplay]}
          className="mySwiper1"
        >
          <SwiperSlide><div className={styles.item}>Slide 1</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 2</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 3</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 4</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 5</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 6</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 7</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 8</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 9</div></SwiperSlide>
        </Swiper>
      </div>

      <div
        className={styles.sliderLine}
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          slidesPerView={8}
          spaceBetween={20}
          autoplay={{
            delay: 0,
          }}
          speed={5000}
          loop={true}
          modules={[Autoplay]}
          className="mySwiper1"
        >
          <SwiperSlide><div className={styles.item}>Slide 1</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 2</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 3</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 4</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 5</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 6</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 7</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 8</div></SwiperSlide>
          <SwiperSlide><div className={styles.item}>Slide 9</div></SwiperSlide>
        </Swiper>
      </div>
    </div>
  )
}
