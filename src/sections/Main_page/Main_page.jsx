'use client'

import { motion } from 'framer-motion'
import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'


export default function Main_page() {
  return (
    <main className={styles.main}>
      <SliderFullScreen />
    </main>
  )
}
