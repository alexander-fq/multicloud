const typeConfig = {
  INFO:    { bg: 'bg-blue-500/20',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  SUCCESS: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  WARNING: { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  ERROR:   { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30' },
}

export default function IncidentTimeline({ events = [] }) {
  return (
    <div className="space-y-2">
      {events.map((event, i) => {
        const cfg = typeConfig[event.type] || typeConfig.INFO
        return (
          <div
            key={i}
            className="flex items-start gap-4 px-4 py-2.5 rounded-lg bg-gray-900/50 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
          >
            <span className="text-slate-500 font-mono text-xs whitespace-nowrap pt-0.5">
              [{event.time}]
            </span>
            <span className={`${cfg.bg} ${cfg.text} ${cfg.border} border px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap`}>
              {event.type}
            </span>
            <span className="text-slate-300 text-sm leading-snug">
              {event.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
