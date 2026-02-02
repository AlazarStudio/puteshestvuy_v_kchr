'use client'

import { motion } from 'framer-motion'
import styles from './NewsFullBlock.module.css'
import CenterBlock from '../CenterBlock/CenterBlock'
import { Link } from 'react-router-dom'


export default function NewsFullBlock() {
  return (
    <div className={styles.news} style={{
      background: 'url(/newBG.png)',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }}>
      <CenterBlock>
        <div className={styles.top}>
          <div className={styles.tagDate}>
            <div className={styles.tag}>новости</div>
            <div className={styles.date}>15.01.2026</div>
          </div>
          <div className={styles.title}>
            Горный поход: <br /> с гидом или самостоятельно?
          </div>
          <div className={styles.description}>
            Если в путешествии вам хочется совместить приятное с полезным, походы в горы — точно для вас. Даже небольшая прогулка по свежему воздуху подарит вам заряд бодрости и хорошо скажется на организме...
          </div>
          <Link to="/#" className={styles.button}>Читать далее</Link>
        </div>
        <div className={styles.bottom}>
          <div className={styles.anotherNew}>
            <div className={styles.img}>
              <img src="/new1.png" alt="" />
            </div>
            <div className={styles.info}>
              <div className={styles.tagDate}>
                <div className={styles.tag}>новости</div>
                <div className={styles.date}>15.01.2026</div>
              </div>
              <div className={styles.shortTitle}>Советы от местных: Хычины - вкусный символ Карачаево-Черкесии и любовь с одного укуса</div>
            </div>
          </div>
          <div className={styles.anotherNew}>
            <div className={styles.img}>
              <img src="/new2.png" alt="" />
            </div>
            <div className={styles.info}>
              <div className={styles.tagDate}>
                <div className={styles.tag}>новости</div>
                <div className={styles.date}>12.01.2026</div>
              </div>
              <div className={styles.shortTitle}>Вкусный Домбай: сувениры, которые продлят впечатление от отдыха в горах</div>
            </div>
          </div>
        </div>
      </CenterBlock>
    </div>
  )
}
