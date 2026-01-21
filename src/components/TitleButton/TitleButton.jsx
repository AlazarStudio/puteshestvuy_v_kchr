'use client'

import { motion } from 'framer-motion'
import styles from './TitleButton.module.css'
import Link from 'next/link'


export default function TitleButton({ title, buttonLink, desc }) {
  return (
    <section className={styles.titleButton} style={{ alignItems: `${desc && 'flex-start'}` }}>
      {title ? <div className={styles.title}>{title}</div> : <div className={styles.noTitle}>{title}</div>}

      {buttonLink &&
        <>
          <div className={styles.line}></div>
          <Link href={`${buttonLink}`} className={styles.button}>Смотреть все</Link>
        </>
      }

      {desc && <div className={styles.desc}>{desc}</div>}
    </section>
  )
}
