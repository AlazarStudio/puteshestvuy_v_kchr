import styles from './ClimateChartKCR.module.css'

const MIN = -20
const MAX = 35
const TOTAL = MAX - MIN // 55

// Cherkessk (capital, ~500m): winter -3..+5, summer +21..+32
const WINTER_MIN = -3
const WINTER_MAX = 5
const SUMMER_MIN = 21
const SUMMER_MAX = 32

const W = 700
const PAD_L = 40
const PAD_R = 30
const BAR_W = W - PAD_L - PAD_R
const BAR_H = 56
const BAR_Y = 32

function tx(t) {
  return PAD_L + ((t - MIN) / TOTAL) * BAR_W
}

const ZERO_X = tx(0)

const ticks = []
for (let t = MIN; t <= MAX; t += 2) ticks.push(t)

export default function ClimateChartKCR() {
  const winterX = tx(WINTER_MIN)
  const winterW = tx(WINTER_MAX) - winterX
  const summerX = tx(SUMMER_MIN)
  const summerW = tx(SUMMER_MAX) - summerX

  const winterLabelX = (tx(WINTER_MIN) + tx(WINTER_MAX)) / 2
  const summerLabelX = (tx(SUMMER_MIN) + tx(SUMMER_MAX)) / 2

  return (
    <div className={styles.wrap}>
      <div className={styles.labels}>
        <span className={styles.labelWinter}>Зима</span>
        <span className={styles.labelSummer}>Лето</span>
      </div>
      <svg
        viewBox={`0 0 ${W} 110`}
        className={styles.svg}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="climateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="30%" stopColor="#93c5fd" />
            <stop offset={`${((-MIN) / TOTAL) * 100}%`} stopColor="#e2e8f0" />
            <stop offset="60%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <clipPath id="barClip">
            <rect x={PAD_L} y={BAR_Y} width={BAR_W} height={BAR_H} rx="28" />
          </clipPath>
        </defs>

        {/* Background gradient bar */}
        <rect x={PAD_L} y={BAR_Y} width={BAR_W} height={BAR_H} rx="28" fill="url(#climateGrad)" />

        {/* Winter zone */}
        <g clipPath="url(#barClip)">
          <rect x={winterX} y={BAR_Y} width={winterW} height={BAR_H} fill="#1d4ed8" fillOpacity="0.82" />
        </g>

        {/* Summer zone */}
        <g clipPath="url(#barClip)">
          <rect x={summerX} y={BAR_Y} width={summerW} height={BAR_H} fill="#dc2626" fillOpacity="0.82" />
        </g>

        {/* Zero line */}
        <line x1={ZERO_X} y1={BAR_Y - 4} x2={ZERO_X} y2={BAR_Y + BAR_H + 4} stroke="#475569" strokeWidth="1.5" />

        {/* Tick marks */}
        {ticks.map(t => {
          const x = tx(t)
          const big = t % 4 === 0
          return (
            <g key={t}>
              <line
                x1={x} y1={BAR_Y + BAR_H}
                x2={x} y2={BAR_Y + BAR_H + (big ? 8 : 4)}
                stroke="#94a3b8" strokeWidth="1"
              />
              {big && (
                <text x={x} y={BAR_Y + BAR_H + 18} textAnchor="middle" fontSize="10" fill="#64748b">
                  {t}
                </text>
              )}
            </g>
          )
        })}

        {/* 0°C label */}
        <text x={ZERO_X} y={BAR_Y + BAR_H + 18} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700">0°C</text>

        {/* Winter zone label */}
        <text x={winterLabelX} y={BAR_Y + BAR_H / 2 - 6} textAnchor="middle" fontSize="12" fill="white" fontWeight="700">Зима</text>
        <text x={winterLabelX} y={BAR_Y + BAR_H / 2 + 10} textAnchor="middle" fontSize="11" fill="white" opacity="0.9">
          {WINTER_MIN}°…+{WINTER_MAX}°
        </text>

        {/* Summer zone label */}
        <text x={summerLabelX} y={BAR_Y + BAR_H / 2 - 6} textAnchor="middle" fontSize="12" fill="white" fontWeight="700">Лето</text>
        <text x={summerLabelX} y={BAR_Y + BAR_H / 2 + 10} textAnchor="middle" fontSize="11" fill="white" opacity="0.9">
          +{SUMMER_MIN}°…+{SUMMER_MAX}°
        </text>
      </svg>
    </div>
  )
}
