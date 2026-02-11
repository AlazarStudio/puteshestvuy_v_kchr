'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import styles from './NewsBlock.module.css'
import { Link } from 'react-router-dom'
import { generateSlug } from '@/utils/transliterate'

export default function NewsBlock({ title, date, tag = 'новости', description, image, slug: slugProp, maxOffset = 15, scale = 1.05 }) {
  const slug = slugProp || generateSlug(title)
  
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  const xSpring = useSpring(x, { stiffness: 160, damping: 18, mass: 0.5 })
  const ySpring = useSpring(y, { stiffness: 160, damping: 18, mass: 0.5 })
  const scaleSpring = useSpring(scaleValue, { stiffness: 100, damping: 25, mass: 1 })

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const dx = px - 0.5
    const dy = py - 0.5

    x.set(dx * maxOffset)
    y.set(dy * maxOffset)
  }

  const handleMouseEnter = () => {
    scaleValue.set(scale)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    scaleValue.set(1)
  }
  
  return (
    <Link 
      ref={cardRef}
      to={`/news/${slug}`} 
      className={styles.news}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.newsImage}>
        <motion.img 
          src={image || '/new1.png'} 
          alt={title}
          style={{
            x: xSpring,
            y: ySpring,
            scale: scaleSpring,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      
      <div className={styles.newsInfo}>
        <div className={styles.tagDate}>
          <div className={styles.tag}>{tag}</div>
          <div className={styles.date}>{date}</div>
        </div>
        
        <div className={styles.title}>{title}</div>
        
        <div className={styles.description}>
          {description}
        </div>
        
        <div className={styles.readMore}>
          Читать далее
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  )
}
