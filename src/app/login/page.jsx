'use client'

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import styles from './auth.module.css'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/profile'
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const user = await login(formData)
      
      // Если returnUrl начинается с /admin и пользователь админ - редиректим в админку (защита админки)
      // Во всех остальных случаях - в профиль
      if (returnUrl.startsWith('/admin') && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) {
        navigate(returnUrl, { replace: true })
      } else {
        // Всегда в профиль по умолчанию
        navigate('/profile', { replace: true })
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Ошибка входа. Проверьте логин и пароль.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>Вход</h1>
          <p>Войдите в личный кабинет</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formGroup}>
            <label htmlFor="login" className={styles.label}>Логин</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              className={styles.input}
              placeholder="Введите логин"
              required
              autoComplete="username"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div className={styles.authFooter}>
          <p>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
          <Link to="/" className={styles.backLink}>На главную</Link>
        </div>
      </div>
    </main>
  )
}
