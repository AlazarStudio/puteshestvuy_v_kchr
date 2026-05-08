import styles from './GeoMapKCR.module.css'

export default function GeoMapKCR() {
  return (
    <div className={styles.wrap}>
      <svg
        viewBox="0 0 800 430"
        className={styles.svg}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="geoShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000015" />
          </filter>
        </defs>

        {/* Russia outline — equirectangular: lon 19→192°E, lat 82→41°N */}
        {/* x = (lon-19)*4.624  y = (82-lat)*10.488 */}
        <path
          d="M37,141
             L55,126 L72,136 L93,116 L139,100
             L209,116 L231,141
             L231,94 L250,89 L273,94
             L314,105 L357,73 L392,47 L421,63 L448,94
             L499,94 L559,115 L606,126 L661,126
             L720,147 L789,168
             L780,199 L743,209 L697,230
             L665,220 L651,283 L637,325
             L611,283 L606,241 L561,304 L561,367 L529,409
             L533,356 L467,336 L398,320 L365,315 L293,325 L251,325
             L194,325 L148,356 L150,367 L143,409 L136,424
             L115,414 L97,404
             L87,391 L83,383 L88,372 L87,367 L95,362 L97,351
             L83,336 L65,315 L58,293 L51,283
             L42,272 L37,262 L37,252 L42,236 L42,230
             L46,220 L46,168 Z"
          fill="#e2e8f0"
          stroke="#b8c4ce"
          strokeWidth="1.5"
          strokeLinejoin="round"
          filter="url(#geoShadow)"
        />

        {/* Sakhalin */}
        <ellipse cx="570" cy="355" rx="7" ry="30"
          fill="#e2e8f0" stroke="#b8c4ce" strokeWidth="1.2"
          transform="rotate(-15,570,355)" />

        {/* Regional zone lines — simulate federal subject borders */}
        <line x1="194" y1="283" x2="194" y2="325" stroke="white" strokeWidth="0.8" />
        <line x1="290" y1="283" x2="290" y2="325" stroke="white" strokeWidth="0.8" />
        <line x1="360" y1="100" x2="360" y2="320" stroke="white" strokeWidth="0.8" />
        <line x1="425" y1="200" x2="425" y2="320" stroke="white" strokeWidth="0.8" />
        <line x1="500" y1="94" x2="500" y2="315" stroke="white" strokeWidth="0.8" />
        <line x1="650" y1="126" x2="650" y2="285" stroke="white" strokeWidth="0.8" />
        <line x1="46" y1="250" x2="209" y2="250" stroke="white" strokeWidth="0.8" />
        <line x1="42" y1="283" x2="194" y2="283" stroke="white" strokeWidth="0.8" />
        <line x1="58" y1="315" x2="194" y2="315" stroke="white" strokeWidth="0.8" />
        <line x1="209" y1="200" x2="720" y2="200" stroke="white" strokeWidth="0.8" />
        <line x1="209" y1="241" x2="660" y2="241" stroke="white" strokeWidth="0.8" />
        <line x1="51" y1="283" x2="83" y2="336" stroke="white" strokeWidth="0.8" />
        <line x1="65" y1="250" x2="139" y2="325" stroke="white" strokeWidth="0.8" />
        <line x1="139" y1="100" x2="139" y2="325" stroke="white" strokeWidth="0.8" />

        {/* KCR highlighted region (~43–44.5°N, 41–43.5°E) — slightly enlarged for visibility */}
        <polygon
          points="102,390 117,390 119,408 102,409"
          fill="#f97316"
          stroke="#ea580c"
          strokeWidth="1"
        />

        {/* Moscow dot */}
        <circle cx="87" cy="275" r="5" fill="#1e293b" stroke="white" strokeWidth="1.5" />
        <text x="96" y="272" fontSize="12" fill="#1e293b" fontWeight="600">Москва</text>

        {/* Dashed arc Moscow → KCR */}
        <path
          d="M87,275 Q132,372 110,399"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="7,5"
          fill="none"
        />

        {/* Distance */}
        <text x="124" y="344" fontSize="10" fill="#38bdf8" fontWeight="600">~1 200 км</text>

        {/* KCR label */}
        <text x="122" y="402" fontSize="12" fill="#c2410c" fontWeight="700">КЧР</text>

        {/* UTC badge */}
        <rect x="618" y="16" width="162" height="54" rx="10"
          fill="white" stroke="#e2e8f0" strokeWidth="1.5"
          filter="url(#geoShadow)" />
        <text x="699" y="36" textAnchor="middle" fontSize="10"
          fill="#94a3b8" fontWeight="500" letterSpacing="1">ЧАСОВОЙ ПОЯС</text>
        <text x="699" y="58" textAnchor="middle" fontSize="20"
          fill="#1e293b" fontWeight="700">UTC+3</text>
      </svg>
    </div>
  )
}
