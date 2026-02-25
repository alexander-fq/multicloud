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
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
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
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen])

  const handleOpen = () => {
    setZoom(1)
    setFullscreen(true)
  }

  const handleClose = () => {
    setFullscreen(false)
    setZoom(1)
  }

  const zoomIn  = () => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))
  const zoomReset = () => setZoom(1)

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
        <button
          onClick={handleOpen}
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
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '98vw', height: '96vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
              <span className="text-sm font-semibold text-gray-700">Diagrama</span>

              <div className="flex items-center gap-2">
                {/* Botones de zoom */}
                <button
                  onClick={zoomOut}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-lg leading-none"
                  title="Reducir zoom"
                >−</button>

                <button
                  onClick={zoomReset}
                  className="px-3 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs text-gray-600 font-mono min-w-[52px]"
                  title="Restablecer zoom"
                >{Math.round(zoom * 100)}%</button>

                <button
                  onClick={zoomIn}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-lg leading-none"
                  title="Aumentar zoom"
                >+</button>

                <div className="w-px h-5 bg-gray-200 mx-2" />

                <span className="text-xs text-gray-400 hidden sm:block">ESC para cerrar</span>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido con scroll - el zoom afecta solo el diagrama */}
            <div className="overflow-auto flex-1 bg-gray-50 p-8">
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  paddingBottom: zoom > 1 ? `${(zoom - 1) * 80}%` : '0',
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
