'use client'

import { motion } from 'framer-motion'
import styles from './PlaceBlock.module.css'
import Link from 'next/link'


export default function PlaceBlock({img, place, title, desc, link, rating, feedback }) {
  return (
    <Link href={link} className={styles.place}>
      <div className={styles.img}>
        <img src={img} alt="" />
        </div>
      <div className={styles.info}>
        <div className={styles.ratingFeedback}>
          <div className={styles.rating}>
            <img src="/star.png" alt="" />
            {rating}
          </div>
          <div className={styles.feedback}>{feedback}</div>
        </div>
        <div className={styles.text}>
          <div className={styles.placeName}>{place}</div>
          <div className={styles.title}>{title}</div>
          <div className={styles.desc}>
            <div className={styles.descText}>
              {desc}
            </div>
            <div className={styles.readMore}>
              <img src="/readMore.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
