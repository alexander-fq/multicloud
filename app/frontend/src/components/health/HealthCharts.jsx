// SVG Chart components for Health Dashboard - No external libraries

export function Sparkline({ data = [], color = '#059669', width = 120, height = 32 }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DonutChart({ value = 0, max = 100, color = '#059669', size = 80, label = '' }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)
  const offset = circumference * (1 - pct)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1f2937" strokeWidth="6"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xs font-bold font-mono" style={{ color }}>
        {label || `${Math.round(pct * 100)}%`}
      </span>
    </div>
  )
}

export function GaugeChart({ value = 0, max = 100, color = '#059669', size = 100 }) {
  const pct = Math.min(value / max, 1)
  const radius = (size - 12) / 2
  const halfCircumference = Math.PI * radius
  const offset = halfCircumference * (1 - pct)

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size / 2 + 16 }}>
      <svg width={size} height={size / 2 + 4} className="overflow-visible">
        <path
          d={`M 6 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke="#1f2937" strokeWidth="8" strokeLinecap="round"
        />
        <path
          d={`M 6 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={halfCircumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-sm font-bold font-mono -mt-3" style={{ color }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  )
}

export function LineChart({ data = [], width = 600, height = 200, color = '#0f49bd', threshold = null }) {
  if (data.length < 2) return null
  const padding = { top: 16, right: 16, bottom: 24, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const max = Math.max(...data, threshold || 0) * 1.1
  const min = 0

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW
    const y = padding.top + chartH - ((v - min) / (max - min)) * chartH
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${padding.left},${padding.top + chartH} ${points} ${padding.left + chartW},${padding.top + chartH}`

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const y = padding.top + chartH * (1 - pct)
    const label = Math.round(min + (max - min) * pct)
    return { y, label }
  })

  const hours = Array.from({ length: 7 }, (_, i) => {
    const h = Math.round((i / 6) * 23)
    return { x: padding.left + (i / 6) * chartW, label: `${h}:00` }
  })

  const gradientId = `gradient-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y}
            stroke="#1f2937" strokeWidth="1" />
          <text x={padding.left - 6} y={g.y + 4} fill="#64748b" fontSize="9"
            textAnchor="end" fontFamily="JetBrains Mono, monospace">{g.label}</text>
        </g>
      ))}

      {hours.map((h, i) => (
        <text key={i} x={h.x} y={height - 4} fill="#64748b" fontSize="9"
          textAnchor="middle" fontFamily="JetBrains Mono, monospace">{h.label}</text>
      ))}

      <polygon points={areaPoints} fill={`url(#${gradientId})`} />

      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {threshold && (
        <line
          x1={padding.left} y1={padding.top + chartH - ((threshold - min) / (max - min)) * chartH}
          x2={width - padding.right} y2={padding.top + chartH - ((threshold - min) / (max - min)) * chartH}
          stroke="#dc2626" strokeWidth="1" strokeDasharray="6 4" opacity="0.6"
        />
      )}
    </svg>
  )
}

export function PodGrid({ total = 12, healthy = 12, size = 20, gap = 4 }) {
  const pods = Array.from({ length: total }, (_, i) => i < healthy)
  const cols = Math.ceil(Math.sqrt(total))

  return (
    <div className="flex flex-wrap" style={{ gap: `${gap}px`, maxWidth: (size + gap) * cols }}>
      {pods.map((isHealthy, i) => (
        <div
          key={i}
          className={`rounded transition-colors duration-300 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
          style={{ width: size, height: size }}
          title={`Pod ${i + 1}: ${isHealthy ? 'Running' : 'Degraded'}`}
        />
      ))}
    </div>
  )
}

export function ProgressBar({ value = 0, max = 100, color = '#059669', height = 6, showLabel = false }) {
  const pct = Math.min((value / max) * 100, 100)

  return (
    <div className="w-full">
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#1f2937' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono mt-1 block" style={{ color }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
