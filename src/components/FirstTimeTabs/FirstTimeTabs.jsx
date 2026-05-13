import { useState, useEffect } from 'react'
import styles from './FirstTimeTabs.module.css'
import RichTextContent from '@/components/RichTextContent/RichTextContent'
// import GeoMapKCR from '@/components/GeoMapKCR/GeoMapKCR'
import ClimateChartKCR from '@/components/ClimateChartKCR/ClimateChartKCR'
import FlightRouteKCR from '@/components/FlightRouteKCR/FlightRouteKCR'

function TransportSubTabs({ transportTabs }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const tabs = (transportTabs || []).filter(t => t.key)
  if (!tabs.length) return null
  const active = tabs[activeIdx] || tabs[0]
  return (
    <div className={styles.subtabsWrap}>
      <div className={styles.subtabs}>
        {tabs.map((t, i) => (
          <button
            key={t.key}
            className={`${styles.subtab} ${i === activeIdx ? styles.subtabActive : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active.key === 'plane' && <FlightRouteKCR />}
      <RichTextContent html={active.content} />
    </div>
  )
}

function GeographySections({ sections }) {
  return (
    <>
      {(sections || []).filter(s => s.key !== 'flight_time').map(section => (
        <div key={section.key} className={styles.geographySection}>
          <h4 className={styles.geographySectionTitle}>{section.label}</h4>
          {section.key === 'climate_info' && <ClimateChartKCR />}
          <RichTextContent html={section.content} />
        </div>
      ))}
    </>
  )
}

function EmergencyContent({ sections }) {
  return (
    <>
      <div className={styles.emergencyBadge}>
        <div className={styles.emergencyIcon}>📞</div>
        <div>
          <div className={styles.emergencyNumber}>112</div>
          <div className={styles.emergencySubtitle}>единый телефон для всех экстренных служб</div>
        </div>
      </div>
      <div className={styles.emergencySectionsGrid}>
        {(sections || []).map(section => (
          <div key={section.key} id={`emergency-${section.key}`} className={styles.emergencySection}>
            <h4 className={styles.emergencySectionTitle}>{section.label}</h4>
            <RichTextContent html={section.content} />
          </div>
        ))}
      </div>
    </>
  )
}

export default function FirstTimeTabs({ tabs, activeTabKey, scrollToId }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!activeTabKey) return
    const idx = tabs.findIndex(t => t.key === activeTabKey)
    if (idx >= 0) setActiveIndex(idx)
  }, [activeTabKey, tabs])

  useEffect(() => {
    if (!scrollToId) return
    const timer = setTimeout(() => {
      const el = document.getElementById(scrollToId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
    return () => clearTimeout(timer)
  }, [scrollToId])

  if (!Array.isArray(tabs) || tabs.length === 0) return null

  const activeTab = tabs[activeIndex] || tabs[0]

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.key || i}
            role="tab"
            aria-selected={i === activeIndex}
            className={`${styles.tab} ${i === activeIndex ? styles.tabActive : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div key={activeTab.key || activeIndex} className={styles.content} role="tabpanel">
        {activeTab.type === 'geography' && <GeographySections sections={activeTab.geographySections} />}
        {activeTab.type === 'transport' && <TransportSubTabs transportTabs={activeTab.transportTabs} />}
        {activeTab.type === 'emergency' && <EmergencyContent sections={activeTab.emergencySections} />}
        {activeTab.type !== 'geography' && activeTab.type !== 'transport' && activeTab.type !== 'emergency' && (
          <RichTextContent html={activeTab.content} />
        )}
      </div>
    </div>
  )
}
