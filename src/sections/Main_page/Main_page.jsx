'use client'

import styles from './Main_page.module.css'
import SliderFullScreen from '@/components/SliderFullScreen/SliderFullScreen'
import TitleButton from '@/components/TitleButton/TitleButton'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import RouteSeasoneBanner from '@/components/RouteSeasoneBanner/RouteSeasoneBanner'
import SwiperSliderMain from '@/components/SwiperSliderMain/SwiperSliderMain'
import NewsFullBlock from '@/components/NewsFullBlock/NewsFullBlock'
import ServiceTabBlock from '@/components/ServiceTabBlock/ServiceTabBlock'
import MoveLines from '@/components/MoveLines/MoveLines'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'


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

        {/* Переделать */}
        <MoveLines />

        <CenterBlock>
          <TitleButton title="КУДА ПОЕХАТЬ?" buttonLink="/#" />
        </CenterBlock>

        <CenterBlock>
          <section className={styles.flexBlock}>
            <PlaceBlock rating={"5.0"} feedback={"1 отзыв"} place={"Теберда"} title={"Центральная усадьба Тебердинского национального парка"} desc={"Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;"} link={"/#"} img={'/placeImg1.png'} />
            <PlaceBlock rating={"5.0"} feedback={"2 отзыва"} place={"Теберда"} title={"Центральная усадьба Тебердинского национального парка"} desc={"Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;"} link={"/#"} img={'/placeImg1.png'} />
            <PlaceBlock rating={"5.0"} feedback={"3 отзыва"} place={"Теберда"} title={"Центральная усадьба Тебердинского национального парка"} desc={"Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;"} link={"/#"} img={'/placeImg1.png'} />
            <PlaceBlock rating={"5.0"} feedback={"4 отзыва"} place={"Теберда"} title={"Центральная усадьба Тебердинского национального парка"} desc={"Здесь расположены музей природы с коллекцией минералов, цветов и трав, а также чучелами животных, птиц и рыб; информационный визит-центр с экспозициями и выставками;"} link={"/#"} img={'/placeImg1.png'} />
          </section>
        </CenterBlock>

        <div className={styles.imgBG}>
          <img src="/mountainBG.png" alt="" />
        </div>
      </div>
    </main>
  )
}
