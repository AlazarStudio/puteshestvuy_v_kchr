'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  useEffect(() => {
    // Добавляем класс к html и body для изменения стилей header
    document.documentElement.classList.add('not-found-page')
    document.body.classList.add('not-found-page')
    
    // Очищаем класс при размонтировании
    return () => {
      document.documentElement.classList.remove('not-found-page')
      document.body.classList.remove('not-found-page')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Страница не найдена
        </h2>
        <p className="text-gray-600 mb-8">
          Извините, запрашиваемая страница не существует.
        </p>
        <Link href="/">
          <Button>Вернуться на главную</Button>
        </Link>
      </div>
    </div>
  )
}
