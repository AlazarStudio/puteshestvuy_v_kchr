'use client'

import { motion } from 'framer-motion'
import styles from './ServiceTabBlock.module.css'
import ServiceCard from '../ServiceCard/ServiceCard'


export default function ServiceTabBlock() {
  return (
    <section className={styles.service}>
      <nav className={styles.tabs}>
        <ul>
          <li className={styles.active}>Гиды</li>
          <li>Прокат оборудования</li>
          <li>Придорожные пункты</li>
          <li>Гостиницы</li>
          <li>Кафе и рестораны</li>
          <li>Трансфер</li>
        </ul>
        <div className={styles.line}></div>
      </nav>
      <div className={styles.cards}>
        <ServiceCard img={'serviceImg1.png'} name={'Хубиев Артур Арсенович'}/>
        <ServiceCard img={'serviceImg2.png'} name={'Астежева Аида Владимировна'}/>
        <ServiceCard img={'serviceImg3.png'} name={'Долаев Артур Нурмагомедович'}/>
        <ServiceCard img={'serviceImg4.png'} name={'Урусов Ренат Хаджимуратович'}/>
      </div>
    </section>
  )
}
