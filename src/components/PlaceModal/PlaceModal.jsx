'use client'

import { motion, AnimatePresence } from 'framer-motion'
import styles from './PlaceModal.module.css'
import CenterBlock from '../CenterBlock/CenterBlock'

export default function PlaceModal({ isOpen, place, onClose }) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && place && (
        <motion.div
          key="modal"
          className={styles.modal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modalContent}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className={styles.modalBody}>
              <div className={styles.modalImage}>
                <img src={place.img} alt={place.title} />
                <div className={styles.modalImage_text}>
                  <CenterBlock>
                    <div className={styles.modalImage_text_block}>
                      <div className={styles.modalImage_text_place}>
                        <img src="/place.png" alt="" />
                        Зеленчукский район
                      </div>
                      <div className={styles.modalImage_text_title}>
                        СОФИЙСКИЕ ВОДОПАДЫ
                      </div>
                    </div>
                  </CenterBlock>
                </div>
              </div>

              <div className={styles.modalInfo}>
                <CenterBlock>
                  123
                </CenterBlock>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
