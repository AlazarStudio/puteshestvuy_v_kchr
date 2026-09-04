import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import Seo from '@/components/Seo/Seo'
import styles from '../login/auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Не удалось отправить письмо'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Seo noindex title="Восстановление пароля — Путешествуй КЧР" />
      <main className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>Восстановление пароля</h1>
            <p>Укажите email, на который зарегистрирован аккаунт</p>
          </div>
          {sent ? (
            <div className={styles.authForm}>
              <p>
                Если такой email зарегистрирован, мы отправили письмо со ссылкой для сброса
                пароля. Проверьте папку «Спам».
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.authForm}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className={styles.input}
                  placeholder="Ваш email"
                  required
                  autoComplete="email"
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Отправка...' : 'Отправить ссылку'}
              </button>
            </form>
          )}
          <div className={styles.authFooter}>
            <p>
              <Link to="/login">Войти</Link>
            </p>
            <Link to="/" className={styles.backLink}>На главную</Link>
          </div>
        </div>
      </main>
    </>
  )
}
