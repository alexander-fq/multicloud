import { useState, useEffect } from 'react'

const MESSAGES = [
  'Estableciendo conexion segura...',
  'Analizando compatibilidad de infraestructura...',
  'Preparando pipeline de datos...',
  'Verificando certificados de cumplimiento...',
  'Desplegando infraestructura de espejo...',
  'Sincronizacion inicial en curso...',
]

const PROVIDER_LABELS = {
  'aws': 'AWS', 'azure': 'AZU', 'gcp': 'GCP', 'oci': 'OCI', 'on-premise': 'ON-PREM',
}

const PROVIDER_COLORS = {
  'aws': '#FF9900', 'azure': '#0078D4', 'gcp': '#4285F4', 'oci': '#F80000', 'on-premise': '#64748b',
}

export default function DemoLoading({ origin, destination, onComplete }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => {
        if (prev >= MESSAGES.length - 1) {
          clearInterval(interval)
          setTimeout(onComplete, 800)
          return prev
        }
        return prev + 1
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-lg space-y-12">
        {/* Origin -> Destination graphic */}
        <div className="flex items-center justify-between gap-4">
          {/* Origin box */}
          <div className="w-24 h-24 bg-white rounded-2xl border-2 shadow-lg flex items-center justify-center font-bold text-lg"
            style={{ borderColor: PROVIDER_COLORS[origin] + '60', color: PROVIDER_COLORS[origin] }}>
            {PROVIDER_LABELS[origin] || '?'}
          </div>

          {/* Animated line */}
          <div className="flex-1 relative h-8">
            <svg className="w-full h-8 absolute top-0 left-0" preserveAspectRatio="none">
              <line x1="0" y1="16" x2="100%" y2="16"
                stroke="#94a3b8" strokeWidth="2"
                strokeDasharray="8 8"
                className="animate-dash-move" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-50 px-2">
                <svg className="w-6 h-6 text-gov-primary animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>

          {/* Destination box */}
          <div className="w-24 h-24 bg-white rounded-2xl border-2 shadow-lg flex items-center justify-center font-bold text-lg"
            style={{ borderColor: PROVIDER_COLORS[destination] + '60', color: PROVIDER_COLORS[destination] }}>
            {PROVIDER_LABELS[destination] || '?'}
          </div>
        </div>

        {/* Status message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 animate-fade-in" key={msgIndex}>
            {MESSAGES[msgIndex]}
          </h2>
          <div className="flex justify-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-gov-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1.5 h-1.5 bg-gov-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-1.5 h-1.5 bg-gov-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto">
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gov-primary to-gov-accent rounded-full transition-all duration-1000"
              style={{ width: `${((msgIndex + 1) / MESSAGES.length) * 100}%` }} />
          </div>
        </div>

        <p className="text-slate-400 font-mono text-sm max-w-sm mx-auto">
          Esta operacion cumple con los estandares gubernamentales de encriptacion AES-256 durante el transito.
        </p>
      </div>
    </div>
  )
}
