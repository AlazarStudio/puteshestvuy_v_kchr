'use client'

import Link from 'next/link'
import CenterBlock from '../CenterBlock/CenterBlock'
import styles from './Footer.module.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <CenterBlock>
        <div className={styles.footerTop}>
          <div className={styles.column}>
            <div className={styles.img}><img src="/white_logo.png" alt="" /></div>
            <div className={styles.social}>
              <Link href={"/#"} target='_blank' className={styles.imgBlock}><img src="/tg.png" alt="" /></Link>
              <Link href={"/#"} target='_blank' className={styles.imgBlock}><img src="/vk.png" alt="" /></Link>
            </div>
            <Link href={"tel:7009090009"} className={styles.phone}>+7 (099) 09 00 09</Link>
            <Link href={"/#"} className={styles.text}>
              Карачаево-Черкесская Республика, <br />
              г. Карачаевск, ул. Ленина, д.15, офис 10
            </Link>
          </div>

          <div className={styles.column}>
            <div href={"/#"} className={styles.textTitle}>На помощь туристу</div>
            <Link href={"/#"} className={styles.text}>Этикет региона: дресс-код и культура</Link>
            <Link href={"/#"} className={styles.text}>Что беру в путешествие?</Link>
            <Link href={"/#"} className={styles.text}>Полезные контакты Региона</Link>
            <Link href={"/#"} className={styles.text}>Я иду в горы, кому об этом сообщить и где взять разрешение? </Link>
          </div>

          <div className={styles.column}>
            <div className={styles.textTitle}>Обратная связь</div>
            <form>
              <input type="text" placeholder='Имя' />
              <input type="email" placeholder='Email' />
              <input type="text" placeholder='Ваш текст' />
              <button type="submit">Отправить</button>
            </form>
          </div>
        </div>
      </CenterBlock>

      <div className={styles.line}></div>

      <CenterBlock>
        <div className={styles.orgInfo}>
          <div className={styles.infoCol}>
            <div className={styles.name}>
              2021 - 2026 © АНО “Карачаево-Черкесия Туризм" ОГРН 1210900001333  ИНН 0917041946
            </div>
            <div className={styles.links}>
              <Link href={"/#"}>Политика обработки персональных данных</Link>
              <Link href={"/#"}>Правила использования сервиса</Link>
            </div>
          </div>
          <div className={styles.partners}>
            <Link href={"/#"} target='_blank'><img src="/kch_tourism.png" alt="" /></Link>
            <Link href={"/#"} target='_blank'><img src="/min_tourism.png" alt="" /></Link>
            <Link href={"/#"} target='_blank'><img src="/nac_project.png" alt="" /></Link>
          </div>
        </div>
      </CenterBlock>
    </footer>
  )
}
