

import { motion } from 'framer-motion'
import AppImage from '@/components/ui/AppImage'
import styles from './ImgFullWidthBlock.module.css'


export default function ImgFullWidthBlock({ img, title, desc, alt, as = 'h1' }) {
  const Heading = as || 'h1'
  return (
    <div className={styles.fullBlock}>
      <div className={styles.img}>
        <AppImage src={img} alt={alt || ''} variant="cover" eager />
      </div>
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        <div className={styles.desc} dangerouslySetInnerHTML={{ __html: desc || '' }} />
      </div>
    </div>
  )
}
