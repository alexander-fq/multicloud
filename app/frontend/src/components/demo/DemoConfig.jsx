import { useState, useMemo } from 'react'

const PROVIDERS = [
  { id: 'aws',        label: 'Amazon Web Services', short: 'AWS',  color: '#FF9900' },
  { id: 'azure',      label: 'Microsoft Azure',     short: 'AZU',  color: '#0078D4' },
  { id: 'gcp',        label: 'Google Cloud',         short: 'GCP',  color: '#4285F4' },
  { id: 'oci',        label: 'Oracle Cloud Infra',   short: 'OCI',  color: '#F80000' },
  { id: 'on-premise', label: 'On-Premise / Legacy',  short: 'ON\nPREM', color: '#64748b' },
]

const WORKLOADS = [
  { value: 'web-application', label: 'Web Services (Nginx/Apache)' },
  { value: 'microservices',   label: 'Microservices (K8s/Docker)' },
  { value: 'database',        label: 'Base de Datos SQL/NoSQL' },
  { value: 'big-data',        label: 'Big Data Analytics' },
  { value: 'ml-ai',           label: 'Machine Learning / AI' },
  { value: 'legacy',          label: 'Legacy Systems' },
]

const REGIONS = [
  'Latam-South (Santiago, CL)',
  'Latam-East (Sao Paulo, BR)',
  'US-East (Virginia, USA)',
  'Europe-West (Madrid, ES)',
  'Asia-Pacific (Tokyo, JP)',
]

const COMPLIANCE_OPTIONS = ['HIPAA', 'PCI-DSS', 'GDPR', 'SOX', 'FedRAMP', 'ISO 27001']

const STRATEGIES = [
  { value: 'big-bang',   label: 'Big Bang',     desc: 'Transferencia directa, downtime controlado.' },
  { value: 'blue-green', label: 'Blue / Green', desc: 'Dos ambientes identicos, cambio via DNS.' },
  { value: 'canary',     label: 'Canary',       desc: 'Rollout progresivo por grupos de usuarios.' },
]

export default function DemoConfig({ onStart }) {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [appName, setAppName] = useState('')
  const [workload, setWorkload] = useState('microservices')
  const [region, setRegion] = useState(REGIONS[2])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dataSize, setDataSize] = useState(500)
  const [nodes, setNodes] = useState(12)
  const [compliance, setCompliance] = useState([])
  const [strategy, setStrategy] = useState('blue-green')
  const [maintenance, setMaintenance] = useState(false)

  const canStart = origin && destination

  const summary = useMemo(() => {
    if (!canStart) return null
    const timeMin = Math.round((dataSize / 10) + (nodes * 2))
    const cost = Math.round((dataSize * 0.15) + (nodes * 45))
    const complexity = Math.min(100, (dataSize / 100) + nodes)
    return { timeMin, cost, complexity }
  }, [canStart, dataSize, nodes])

  const dataSizeLabel = dataSize >= 1000 ? `${(dataSize / 1024).toFixed(1)} TB` : `${dataSize} GB`

  const toggleCompliance = (item) => {
    setCompliance(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canStart) return
    onStart({
      origin, destination, appName, workload, region,
      dataSize, nodes, compliance, strategy, maintenance,
    })
  }

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Configurar Nueva Migracion
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Selecciona los parametros de origen, destino y opciones avanzadas para iniciar la simulacion
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cloud Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6">
            {/* Origin */}
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                ORIGEN
              </h3>
              <div className="space-y-2">
                {PROVIDERS.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => {
                      setOrigin(p.id)
                      if (destination === p.id) setDestination(null)
                    }}
                    className={`w-full p-3 border-2 rounded-xl flex items-center gap-3 text-left transition-all
                      ${origin === p.id ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:border-purple-200'}`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: p.color }}>
                      {p.short.includes('\n') ? <span className="text-[9px] text-center leading-tight whitespace-pre">{p.short}</span> : p.short}
                    </div>
                    <span className="font-semibold text-sm text-slate-800">{p.label}</span>
                    {origin === p.id && <span className="ml-auto text-purple-500 font-bold">&#10003;</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center pt-12">
              <span className="text-slate-300 text-3xl animate-pulse-arrow">&#8594;</span>
            </div>

            {/* Destination */}
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                DESTINO
              </h3>
              <div className="space-y-2">
                {PROVIDERS.map(p => {
                  const disabled = p.id === origin
                  return (
                    <button key={p.id} type="button"
                      disabled={disabled}
                      onClick={() => setDestination(p.id)}
                      className={`w-full p-3 border-2 rounded-xl flex items-center gap-3 text-left transition-all
                        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                        ${destination === p.id && !disabled ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: p.color }}>
                        {p.short.includes('\n') ? <span className="text-[9px] text-center leading-tight whitespace-pre">{p.short}</span> : p.short}
                      </div>
                      <span className="font-semibold text-sm text-slate-800">{p.label}</span>
                      {disabled && <span className="ml-auto text-xs text-slate-400">Origen</span>}
                      {destination === p.id && !disabled && <span className="ml-auto text-emerald-500 font-bold">&#10003;</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                Nombre de Aplicacion
              </label>
              <input type="text" value={appName} onChange={e => setAppName(e.target.value)}
                placeholder="ej: govtech-tramites-prod"
                className="w-full border-slate-200 rounded-lg focus:ring-gov-primary focus:border-gov-primary font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                Tipo de Carga
              </label>
              <select value={workload} onChange={e => setWorkload(e.target.value)}
                className="w-full border-slate-200 rounded-lg focus:ring-gov-primary focus:border-gov-primary text-sm">
                {WORKLOADS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                Region de Destino
              </label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                className="w-full border-slate-200 rounded-lg focus:ring-gov-primary focus:border-gov-primary text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-gov-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Opciones Avanzadas
            </span>
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="p-6 space-y-8 border-t border-slate-200 animate-fade-in">
              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Volumen de Datos</label>
                    <span className="font-mono text-gov-primary font-bold">{dataSizeLabel}</span>
                  </div>
                  <input type="range" min="10" max="10000" value={dataSize}
                    onChange={e => setDataSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gov-primary" />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-1">
                    <span>10 GB</span><span>10 TB</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instancias / Nodos</label>
                    <span className="font-mono text-gov-primary font-bold">{nodes}</span>
                  </div>
                  <input type="range" min="1" max="100" value={nodes}
                    onChange={e => setNodes(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gov-primary" />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-1">
                    <span>1</span><span>100</span>
                  </div>
                </div>
              </div>

              {/* Compliance */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Cumplimiento y Regulaciones</label>
                <div className="flex flex-wrap gap-2">
                  {COMPLIANCE_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => toggleCompliance(c)}
                      className={`px-4 py-2 border rounded-full text-xs font-bold transition-all ${
                        compliance.includes(c)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-slate-200 text-slate-500 hover:border-gov-success'
                      }`}>
                      {compliance.includes(c) && <span className="mr-1">&#10003;</span>}
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Estrategia de Migracion</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {STRATEGIES.map(s => (
                    <label key={s.value} className="cursor-pointer">
                      <input type="radio" name="strategy" value={s.value} checked={strategy === s.value}
                        onChange={() => setStrategy(s.value)} className="hidden peer" />
                      <div className="p-4 border border-slate-200 rounded-xl peer-checked:border-gov-primary peer-checked:bg-blue-50 transition-all">
                        <div className="font-bold text-sm text-slate-800">{s.label}</div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-1">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Maintenance */}
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={maintenance}
                    onChange={() => setMaintenance(!maintenance)} />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-gov-primary
                    after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                    peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm font-medium text-slate-600">Ventana de Mantenimiento</span>
                {maintenance && (
                  <input type="datetime-local"
                    className="border-slate-200 rounded-lg text-sm font-mono focus:ring-gov-primary ml-2" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Summary */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Resumen de Operacion</div>
            <div className="text-2xl font-bold font-mono">
              <span className="text-purple-400">{origin ? PROVIDERS.find(p => p.id === origin)?.short.replace('\n', '') : '---'}</span>
              <span className="text-slate-600 mx-2">&#8594;</span>
              <span className="text-emerald-400">{destination ? PROVIDERS.find(p => p.id === destination)?.short.replace('\n', '') : '---'}</span>
            </div>
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Tiempo Est.</div>
                <div className="text-xl font-bold font-mono">~{summary.timeMin} min</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Costo Est.</div>
                <div className="text-xl font-bold font-mono">${summary.cost.toLocaleString()}/mo</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Complejidad</div>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    summary.complexity > 70 ? 'bg-red-500' : summary.complexity > 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`} style={{ width: `${summary.complexity}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button type="submit" disabled={!canStart}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-gov-primary to-gov-accent text-white font-bold text-xl
            shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            transform hover:scale-[1.01] active:scale-[0.99]
            flex items-center justify-center gap-3">
          Iniciar Migracion
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
        <p className="text-center text-sm text-slate-400 -mt-3">
          La simulacion ejecutara 25 pasos de transformacion en 5 fases
        </p>
      </form>
    </div>
  )
}
