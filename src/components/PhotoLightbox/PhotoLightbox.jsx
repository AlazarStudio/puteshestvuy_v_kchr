import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import { X, Download } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import { getImageUrl } from '@/lib/api'
import { downloadFile } from '@/lib/utils'
import styles from './PhotoLightbox.module.css'

export default function PhotoLightbox({ photos = [], startIndex = 0, isOpen = false, onClose }) {
  const swiperRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(startIndex)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setActiveIndex(startIndex)
    swiperRef.current?.swiper?.slideTo(startIndex, 0)
  }, [isOpen, startIndex])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (swiperRef.current && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.key === 'ArrowLeft' ? swiperRef.current.swiper.slidePrev() : swiperRef.current.swiper.slideNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose])

  if (photos.length === 0) return null

  const active = photos[Math.min(activeIndex, photos.length - 1)] || photos[0]

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadFile(getImageUrl(active.url), active.url.split('/').pop())
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографии"
        >
          <motion.div
            className={styles.content}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
              <X size={22} />
            </button>

            <Swiper
              ref={swiperRef}
              modules={[Navigation]}
              navigation
              spaceBetween={20}
              slidesPerView={1}
              initialSlide={startIndex}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className={styles.swiper}
            >
              {photos.map((photo) => (
                <SwiperSlide key={photo.id}>
                  <div className={styles.slide}>
                    <img src={getImageUrl(photo.url)} alt={photo.placeCaption || ''} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className={styles.caption}>
              <div className={styles.captionText}>
                <div className={styles.captionPlace}>
                  {active.placeSlug ? (
                    <Link to={`/places/${active.placeSlug}`} onClick={onClose}>{active.placeCaption}</Link>
                  ) : (
                    active.placeCaption
                  )}
                </div>
                <div className={styles.captionAuthor}>Автор: {active.authorCaption}</div>
              </div>

              <div className={styles.captionActions}>
                <span className={styles.counter}>{activeIndex + 1} / {photos.length}</span>
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  <Download size={16} />
                  <span>{downloading ? 'Загрузка...' : 'Скачать'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
