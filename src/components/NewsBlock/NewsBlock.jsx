'use client'

import styles from './NewsBlock.module.css'
import { Link } from 'react-router-dom'
import { generateSlug } from '@/utils/transliterate'

export default function NewsBlock({ title, date, tag = 'новости', description, image, slug: slugProp }) {
  const slug = slugProp || generateSlug(title)
  
  return (
    <Link to={`/news/${slug}`} className={styles.news}>
      <div className={styles.newsImage}>
        <img src={image || '/new1.png'} alt={title} />
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
