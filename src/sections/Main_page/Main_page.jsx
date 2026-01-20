'use client'

import { motion } from 'framer-motion'
import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'
import TitleButton from '@/components/TitleButton/TitleButton'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RouteSeasoneBanner from '@/components/RouteSeasoneBanner/RouteSeasoneBanner'


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
          <TitleButton title="Маршруты" buttonLink="/#" />
        </CenterBlock>
      </div>
    </main>
  )
}
