'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './BookingModal.module.css'
import { bookingsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

const DIRECTIONS = [
  'Теберда',
  'Домбай',
  'Архыз',
  'Махар',
  'Малокарачаевский район',
  'Зеленчукский район',
]

function formatDateLabel(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
}

function toIsoDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d, delta) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

function addDays(d, delta) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta)
}

function buildCalendarWeeks(visibleMonthDate) {
  const first = startOfMonth(visibleMonthDate)
  // Понедельник = 0 ... Воскресенье = 6
  const mondayIndex = (first.getDay() + 6) % 7
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - mondayIndex)
  const weeks = []
  for (let w = 0; w < 6; w++) {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + w * 7 + i)
      days.push(day)
    }
    weeks.push(days)
  }
  return weeks
}

export default function BookingModal({ isOpen, onClose, context }) {
  const { user } = useAuth()
  const todayDate = useMemo(() => startOfDay(new Date()), [])
  const todayIso = useMemo(() => toIsoDate(startOfDay(new Date())), [])

  const [date, setDate] = useState('')
  const [direction, setDirection] = useState(DIRECTIONS[0])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | sending | success | error
  const [busyDates, setBusyDates] = useState(() => new Set())
  const [successInfo, setSuccessInfo] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setDate('')
    setDirection(DIRECTIONS[0])
    setName('')
    setPhone('')
    setEmail('')
    setComment('')
    setCalendarMonth(startOfMonth(new Date()))
    setSubmitStatus('idle')
    setBusyDates(new Set())
    setSuccessInfo(null)

    // Автозаполнение контактов из профиля, если пользователь авторизован
    const profileName =
      [user?.userInformation?.firstName, user?.userInformation?.lastName].filter(Boolean).join(' ').trim() ||
      (user?.name || '').trim()
    const profileEmail = (user?.email || '').trim()
    const profilePhone = (user?.phone || user?.userInformation?.phone || '').trim()

    if (profileName) setName(profileName)
    if (profileEmail) setEmail(profileEmail)
    if (profilePhone) setPhone(profilePhone)
  }, [isOpen, user?.email, user?.name, user?.userInformation?.firstName, user?.userInformation?.lastName, user?.userInformation?.phone, user?.phone])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [isOpen, onClose])

  const handleSubmit = (e) => {
    e.preventDefault()

    setSubmitStatus('sending')

    const payload = {
      bookingDate: date,
      direction,
      contactName: name.trim(),
      contactPhone: phone.trim(),
      contactEmail: email.trim(),
      comment: comment.trim() || null,

      entityType: context?.type || null,
      entityId: context?.id || null,
      entitySlug: context?.slug || null,
      entityTitle: context?.title || null,
      category: context?.category || null,

      raw: {
        context: context || null,
      },
    }

    bookingsAPI
      .create(payload)
      .then(() => {
        setSubmitStatus('success')
        setSuccessInfo({
          email: payload.contactEmail,
        })
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[booking] submit error', err)
        setSubmitStatus('error')
      })
  }

  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendarMonth), [calendarMonth])
  const monthLabel = useMemo(
    () => calendarMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
    [calendarMonth],
  )

  const selectedIso = date || null

  // Подтягиваем занятые даты для гида на видимый диапазон календаря (6 недель),
  // чтобы блокировать и "хвосты" соседних месяцев.
  useEffect(() => {
    if (!isOpen) return
    const entityId = context?.id || null
    const entitySlug = context?.slug || null
    if (!entityId && !entitySlug) return

    const gridStart = calendarWeeks?.[0]?.[0]
    const gridEnd = calendarWeeks?.[calendarWeeks.length - 1]?.[6]
    if (!gridStart || !gridEnd) return

    const from = toIsoDate(gridStart)
    const to = toIsoDate(addDays(gridEnd, 1)) // exclusive

    let cancelled = false
    bookingsAPI
      .getBusyDates({
        ...(entityId ? { entityId } : {}),
        ...(entitySlug ? { entitySlug } : {}),
        from,
        to,
      })
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray(res.data?.dates) ? res.data.dates : []
        setBusyDates(new Set(list.map(String)))
      })
      .catch(() => {
        if (cancelled) return
        setBusyDates(new Set())
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, calendarWeeks, context?.id, context?.slug])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose?.()}
          role="dialog"
          aria-modal="true"
          aria-label="Окно бронирования"
        >
          <motion.div
            className={styles.modal}
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.close} onClick={() => onClose?.()} aria-label="Закрыть">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {submitStatus !== 'success' ? (
              <div className={styles.header}>
                <div className={styles.title}>Бронирование</div>
                {context?.title ? <div className={styles.subtitle}>{context.title}</div> : null}
              </div>
            ) : null}

            {submitStatus === 'success' ? (
              <div className={styles.successWrap}>
                <div className={styles.successTitle}>Заявка отправлена</div>
                <div className={styles.successText}>
                  Бронирование успешно оформлено. Мы отправили подтверждение на почту{' '}
                  <strong>{successInfo?.email || email}</strong>.
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.primaryBtn} onClick={() => onClose?.()}>
                    Закрыть
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.grid}>
                  <div className={styles.left}>
                    <div className={styles.blockTitle}>Дата</div>
                    <div className={styles.calendar}>
                      <div className={styles.calendarHeader}>
                        <button
                          type="button"
                          className={styles.calendarNavBtn}
                          onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
                          aria-label="Предыдущий месяц"
                        >
                          ‹
                        </button>
                        <div className={styles.calendarMonthLabel}>{monthLabel}</div>
                        <button
                          type="button"
                          className={styles.calendarNavBtn}
                          onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                          aria-label="Следующий месяц"
                        >
                          ›
                        </button>
                      </div>

                      <div className={styles.calendarWeekdays} aria-hidden="true">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((w) => (
                          <div key={w} className={styles.calendarWeekday}>
                            {w}
                          </div>
                        ))}
                      </div>

                      <div className={styles.calendarGrid}>
                        {calendarWeeks.flat().map((d) => {
                          const iso = toIsoDate(d)
                          const isOtherMonth = d.getMonth() !== calendarMonth.getMonth()
                          const isPast = startOfDay(d) < todayDate
                          const isBusy = busyDates.has(iso)
                          const isSelected = selectedIso === iso
                          const className = [
                            styles.calendarDay,
                            isOtherMonth ? styles.calendarDayOtherMonth : '',
                            isPast ? styles.calendarDayDisabled : '',
                            isBusy ? styles.calendarDayBusy : '',
                            isSelected ? styles.calendarDaySelected : '',
                          ]
                            .filter(Boolean)
                            .join(' ')

                          return (
                            <button
                              key={iso}
                              type="button"
                              className={className}
                              onClick={() => {
                                if (isPast || isBusy) return
                                setDate(iso)
                              }}
                              disabled={isPast}
                              aria-label={formatDateLabel(iso)}
                              aria-pressed={isSelected}
                              aria-disabled={isBusy ? 'true' : undefined}
                              title={isBusy ? 'В этот день уже забронировано' : undefined}
                            >
                              {d.getDate()}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <input type="hidden" value={date} required readOnly />
                  </div>

                  <div className={styles.right}>
                    <div className={styles.blockTitle}>Направление</div>
                    <select className={styles.input} value={direction} onChange={(e) => setDirection(e.target.value)}>
                      {DIRECTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <div className={styles.blockTitle} style={{ marginTop: 16 }}>
                      Контактные данные
                    </div>
                    <div className={styles.contacts}>
                      <input
                        className={styles.input}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Имя"
                        required
                      />
                      <input
                        className={styles.input}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Телефон"
                        required
                      />
                      <input
                        className={styles.input}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                      />
                      <textarea
                        className={styles.textarea}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Комментарий (необязательно)"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => onClose?.()}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.primaryBtn}>
                    {submitStatus === 'sending' ? 'Отправка...' : 'Бронировать'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

