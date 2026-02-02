'use client'

import styles from './PlaceDetail.module.css'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'

export default function PlaceDetail({ placeSlug }) {
  return (
    <main className={styles.main}>
      <CenterBlock>
        <div className={styles.placePage}>
          <div className={styles.bread_crumbs}>
            <Link href={"/"}>Главная</Link>
            <p>→</p>
            <Link to="/places">Интересные места</Link>
            <p>→</p>
            <p>Центральная усадьба Тебердинского национального парка</p>
          </div>

          <div className={styles.placeBlock}>
            <div className={styles.placeBlock_content}>
              <div className={styles.title}>Центральная усадьба Тебердинского национального парка</div>
              
              <div className={styles.placeInfo}>
                <div className={styles.item}>
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Местоположение</div>
                    <div className={styles.textDesc}>Теберда</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Рейтинг</div>
                    <div className={styles.textDesc}>5.0</div>
                  </div>
                </div>
                <div className={styles.item}>
                  <div className={styles.text}>
                    <div className={styles.textTitle}>Отзывы</div>
                    <div className={styles.textDesc}>1 отзыв</div>
                  </div>
                </div>
              </div>

              <div className={styles.placeImage}>
                <img src="/placeImg1.png" alt="Центральная усадьба Тебердинского национального парка" />
              </div>

              <div className={styles.title}>Описание</div>
              <div className={styles.description}>
                Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками; административные здания парка. Это отличное место для начала знакомства с природой и историей Тебердинского заповедника.
              </div>
            </div>
          </div>
        </div>
      </CenterBlock>
    </main>
  )
}
