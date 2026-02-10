'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AuthModal.module.css'
import authStyles from '@/app/login/auth.module.css'

const TAB_LOGIN = 'login'
const TAB_REGISTER = 'register'
const SUCCESS_LOADER_MIN_MS = 500

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = TAB_LOGIN }) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [loginData, setLoginData] = useState({ login: '', password: '' })
  const [registerData, setRegisterData] = useState({
    login: '',
    email: '',
    password: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setTab(initialTab)
    setError('')
  }, [initialTab, isOpen])

  const clearForms = () => {
    setLoginData({ login: '', password: '' })
    setRegisterData({ login: '', email: '', password: '', name: '' })
    setError('')
  }

  const handleClose = () => {
    clearForms()
    onClose()
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await login(loginData)
      await new Promise((r) => setTimeout(r, SUCCESS_LOADER_MIN_MS))
      clearForms()
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Ошибка входа. Проверьте логин и пароль.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await register(registerData)
      await new Promise((r) => setTimeout(r, SUCCESS_LOADER_MIN_MS))
      clearForms()
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Ошибка регистрации. Попробуйте другие данные.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Закрыть"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {tab === TAB_LOGIN && (
          <>
            <div className={authStyles.authHeader}>
              <h2 id="auth-modal-title" className={styles.modalTitle}>Вход</h2>
              <p>Войдите в личный кабинет</p>
            </div>
            <form onSubmit={handleLoginSubmit} className={authStyles.authForm}>
              {error && <div className={authStyles.error}>{error}</div>}
              <div className={authStyles.formGroup}>
                <label htmlFor="auth-login" className={authStyles.label}>Логин</label>
                <input
                  type="text"
                  id="auth-login"
                  name="login"
                  value={loginData.login}
                  onChange={(e) => setLoginData((p) => ({ ...p, login: e.target.value }))}
                  className={authStyles.input}
                  placeholder="Введите логин"
                  required
                  autoComplete="username"
                />
              </div>
              <div className={authStyles.formGroup}>
                <label htmlFor="auth-password" className={authStyles.label}>Пароль</label>
                <input
                  type="password"
                  id="auth-password"
                  name="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((p) => ({ ...p, password: e.target.value }))}
                  className={authStyles.input}
                  placeholder="Введите пароль"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className={authStyles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>
            <div className={styles.authFooter}>
              <p>
                Нет аккаунта?{' '}
                <button type="button" className={styles.switchLink} onClick={() => { setTab(TAB_REGISTER); setError('') }}>
                  Зарегистрироваться
                </button>
              </p>
            </div>
          </>
        )}

        {tab === TAB_REGISTER && (
          <>
            <div className={authStyles.authHeader}>
              <h2 id="auth-modal-title" className={styles.modalTitle}>Регистрация</h2>
              <p>Создайте аккаунт для доступа к избранному и профилю</p>
            </div>
            <form onSubmit={handleRegisterSubmit} className={authStyles.authForm}>
              {error && <div className={authStyles.error}>{error}</div>}
              <div className={authStyles.formGroup}>
                <label htmlFor="auth-reg-login" className={authStyles.label}>Логин</label>
                <input
                  type="text"
                  id="auth-reg-login"
                  name="login"
                  value={registerData.login}
                  onChange={(e) => setRegisterData((p) => ({ ...p, login: e.target.value }))}
                  className={authStyles.input}
                  placeholder="Придумайте логин"
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>
              <div className={authStyles.formGroup}>
                <label htmlFor="auth-reg-email" className={authStyles.label}>Email</label>
                <input
                  type="email"
                  id="auth-reg-email"
                  name="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData((p) => ({ ...p, email: e.target.value }))}
                  className={authStyles.input}
                  placeholder="Ваш email"
                  required
                  autoComplete="email"
                />
              </div>
              <div className={authStyles.formGroup}>
                <label htmlFor="auth-reg-password" className={authStyles.label}>Пароль</label>
                <input
                  type="password"
                  id="auth-reg-password"
                  name="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData((p) => ({ ...p, password: e.target.value }))}
                  className={authStyles.input}
                  placeholder="Не менее 6 символов"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className={authStyles.formGroup}>
                <label htmlFor="auth-reg-name" className={authStyles.label}>Имя (необязательно)</label>
                <input
                  type="text"
                  id="auth-reg-name"
                  name="name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData((p) => ({ ...p, name: e.target.value }))}
                  className={authStyles.input}
                  placeholder="Как к вам обращаться"
                  autoComplete="name"
                />
              </div>
              <button type="submit" className={authStyles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
            <div className={styles.authFooter}>
              <p>
                Уже есть аккаунт?{' '}
                <button type="button" className={styles.switchLink} onClick={() => { setTab(TAB_LOGIN); setError('') }}>
                  Войти
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
