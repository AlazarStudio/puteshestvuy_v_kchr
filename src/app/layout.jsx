import { Inter, Montserrat } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

// Добавление шрифта Montserrat (или другого)
const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat', // CSS переменная
  weight: ['400', '500', '600', '700'], // если нужны конкретные начертания
})

export const metadata = {
  title: 'Путешествуй в КЧР',
  description: 'Откройте для себя красоту Карачаево-Черкесии',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
