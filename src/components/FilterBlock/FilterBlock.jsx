'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FilterBlock.module.css'

/**
 * Универсальный блок фильтров.
 * filterGroups — массив групп с API страницы: { key, label, options }.
 * Если групп нет — рендерим только поиск (если передан onSearchChange).
 * Блок не отображается только когда нет ни поиска, ни фильтров.
 */
export default function FilterBlock({
  filterGroups = [],
  filters = {},
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Введите запрос',
}) {
  const groupsWithOptions = filterGroups.filter(
    (g) => Array.isArray(g.options) && g.options.length > 0
  )
  const groupsWithInputOnly = filterGroups.filter(
    (g) => !Array.isArray(g.options) || g.options.length === 0
  )
  const hasSearch = typeof onSearchChange === 'function'
  const hasFilters = groupsWithOptions.length > 0 || groupsWithInputOnly.length > 0

  const [openKeys, setOpenKeys] = useState({})
  const [isSearchOpen, setIsSearchOpen] = useState(true)

  const isGroupOpen = (key, index) => openKeys[key] ?? index === 0

  const toggleGroup = (key, index) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !(prev[key] ?? index === 0) }))
  }

  const toggle = (field, value) => {
    const arr = filters[field] || []
    const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
    onFiltersChange?.({ ...filters, [field]: next })
  }

  const setInputFilter = (field, value) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    onFiltersChange?.({ ...filters, [field]: trimmed ? [trimmed] : [] })
  }

  // Не рендерить только когда нет ни поиска, ни групп фильтров
  if (!hasSearch && !hasFilters) return null

  return (
    <div className={styles.filter}>
      {hasSearch && (
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
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                  />
                  <img src="/search_gray.png" alt="" className={styles.searchIcon} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {groupsWithOptions.map((group, index) => (
        <div key={group.key} className={styles.filterBlock}>
          <div
            className={styles.headerRow}
            onClick={() => toggleGroup(group.key, index)}
          >
            <div className={styles.title}>{group.label}</div>
            <motion.svg
              className={styles.arrow}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isGroupOpen(group.key, index) ? 180 : 0 }}
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
            {isGroupOpen(group.key, index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.checkBlock}>
                  {group.options.map((v) => (
                    <label key={v} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={(filters[group.key] || []).includes(v)}
                        onChange={() => toggle(group.key, v)}
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
      ))}

      {groupsWithInputOnly.map((group, index) => (
        <div key={group.key} className={styles.filterBlock}>
          <div
            className={styles.headerRow}
            onClick={() => toggleGroup(group.key, groupsWithOptions.length + index)}
          >
            <div className={styles.title}>{group.label}</div>
            <motion.svg
              className={styles.arrow}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                rotate: isGroupOpen(group.key, groupsWithOptions.length + index) ? 180 : 0,
              }}
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
            {isGroupOpen(group.key, groupsWithOptions.length + index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.filterInput}>
                  <input
                    type="text"
                    placeholder={`Введите значение для «${group.label}»`}
                    value={(filters[group.key] && filters[group.key][0]) || ''}
                    onChange={(e) => setInputFilter(group.key, e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
