import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
})

let mermaidId = 0

export default function MermaidDiagram({ code }) {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const id = useRef(`mermaid-${++mermaidId}`)

  useEffect(() => {
    if (!code) return
    setError(null)
    mermaid.render(id.current, code)
      .then(({ svg }) => setSvg(svg))
      .catch(err => {
        setError('Error al renderizar diagrama')
        console.error(err)
      })
  }, [code])

  // Cerrar con ESC
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen])

  if (error) {
    return (
      <div className="my-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
        {error}
        <pre className="mt-2 text-xs text-gray-500 overflow-auto">{code}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center h-24 bg-gray-50 rounded border border-gray-200">
        <div className="text-gray-400 text-sm animate-pulse">Renderizando diagrama...</div>
      </div>
    )
  }

  return (
    <>
      {/* Diagrama normal con boton de expandir */}
      <div className="relative my-6 group">
        <div
          className="overflow-x-auto bg-white border border-gray-200 rounded-lg p-4"
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        {/* Boton pantalla completa */}
        <button
          onClick={() => setFullscreen(true)}
          className="absolute top-3 right-3 p-2 bg-white border border-gray-300 rounded-lg shadow-sm
                     opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50
                     flex items-center gap-1.5 text-xs text-gray-600 font-medium"
          title="Ver diagrama en pantalla completa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Expandir
        </button>
      </div>

      {/* Modal pantalla completa */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
              <span className="text-sm font-semibold text-gray-700">Diagrama</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Presiona ESC o haz clic fuera para cerrar</span>
                <button
                  onClick={() => setFullscreen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del diagrama con scroll y zoom nativo del navegador */}
            <div className="overflow-auto p-8 flex-1">
              <div
                className="min-w-max mx-auto"
                style={{ transform: 'scale(1.4)', transformOrigin: 'top center', paddingBottom: '40%' }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
