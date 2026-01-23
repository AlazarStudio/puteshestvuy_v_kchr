'use client'

import { motion } from 'framer-motion'
import styles from './ImgFullWidthBlock.module.css'


export default function ImgFullWidthBlock({ img, title, desc }) {
  return (
    <div className={styles.fullBlock}>
      <div className={styles.img}>
        <img src={img} alt="" />
      </div>
      <div className={styles.text}>
        <div className={styles.title}>{title}</div>
        <div className={styles.desc}>{desc}</div>
      </div>
    </div>
  )
}
