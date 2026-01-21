'use client'

import { motion } from 'framer-motion'
import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'
import TitleButton from '@/components/TitleButton/TitleButton'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RouteSeasoneBanner from '@/components/RouteSeasoneBanner/RouteSeasoneBanner'
import SwiperSliderMain from '@/components/SwiperSliderMain/SwiperSliderMain'
import NewsFullBlock from '@/components/NewsFullBlock/NewsFullBlock'
import ServiceTabBlock from '@/components/ServiceTabBlock/ServiceTabBlock'


export default function Main_page() {
  return (
    <main className={styles.main}>
      <SliderFullScreen />

      <div className={styles.content}>
        <CenterBlock>
          <TitleButton title="Маршруты" buttonLink="/#" />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlock}>
            <RouteSeasoneBanner showFrom={'left'} routeLink={'/#'} bgColor={'#73BFE7'} patternColor={'#296587'} title={'Зима'} logo={'logoPattern1.png'} />
            <RouteSeasoneBanner showFrom={'right'} routeLink={'/#'} bgColor={'#FF9397'} patternColor={'#DB224A'} title={'Весна'} logo={'logoPattern2.png'} />
            <RouteSeasoneBanner showFrom={'left'} routeLink={'/#'} bgColor={'#66D7CA'} patternColor={'#156A60'} title={'Лето'} logo={'logoPattern3.png'} />
            <RouteSeasoneBanner showFrom={'right'} routeLink={'/#'} bgColor={'#CD8A67'} patternColor={'#7C4B42'} title={'Осень'} logo={'logoPattern4.png'} />
          </section>
        </CenterBlock>

        <CenterBlock>
          <TitleButton
            title="ВПЕРВЫЕ В КЧР?"
            desc="Специально для вас мы создали раздел, в котором собрали всю полезную информацию, чтобы помочь сделать ваше путешествие по нашей удивительной республике комфортным, интересным и незабываемым!"
          />
        </CenterBlock>

        <CenterBlock>
          <SwiperSliderMain />
        </CenterBlock>

        <NewsFullBlock />

        <CenterBlock>
          <TitleButton title="СЕРВИС И УСЛУГИ" buttonLink="/#" />
        </CenterBlock>

        <CenterBlock>
          <ServiceTabBlock />
        </CenterBlock>

        
      </div>
    </main>
  )
}
