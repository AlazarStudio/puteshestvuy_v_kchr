'use client'

import { motion } from 'framer-motion'
import styles from './ServiceCard.module.css'


export default function ServiceCard({ img, name }) {
  return (
    <div className={styles.card}>
      <div className={styles.img}><img src={img} alt="" /></div>
      <div className={styles.topLine}>
        <div className={styles.verification}><img src="/verification.png" alt="" /></div>
        <div className={styles.like}><img src="/like.png" alt="" /></div>
      </div>
      <div className={styles.info}>
        <div className={styles.rating}>
          <div className={styles.stars}><img src="/star.png" alt="" />5.0</div>
          <div className={styles.feedback}>4 отзыва</div>
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </div>
  )
}
