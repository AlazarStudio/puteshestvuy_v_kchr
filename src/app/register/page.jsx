'use client'

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import styles from '../login/auth.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    name: '',
  })
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
      await register(formData)
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Ошибка регистрации. Попробуйте другие данные.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>Регистрация</h1>
          <p>Создайте аккаунт для доступа к избранному и профилю</p>
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
              placeholder="Придумайте логин"
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ваш email"
              required
              autoComplete="email"
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
              placeholder="Не менее 6 символов"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Имя (необязательно)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Как к вам обращаться"
              autoComplete="name"
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className={styles.authFooter}>
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
          <Link to="/" className={styles.backLink}>На главную</Link>
        </div>
      </div>
    </main>
  )
}
