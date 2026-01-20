'use client'

import { motion } from 'framer-motion'
import styles from './TitleButton.module.css'
import Link from 'next/link'


export default function TitleButton({title, buttonLink}) {
  return (
    <section className={styles.titleButton}>
      <div className={styles.title}>{title}</div>
      <div className={styles.line}></div>
      <Link href={`${buttonLink}`} className={styles.button}>Смотреть все</Link>
    </section>
  )
}
