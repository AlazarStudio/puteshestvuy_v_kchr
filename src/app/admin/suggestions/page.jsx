import { useState } from 'react'
import PlaceSuggestionsTab from './PlaceSuggestionsTab'
import EventSuggestionsTab from './EventSuggestionsTab'
import styles from './suggestions.module.css'

const TABS = [
  { id: 'places', label: 'Места' },
  { id: 'events', label: 'События' },
]

export default function AdminSuggestionsPage() {
  const [tab, setTab] = useState('places')

  return (
    <div>
      <div className={styles.sectionTabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.sectionTab} ${tab === t.id ? styles.sectionTabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'places' && <PlaceSuggestionsTab />}
      {tab === 'events' && <EventSuggestionsTab />}
    </div>
  )
}
