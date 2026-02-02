'use client'

import { useState, useEffect } from 'react'
import { Select, MenuItem, FormControl } from '@mui/material'
import { Link } from 'react-router-dom'
import styles from './Services_page.module.css'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import FilterBlock from '@/components/FilterBlock/FilterBlock'
import { transliterate } from '@/utils/transliterate'

const SCROLL_KEY = 'services_scroll_position'

const servicesData = [
  {
    id: 1,
    name: 'Хубиев Артур Арсенович',
    category: 'Гид',
    rating: 5.0,
    reviews: 4,
    img: '/serviceImg1.png',
    verified: true,
    description: 'Профессиональный гид с опытом работы более 10 лет. Специализируется на горных маршрутах и культурных экскурсиях.',
  },
  {
    id: 2,
    name: 'Долаев Артур Нурмагомедович',
    category: 'Гид',
    rating: 5.0,
    reviews: 4,
    img: '/serviceImg2.png',
    verified: true,
    description: 'Сертифицированный гид по горным маршрутам. Знает все тайные места региона.',
  },
  {
    id: 3,
    name: 'Шаманов Руслан Владимирович',
    category: 'Гид',
    rating: 5.0,
    reviews: 4,
    img: '/serviceImg3.png',
    verified: true,
    description: 'Опытный проводник, специалист по экстремальному туризму.',
  },
  {
    id: 4,
    name: 'Дотдаев Магомет Сеит-Мазанович',
    category: 'Гид',
    rating: 5.0,
    reviews: 4,
    img: '/serviceImg4.png',
    verified: true,
    description: 'Гид-историк, проводит уникальные экскурсии по историческим местам.',
  },
  {
    id: 5,
    name: 'Прокат снаряжения "Горец"',
    category: 'Прокат',
    rating: 4.8,
    reviews: 12,
    img: '/serviceImg1.png',
    verified: true,
    description: 'Прокат горного снаряжения: палатки, спальники, треккинговые палки и многое другое.',
  },
  {
    id: 6,
    name: 'Туристическое агентство "КЧР-Тур"',
    category: 'Туроператор',
    rating: 4.9,
    reviews: 25,
    img: '/serviceImg2.png',
    verified: true,
    description: 'Организация индивидуальных и групповых туров по Карачаево-Черкесии.',
  },
]

export default function Services_page() {
  const [sortBy, setSortBy] = useState('popularity')

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
  }

  // Восстанавливаем позицию скролла при возврате на страницу
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScroll, 10),
          behavior: 'instant'
        })
      }, 0)
      sessionStorage.removeItem(SCROLL_KEY)
    }
  }, [])

  // Сохраняем позицию скролла перед уходом со страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
    }

    const handleClick = (e) => {
      const link = e.target.closest('a[href^="/services/"]')
      if (link) {
        sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString())
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <main className={styles.main}>
      <ImgFullWidthBlock
        img={'/full_roates_bg.jpg'}
        title={'УСЛУГИ И СЕРВИСЫ'}
        desc={'Найдите надёжных гидов, прокат снаряжения и другие услуги для комфортного путешествия по Карачаево-Черкесии'}
      />

      <CenterBlock>
        <section className={styles.flexBlock}>
          <FilterBlock />
          <div className={styles.services}>
            <div className={styles.servicesSort}>
              <div className={styles.servicesSortFind}>
                Найдено {servicesData.length} услуг
              </div>
              <div className={styles.servicesSortSort}>
                <div className={styles.title}>Сортировать:</div>
                <FormControl className={styles.selectWrapper}>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    className={styles.select}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Сортировка услуг' }}
                    MenuProps={{
                      disableScrollLock: true,
                      PaperProps: {
                        sx: {
                          maxHeight: 200,
                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          '& .MuiMenuItem-root': {
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontSize: '16px',
                            fontWeight: 400,
                            lineHeight: '150%',
                          },
                          '& .MuiMenuItem-root.Mui-selected': {
                            backgroundColor: '#156A60',
                            color: '#fff',
                            '&:hover': {
                              backgroundColor: '#156A60',
                            },
                          },
                        },
                      },
                    }}
                    sx={{
                      height: '40px',
                      borderRadius: '15px',
                      backgroundColor: '#fff',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #F1F3F8',
                        borderRadius: '15px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#156A60',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#156A60',
                        borderWidth: '1px',
                      },
                      '& .MuiSelect-select': {
                        padding: '10px 14px',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                        color: '#000',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#000',
                      },
                    }}
                  >
                    <MenuItem 
                      value="popularity"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      По популярности
                    </MenuItem>
                    <MenuItem 
                      value="rating"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      По рейтингу
                    </MenuItem>
                    <MenuItem 
                      value="reviews"
                      sx={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: '150%',
                      }}
                    >
                      По отзывам
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            
            <div className={styles.servicesGrid}>
              {servicesData.map((service) => (
                <Link 
                  key={service.id} 
                  to={`/services/${transliterate(service.name)}`}
                  className={styles.serviceCard}
                >
                  <div className={styles.serviceCardImg}>
                    <img src={service.img} alt={service.name} />
                  </div>
                  <div className={styles.serviceCardTopLine}>
                    {service.verified && (
                      <div className={styles.serviceCardVerification}>
                        <img src="/verification.png" alt="Верифицирован" />
                      </div>
                    )}
                    <div className={styles.serviceCardLike}>
                      <img src="/like.png" alt="В избранное" />
                    </div>
                  </div>
                  <div className={styles.serviceCardInfo}>
                    <div className={styles.serviceCardCategory}>{service.category}</div>
                    <div className={styles.serviceCardRating}>
                      <div className={styles.serviceCardStars}>
                        <img src="/star.png" alt="" />
                        {service.rating}
                      </div>
                      <div className={styles.serviceCardFeedback}>{service.reviews} отзывов</div>
                    </div>
                    <div className={styles.serviceCardName}>{service.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </CenterBlock>
    </main>
  )
}
