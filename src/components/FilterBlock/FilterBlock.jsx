'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FilterBlock.module.css'

export default function FilterBlock() {
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [isSeasonOpen, setIsSeasonOpen] = useState(true)
  const [isTransportOpen, setIsTransportOpen] = useState(true)
  const [isTypeOpen, setIsTypeOpen] = useState(true)
  const [showMoreTypes, setShowMoreTypes] = useState(false)

  const [selectedSeasons, setSelectedSeasons] = useState([])
  const [selectedTransports, setSelectedTransports] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])

  const seasons = ['Зима', 'Весна', 'Лето', 'Осень']
  const transports = ['Верхом', 'Автомобиль', 'Пешком', 'Квадроцикл']
  const types = [
    'Семейный',
    'Гастрономический туризм',
    'Природный туризм',
    'Активный отдых',
    'Лечебно-оздоровительный туризм',
    'Культурный туризм',
    'Экстремальный туризм',
    'Экологический туризм',
    'Религиозный туризм',
    'Спортивный туризм',
    'Оздоровительный туризм',
    'Образовательный туризм',
    'Приключенческий туризм',
    'Романтический туризм',
    'Деловой туризм',
    'Детский туризм',
    'Серебряный туризм',
    'Молодежный туризм'
  ]

  const visibleTypes = showMoreTypes ? types : types.slice(0, 5)

  const handleSeasonChange = (season) => {
    setSelectedSeasons(prev =>
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    )
  }

  const handleTransportChange = (transport) => {
    setSelectedTransports(prev =>
      prev.includes(transport)
        ? prev.filter(t => t !== transport)
        : [...prev, transport]
    )
  }

  const handleTypeChange = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
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
                <input type="text" placeholder='Введите название или направление' />
                <img src="/search_gray.png" alt="" className={styles.searchIcon} />
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
                {seasons.map((season) => (
                  <label key={season} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedSeasons.includes(season)}
                      onChange={() => handleSeasonChange(season)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{season}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Способ передвижения */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsTransportOpen(!isTransportOpen)}>
          <div className={styles.title}>Способ передвижения</div>
          <motion.svg
            className={styles.arrow}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: isTransportOpen ? 180 : 0 }}
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
          {isTransportOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.checkBlock}>
                {transports.map((transport) => (
                  <label key={transport} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTransports.includes(transport)}
                      onChange={() => handleTransportChange(transport)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{transport}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Тип */}
      <div className={styles.filterBlock}>
        <div className={styles.headerRow} onClick={() => setIsTypeOpen(!isTypeOpen)}>
          <div className={styles.title}>Тип</div>
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
                {visibleTypes.map((type) => (
                  <label key={type} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => handleTypeChange(type)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{type}</span>
                  </label>
                ))}
                {!showMoreTypes && types.length > 5 && (
                  <button
                    className={styles.showMore}
                    onClick={() => setShowMoreTypes(true)}
                  >
                    Показать еще {types.length - 5}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
