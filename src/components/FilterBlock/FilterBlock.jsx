'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FilterBlock.module.css'
import {
  PLACE_DIRECTIONS,
  PLACE_SEASONS,
  PLACE_OBJECT_TYPES,
  PLACE_ACCESSIBILITY,
} from '@/lib/placeFilters'

const defaultFilters = {
  directions: [],
  seasons: [],
  objectTypes: [],
  accessibility: [],
}

export default function FilterBlock({
  filters = defaultFilters,
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  filterOptions,
}) {
  const directions = filterOptions?.directions ?? PLACE_DIRECTIONS
  const seasons = filterOptions?.seasons ?? PLACE_SEASONS
  const objectTypes = filterOptions?.objectTypes ?? PLACE_OBJECT_TYPES
  const accessibility = filterOptions?.accessibility ?? PLACE_ACCESSIBILITY
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [isDirectionOpen, setIsDirectionOpen] = useState(true)
  const [isSeasonOpen, setIsSeasonOpen] = useState(true)
  const [isTypeOpen, setIsTypeOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(true)

  const toggle = (field, value) => {
    const arr = filters[field] || []
    const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
    onFiltersChange?.({ ...filters, [field]: next })
  }

  return (
    <div className={styles.filter}>
      {/* Поиск */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsSearchOpen(!isSearchOpen)}>
          <div className={styles.title}>Поиск</div>
          <motion.svg
            className={styles.arrow}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: isSearchOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.search}>
                <input
                  type="text"
                  placeholder="Введите название или направление"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
                <img src="/search_gray.png" alt="" className={styles.searchIcon} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Направление */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsDirectionOpen(!isDirectionOpen)}>
          <div className={styles.title}>Направление</div>
          <motion.svg
            className={styles.arrow}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: isDirectionOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
        <AnimatePresence>
          {isDirectionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.checkBlock}>
                {directions.map((v) => (
                  <label key={v} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(filters.directions || []).includes(v)}
                      onChange={() => toggle('directions', v)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{v}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Сезон */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsSeasonOpen(!isSeasonOpen)}>
          <div className={styles.title}>Сезон</div>
          <motion.svg
            className={styles.arrow}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: isSeasonOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
        <AnimatePresence>
          {isSeasonOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.checkBlock}>
                {seasons.map((v) => (
                  <label key={v} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(filters.seasons || []).includes(v)}
                      onChange={() => toggle('seasons', v)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{v}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Вид объекта */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsTypeOpen(!isTypeOpen)}>
          <div className={styles.title}>Вид объекта</div>
          <motion.svg
            className={styles.arrow}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: isTypeOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
        <AnimatePresence>
          {isTypeOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.checkBlock}>
                {objectTypes.map((v) => (
                  <label key={v} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(filters.objectTypes || []).includes(v)}
                      onChange={() => toggle('objectTypes', v)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{v}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Доступность */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}>
          <div className={styles.title}>Доступность</div>
          <motion.svg
            className={styles.arrow}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: isAccessibilityOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
        <AnimatePresence>
          {isAccessibilityOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.checkBlock}>
                {accessibility.map((v) => (
                  <label key={v} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(filters.accessibility || []).includes(v)}
                      onChange={() => toggle('accessibility', v)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{v}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
