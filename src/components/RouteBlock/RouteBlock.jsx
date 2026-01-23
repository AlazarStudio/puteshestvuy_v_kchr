'use client'

import { motion } from 'framer-motion'
import styles from './RouteBlock.module.css'
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';


// import required modules
import { Navigation, Autoplay } from 'swiper/modules';
import Link from 'next/link';

export default function RouteBlock({ routeId = '1' }) {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return (
    <Link href={`/routes/${routeId}`} className={styles.route}>

      <div className={styles.routeSlider}>
        <Swiper
          navigation={true}
          loop={true}
          autoplay={{
            delay: getRandomInt(10000, 15000),
            disableOnInteraction: false,
          }}
          modules={[Navigation, Autoplay]}
          className="routeSlider"
        >
          <SwiperSlide>
            <div className={styles.routeSlide}>
              <img src="/routeSlide1.png" alt="" />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className={styles.routeSlide}>
              <img src="/routeSlide1.png" alt="" />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      <div className={styles.routeInfo}>
        <div className={styles.params}>
          <div className={styles.routeTags}>
            <div className={styles.tag}>
              <img src="/routeTagTime.png" alt="" />
              <div className={styles.typeText}>3ч 30м</div>
            </div>
            <div className={styles.tag}>
              <img src="/routeTagLength.png" alt="" />
              <div className={styles.typeText}>100 км</div>
            </div>
          </div>
          <div className={styles.tag}>
            <div className={styles.typeLight}></div>
            <div className={styles.typeText}>Сложность - Легкий</div>
            <div className={styles.typeQuestion}>?</div>
          </div>
        </div>
        <div className={styles.title}>
          На границе регионов: Кисловодск - Медовые водопады
        </div>
        <div className={styles.desc}>
          Летом эти места обязательны к посещению, ведь с июня по сентябрь водопады достигают максимальной полноводности.
        </div>

        <div className={styles.routePlaces}>
          <div className={styles.title}>Маршрут:</div>
          <div className={styles.places}>
            <div className={styles.place}>01 Село Красный курган</div> →
            <div className={styles.place}>02 Село Учкекен</div> →
            <div className={styles.place}>03 Перевал Гум-башиx</div> →
            <div className={styles.place}>04 Медовые водопады</div>
          </div>
        </div>
      </div>

    </Link>
  )
}
