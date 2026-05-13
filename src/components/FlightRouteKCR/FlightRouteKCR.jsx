import styles from './FlightRouteKCR.module.css'

const W = 700
const PAD = 70
const INNER_W = W - PAD * 2
const LINE_Y = 64
const DOT_R = 6

const CITIES = ['Москва', 'Мин.⁠Воды', 'Санкт-Петербург']
const POSITIONS = [0, 0.5, 1].map(t => PAD + t * INNER_W)
const SEGMENTS = [
  { from: 0, to: 1, duration: '≈ 3 ч 10 мин', flip: false },
  { from: 1, to: 2, duration: '≈ 3 ч 45 мин', flip: true },
]

export default function FlightRouteKCR() {
  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} 100`} className={styles.svg} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        {/* Dotted lines */}
        {SEGMENTS.map(seg => (
          <line
            key={`line-${seg.from}-${seg.to}`}
            x1={POSITIONS[seg.from] + DOT_R + 2}
            y1={LINE_Y}
            x2={POSITIONS[seg.to] - DOT_R - 2}
            y2={LINE_Y}
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        ))}

        {/* City dots */}
        {CITIES.map((_, i) => (
          <circle key={i} cx={POSITIONS[i]} cy={LINE_Y} r={DOT_R} fill="#1e293b" />
        ))}

        {/* Duration labels + plane icons */}
        {SEGMENTS.map(seg => {
          const midX = (POSITIONS[seg.from] + POSITIONS[seg.to]) / 2
          return (
            <g key={`seg-${seg.from}`}>
              <text x={midX} y={LINE_Y - 35} textAnchor="middle" fontSize="13" fill="#475569" fontWeight="600">
                {seg.duration}
              </text>
              <text
                x={midX}
                y={LINE_Y - 8}
                textAnchor="middle"
                fontSize="24"
                fill="#0d9488"
                transform={seg.flip ? `scale(-1,1) translate(${-midX * 2},0)` : undefined}
              >
                ✈
              </text>
            </g>
          )
        })}

        {/* City names */}
        {CITIES.map((name, i) => (
          <text
            key={`name-${i}`}
            x={POSITIONS[i]}
            y={LINE_Y + 22}
            textAnchor="middle"
            fontSize="12"
            fill="#1e293b"
          >
            {name}
          </text>
        ))}
      </svg>
    </div>
  )
}
