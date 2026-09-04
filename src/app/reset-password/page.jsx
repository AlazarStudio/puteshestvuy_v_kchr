import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import Seo from '@/components/Seo/Seo'
import styles from '../login/auth.module.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await authAPI.resetPassword({ token, password })
      setDone(true)
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Не удалось изменить пароль'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <>
        <Seo noindex title="Новый пароль — Путешествуй КЧР" />
        <main className={styles.authPage}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <h1>Ссылка недействительна</h1>
            </div>
            <div className={styles.authForm}>
              <p>Запросите новую ссылку для сброса пароля.</p>
            </div>
            <div className={styles.authFooter}>
              <p>
                <Link to="/forgot-password">Запросить новую ссылку</Link>
              </p>
              <Link to="/" className={styles.backLink}>На главную</Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Seo noindex title="Новый пароль — Путешествуй КЧР" />
      <main className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>Новый пароль</h1>
            <p>Придумайте новый пароль для входа</p>
          </div>
          {done ? (
            <div className={styles.authForm}>
              <p>Пароль изменён. Теперь вы можете войти с новым паролем.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.authForm}>
              {error && (
                <div className={styles.error}>
                  {error}
                  <div style={{ marginTop: 6 }}>
                    <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>
                      Запросить новую ссылку
                    </Link>
                  </div>
                </div>
              )}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Новый пароль</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className={styles.input}
                  placeholder="Не менее 6 символов"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirm" className={styles.label}>Повторите пароль</label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError('') }}
                  className={styles.input}
                  placeholder="Повторите новый пароль"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </form>
          )}
          <div className={styles.authFooter}>
            {done && (
              <p>
                <Link to="/login">Войти</Link>
              </p>
            )}
            <Link to="/" className={styles.backLink}>На главную</Link>
          </div>
        </div>
      </main>
    </>
  )
}
