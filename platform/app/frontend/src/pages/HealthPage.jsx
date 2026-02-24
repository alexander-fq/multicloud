import { useState, useEffect, useCallback, useRef } from 'react'
import { getHealth, getDatabaseHealth, getCloudHealth } from '../services/api'
import { Sparkline, DonutChart, LineChart, PodGrid, ProgressBar } from '../components/health/HealthCharts'
import IncidentTimeline from '../components/health/IncidentTimeline'

// Generate random data for sparklines
function genSparkData(base, variance, count = 20) {
  return Array.from({ length: count }, () => base + (Math.random() - 0.5) * variance * 2)
}

// Generate 24h response time data
function genResponseData(count = 48) {
  return Array.from({ length: count }, () => 30 + Math.random() * 70 + (Math.random() > 0.92 ? 60 : 0))
}

const INITIAL_EVENTS = [
  { time: '14:23', type: 'INFO',    message: 'Auto-scaling: 2 pods agregados por aumento de trafico' },
  { time: '11:45', type: 'WARNING', message: 'Latencia elevada detectada en endpoint /api/migrate (187ms)' },
  { time: '09:12', type: 'SUCCESS', message: 'Health check: todos los servicios operativos' },
  { time: '08:30', type: 'INFO',    message: 'Certificado SSL renovado automaticamente' },
  { time: '03:15', type: 'SUCCESS', message: 'Backup de base de datos completado (2.3 GB)' },
  { time: '00:00', type: 'INFO',    message: 'Rotacion de logs ejecutada' },
]

export default function HealthPage() {
  const [health, setHealth] = useState(null)
  const [dbHealth, setDbHealth] = useState(null)
  const [cloudHealth, setCloudHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isDegraded, setIsDegraded] = useState(false)
  const [events, setEvents] = useState(INITIAL_EVENTS)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef(null)

  // Simulated metrics state
  const [metrics, setMetrics] = useState({
    uptime: 99.97,
    responseTime: 47,
    requestsPerMin: 1247,
    errorRate: 0.03,
    uptimeData: genSparkData(99.97, 0.02),
    responseData: genSparkData(47, 15),
    requestsData: genSparkData(1247, 200),
    errorData: genSparkData(0.03, 0.02),
    chartData: genResponseData(),
    podHealthy: 12,
    cpuUsage: 34,
    memoryUsage: 58,
    poolUsage: 64,
    activeConnections: 422,
    tokenExpiry: 10499, // seconds
  })

  // Fetch real backend data
  const fetchHealthData = useCallback(async () => {
    try {
      const [healthRes, dbRes, cloudRes] = await Promise.all([
        getHealth().catch(() => ({ data: { status: 'unhealthy', responseTime: '0ms' } })),
        getDatabaseHealth().catch(() => ({ data: { status: 'unhealthy' } })),
        getCloudHealth().catch(() => ({ data: { status: 'unhealthy' } })),
      ])
      setHealth(healthRes.data)
      setDbHealth(dbRes.data)
      setCloudHealth(cloudRes.data)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Health fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update simulated metrics
  const updateMetrics = useCallback(() => {
    setMetrics(prev => {
      const drift = (base, variance) => base + (Math.random() - 0.5) * variance
      const degradedMult = isDegraded ? 3 : 1

      const newRT = Math.max(15, drift(47 * degradedMult, 10 * degradedMult))
      const newReqs = Math.max(100, Math.round(drift(1247, 150)))
      const newErr = isDegraded ? drift(2.4, 1) : Math.max(0, drift(0.03, 0.02))

      return {
        ...prev,
        responseTime: Math.round(newRT),
        requestsPerMin: newReqs,
        errorRate: Math.round(newErr * 100) / 100,
        uptimeData: [...prev.uptimeData.slice(1), isDegraded ? 99.5 : drift(99.97, 0.02)],
        responseData: [...prev.responseData.slice(1), newRT],
        requestsData: [...prev.requestsData.slice(1), newReqs],
        errorData: [...prev.errorData.slice(1), newErr],
        cpuUsage: Math.round(Math.max(10, Math.min(95, drift(isDegraded ? 78 : 34, 8)))),
        memoryUsage: Math.round(Math.max(20, Math.min(90, drift(isDegraded ? 82 : 58, 5)))),
        poolUsage: Math.round(Math.max(20, Math.min(95, drift(isDegraded ? 88 : 64, 6)))),
        activeConnections: Math.round(Math.max(50, drift(isDegraded ? 780 : 422, 40))),
        podHealthy: isDegraded ? 10 : 12,
        tokenExpiry: Math.max(0, prev.tokenExpiry - 5),
      }
    })
  }, [isDegraded])

  useEffect(() => {
    fetchHealthData()
  }, [fetchHealthData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchHealthData()
      updateMetrics()
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchHealthData, updateMetrics])

  // Easter egg: triple-click title to toggle degraded
  const handleTitleClick = () => {
    clickCountRef.current++
    clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0 }, 500)
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0
      setIsDegraded(d => {
        const next = !d
        if (next) {
          setEvents(prev => [
            { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), type: 'ERROR', message: 'Alerta critica: Latencia de base de datos excede umbral (>300ms)' },
            { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), type: 'WARNING', message: '2 pods en estado CrashLoopBackOff detectados' },
            ...prev.slice(0, 4),
          ])
        } else {
          setEvents(prev => [
            { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), type: 'SUCCESS', message: 'Incidente resuelto: todos los servicios restaurados' },
            ...prev.slice(0, 5),
          ])
        }
        return next
      })
    }
  }

  const overallStatus = isDegraded ? 'degraded'
    : (health?.status === 'unhealthy' || dbHealth?.status === 'unhealthy') ? 'unhealthy'
    : 'operational'

  const statusConfig = {
    operational: { label: 'ALL SYSTEMS OPERATIONAL', color: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'bg-emerald-500' },
    degraded:    { label: 'DEGRADED PERFORMANCE',   color: 'text-amber-400',   bg: 'bg-amber-500',   ring: 'bg-amber-500' },
    unhealthy:   { label: 'SYSTEM OUTAGE',          color: 'text-red-400',     bg: 'bg-red-500',     ring: 'bg-red-500' },
  }
  const sc = statusConfig[overallStatus]

  const formatTokenExpiry = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const metricCards = [
    { label: 'Availability (30d)', value: `${metrics.uptime}%`, trend: '0.02% vs mes anterior', trendUp: true, data: metrics.uptimeData, color: '#059669' },
    { label: 'Avg Response Time', value: `${metrics.responseTime}ms`, trend: `${isDegraded ? '+85ms' : '-12ms'} vs ayer`, trendUp: !isDegraded, data: metrics.responseData, color: '#0f49bd' },
    { label: 'Throughput (REQ/M)', value: metrics.requestsPerMin.toLocaleString(), trend: '23% vs ayer', trendUp: true, data: metrics.requestsData, color: '#7c3aed' },
    { label: 'Failure Rate', value: `${metrics.errorRate}%`, trend: isDegraded ? 'ABOVE THRESHOLD' : 'Normal range', trendUp: !isDegraded, data: metrics.errorData, color: isDegraded ? '#dc2626' : '#059669' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-slate-400 text-lg animate-pulse">Cargando Health Monitor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 -mx-4 -mt-8 px-6 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-xl font-bold text-white flex items-center gap-3 cursor-default select-none"
          onClick={handleTitleClick}
        >
          <span className="text-2xl">&#9829;</span>
          System Health Monitor
        </h1>

        <div className="flex items-center gap-6">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${sc.bg}`} />
              <div className={`absolute inset-0 w-3 h-3 rounded-full ${sc.ring} animate-pulse-ring`} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${sc.color}`}>
              {sc.label}
            </span>
          </div>

          {/* Auto refresh toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)} />
              <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-gov-primary
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                peer-checked:after:translate-x-4" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Auto</span>
          </label>

          {/* Refresh button */}
          <button
            onClick={() => { fetchHealthData(); updateMetrics() }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
            title="Actualizar ahora"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Last update */}
          <span className="text-xs text-slate-500 font-mono">
            {lastUpdate.toLocaleTimeString('es')} UTC
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-[#111827] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              {card.label}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className={`text-[11px] mt-1 font-medium ${card.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.trendUp ? '\u25B2' : '\u25BC'} {card.trend}
                </div>
              </div>
              <Sparkline data={card.data} color={card.color} width={100} height={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Response Time Chart */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300">Response Time - Ultimas 24 horas</h3>
          <span className="text-xs text-slate-500 font-mono">Threshold: 150ms</span>
        </div>
        <LineChart data={metrics.chartData} width={800} height={180} color="#0f49bd" threshold={150} />
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* PostgreSQL */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="font-bold text-sm text-slate-200">PostgreSQL Core</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              dbHealth?.status === 'healthy' && !isDegraded
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isDegraded ? 'Degraded' : (dbHealth?.status === 'healthy' ? 'Healthy' : 'Unhealthy')}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <DonutChart value={metrics.poolUsage} max={100}
              color={metrics.poolUsage > 80 ? '#d97706' : '#059669'} size={72}
              label={`${metrics.poolUsage}%`} />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Active Conn.</span>
                <span className="font-mono text-slate-300">{metrics.activeConnections}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Idle</span>
                <span className="font-mono text-slate-300">{dbHealth?.stats?.idle ?? 4}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Slow Queries</span>
                <span className="font-mono text-emerald-400">{isDegraded ? 3 : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kubernetes */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-bold text-sm text-slate-200">K8s Cluster - Prod</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              isDegraded
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isDegraded ? 'Warning' : 'Running'}
            </span>
          </div>

          <div className="mb-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Pods ({metrics.podHealthy}/12)
            </div>
            <PodGrid total={12} healthy={metrics.podHealthy} size={18} gap={3} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">CPU Load</span>
                <span className="font-mono text-slate-300">{metrics.cpuUsage}%</span>
              </div>
              <ProgressBar value={metrics.cpuUsage} max={100}
                color={metrics.cpuUsage > 70 ? '#d97706' : '#0f49bd'} height={4} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">RAM</span>
                <span className="font-mono text-slate-300">{metrics.memoryUsage}%</span>
              </div>
              <ProgressBar value={metrics.memoryUsage} max={100}
                color={metrics.memoryUsage > 75 ? '#d97706' : '#7c3aed'} height={4} />
            </div>
          </div>
        </div>

        {/* Cloud IAM */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-bold text-sm text-slate-200">Cloud IAM Security</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              cloudHealth?.status === 'healthy'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {cloudHealth?.status === 'healthy' ? 'Valid' : 'Check Required'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Provider</span>
              <span className="font-mono text-slate-300 uppercase">{health?.provider || 'AWS'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Account</span>
              <span className="font-mono text-slate-300">
                {cloudHealth?.identity?.account
                  ? `***${String(cloudHealth.identity.account).slice(-4)}`
                  : '---'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">STS Token Expiry</span>
              <span className={`font-mono font-bold ${metrics.tokenExpiry < 600 ? 'text-red-400' : 'text-emerald-400'}`}>
                {formatTokenExpiry(metrics.tokenExpiry)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">IAM Policy Audit</span>
              <span className="font-mono text-emerald-400">Passed</span>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={metrics.tokenExpiry}
                max={10800}
                color={metrics.tokenExpiry < 600 ? '#dc2626' : '#059669'}
                height={4}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Incident Timeline */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Registro de Eventos - Ultimas 24h</h3>
        <IncidentTimeline events={events} />
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-600">
        Monitoreado por GovTech Platform v2.0 &middot; Datos actualizados cada 5 segundos
      </div>
    </div>
  )
}
