'use client'

import { motion } from 'framer-motion'
import styles from './CenterBlock.module.css'


export default function CenterBlock({ children, width = 1400, ...props }) {
  return (
    <div className={styles.centerBlock}>
      <div className={styles.widthBlock} style={{width: `${width}px`}}>
        {children}
      </div>
    </div>
  )
}
