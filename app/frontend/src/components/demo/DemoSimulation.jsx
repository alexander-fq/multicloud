import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const PHASE_COLORS = {
  1: { bg: 'bg-blue-500',   text: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   label: 'Discovery & Analysis' },
  2: { bg: 'bg-purple-500', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Code Transformation' },
  3: { bg: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Data Migration' },
  4: { bg: 'bg-green-500',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-300 border-green-500/30',   label: 'Infrastructure Deploy' },
  5: { bg: 'bg-indigo-500', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Validation & Testing' },
}

export default function DemoSimulation({ config, onReset }) {
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isAccelerated, setIsAccelerated] = useState(false)
  const [timer, setTimer] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [summary, setSummary] = useState(null)
  const [visibleLogs, setVisibleLogs] = useState([])
  const logRef = useRef(null)
  const timerRef = useRef(null)
  const autoRef = useRef(null)

  // Fetch transformation data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post('/api/demo/transform', {
          sourceProvider: config.origin,
          targetProvider: config.destination,
          dataSize: config.dataSize,
          serverCount: config.nodes,
        })
        setSteps(res.data.steps || [])
        setSummary(res.data.summary || null)
        setLoading(false)
      } catch (err) {
        setError('Error al conectar con el backend de transformacion')
        setLoading(false)
      }
    }
    fetchData()
  }, [config])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused && !completed) {
        setTimer(t => t + 1)
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [isPaused, completed])

  // Auto-advance steps
  const advanceStep = useCallback(() => {
    if (isPaused || completed || steps.length === 0) return
    setCurrentStep(prev => {
      if (prev >= steps.length - 1) {
        setCompleted(true)
        return prev
      }
      return prev + 1
    })
  }, [isPaused, completed, steps.length])

  useEffect(() => {
    if (loading || steps.length === 0 || completed) return
    const delay = isAccelerated ? 1500 : 3000
    autoRef.current = setTimeout(advanceStep, delay)
    return () => clearTimeout(autoRef.current)
  }, [currentStep, loading, isAccelerated, advanceStep, steps.length, completed])

  // Animate logs for current step
  useEffect(() => {
    if (!steps[currentStep]?.logs) return
    setVisibleLogs([])
    const logs = steps[currentStep].logs
    logs.forEach((log, i) => {
      setTimeout(() => {
        setVisibleLogs(prev => [...prev, log])
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
      }, i * (isAccelerated ? 150 : 300))
    })
  }, [currentStep, steps, isAccelerated])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const progressPct = steps.length > 0 ? Math.round(((currentStep + 1) / steps.length) * 100) : 0
  const step = steps[currentStep]
  const phase = step ? PHASE_COLORS[step.phase] || PHASE_COLORS[1] : PHASE_COLORS[1]

  // Group steps by phase for sidebar
  const phases = steps.reduce((acc, s, i) => {
    const p = s.phase || 1
    if (!acc[p]) acc[p] = { steps: [], label: PHASE_COLORS[p]?.label || `Phase ${p}` }
    acc[p].steps.push({ ...s, index: i })
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 animate-pulse text-lg">Cargando pasos de transformacion...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button onClick={onReset} className="btn-primary">Volver a Configuracion</button>
      </div>
    )
  }

  // Completion screen
  if (completed) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 animate-fade-in-up">
        <div className="text-5xl mb-4">&#10004;</div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Migracion Completada con Exito</h2>
        <p className="text-slate-500 mb-8">
          {config.origin?.toUpperCase()} &#8594; {config.destination?.toUpperCase()} en {formatTime(timer)}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pasos ejecutados', value: steps.length },
            { label: 'Archivos transformados', value: summary?.filesTransformed || 47 },
            { label: 'Datos transferidos', value: `${summary?.dataTransferred || config.dataSize} GB` },
            { label: 'Tests pasados', value: `${summary?.testsPassed || 23}/23` },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold font-mono text-gov-primary">{m.value}</div>
              <div className="text-xs text-slate-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={onReset}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-gov-primary to-gov-accent text-white font-bold shadow-lg hover:shadow-xl transition-all">
            Nueva Migracion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 -mt-8 animate-fade-in">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 bg-white overflow-y-auto no-scrollbar flex-shrink-0">
        <div className="p-4 space-y-6">
          {Object.entries(phases).map(([phaseNum, phaseData]) => (
            <div key={phaseNum}>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                Fase {phaseNum}: {phaseData.label}
                <span className="h-px flex-1 bg-slate-100" />
              </h3>
              <div className="space-y-0.5">
                {phaseData.steps.map((s) => {
                  const isCurrent = s.index === currentStep
                  const isDone = s.index < currentStep
                  const isPending = s.index > currentStep

                  return (
                    <div key={s.index}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                        ${isCurrent ? 'bg-purple-50 border border-purple-200 animate-pulse-glow font-semibold text-slate-900' : ''}
                        ${isDone ? 'text-slate-400' : ''}
                        ${isPending ? 'text-slate-400 opacity-50' : ''}`}
                    >
                      {isDone && <span className="text-emerald-500 text-base">&#10003;</span>}
                      {isCurrent && (
                        <svg className="w-4 h-4 text-purple-500 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      {isPending && <span className="text-xs font-bold w-4 text-center">{s.index + 1}</span>}
                      <span className="truncate text-xs">{s.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Main Card */}
        <div className="flex-1 m-4 rounded-xl flex flex-col shadow-xl overflow-hidden bg-[#0b0f19] border border-slate-800">
          {/* Card Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0d1117]">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${phase.badge} border flex items-center justify-center`}>
                <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`${phase.badge} border text-[10px] font-bold px-2 py-0.5 rounded uppercase`}>
                    Fase {step?.phase}: {phase.label}
                  </span>
                  <span className="text-slate-500 text-xs">~{step?.duration || '3s'}</span>
                </div>
                <h2 className="text-lg font-bold text-white">{step?.name || 'Cargando...'}</h2>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Progreso</span>
              <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gov-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs text-gov-primary font-bold font-mono mt-1">{progressPct}%</span>
            </div>
          </div>

          {/* Code Diff / Content */}
          <div className="flex-1 overflow-hidden">
            {step?.codeBefore && step?.codeAfter ? (
              <div className="flex h-full">
                {/* Before */}
                <div className="flex-1 flex flex-col border-r border-slate-800">
                  <div className="px-4 py-2 bg-[#161b22] border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      ANTES ({config.origin?.toUpperCase()})
                    </span>
                  </div>
                  <pre className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-auto bg-[#0d1117] whitespace-pre-wrap">
                    {step.codeBefore}
                  </pre>
                </div>
                {/* After */}
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2 bg-[#161b22] border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">
                      DESPUES ({config.destination?.toUpperCase()})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-bold">Transformado</span>
                    </span>
                  </div>
                  <pre className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-auto bg-[#0d1117] whitespace-pre-wrap">
                    {step.codeAfter}
                  </pre>
                </div>
              </div>
            ) : step?.details ? (
              <div className="p-6 space-y-3 overflow-auto h-full bg-[#0d1117]">
                {Object.entries(step.details).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-emerald-500">&#10003;</span>
                    <span className="text-slate-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="text-slate-200 font-mono text-sm">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-[#0d1117]">
                <div className="text-slate-500 animate-pulse">Procesando paso {currentStep + 1}...</div>
              </div>
            )}
          </div>

          {/* Terminal Logs */}
          <div className="h-36 border-t border-slate-800 flex flex-col">
            <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-800 bg-[#161b22]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">&#9658;</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pipeline Logs</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">tty1 -- active</span>
            </div>
            <div ref={logRef} className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-0.5 bg-[#0d1117]">
              {visibleLogs.map((log, i) => {
                const isSuccess = log.includes('[SUCCESS]') || log.includes('completado') || log.includes('exitoso')
                const isWarning = log.includes('[WARNING]') || log.includes('advertencia')
                const isError = log.includes('[ERROR]')
                const color = isError ? 'text-red-400' : isSuccess ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-slate-300'
                return (
                  <div key={i} className={`${color} animate-fade-in`}>
                    <span className="text-slate-600">[{new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    {' '}{log}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Accelerate toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={isAccelerated}
                  onChange={() => setIsAccelerated(!isAccelerated)} />
                <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-gov-primary
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                  after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                  peer-checked:after:translate-x-4" />
              </div>
              <span className="text-sm text-slate-500 uppercase tracking-tight font-medium">Acelerar</span>
            </label>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono font-bold text-slate-700 text-lg tracking-widest">{formatTime(timer)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setIsPaused(!isPaused)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors flex items-center gap-2">
              {isPaused ? (
                <><span>&#9654;</span> Reanudar</>
              ) : (
                <><span>&#10074;&#10074;</span> Pausar</>
              )}
            </button>

            <button
              onClick={() => {
                clearTimeout(autoRef.current)
                if (currentStep >= steps.length - 1) {
                  setCompleted(true)
                } else {
                  setCurrentStep(prev => prev + 1)
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-gov-primary text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-gov-primary/20 flex items-center gap-2">
              Siguiente Paso
              <span>&#8594;</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
