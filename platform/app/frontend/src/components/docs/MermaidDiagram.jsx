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
  const [svg, setSvg]               = useState('')
  const [error, setError]           = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom]             = useState(1)
  const [naturalSize, setNaturalSize] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef  = useRef(null)
  const dragRef       = useRef({ x: 0, y: 0, sl: 0, st: 0 })
  const id            = useRef(`mermaid-${++mermaidId}`)

  useEffect(() => {
    if (!code) return
    setError(null)
    mermaid.render(id.current, code)
      .then(({ svg }) => setSvg(svg))
      .catch(err => { setError('Error al renderizar diagrama'); console.error(err) })
  }, [code])

  // Medir el tamaño natural del SVG cuando se abre el modal
  useEffect(() => {
    if (!fullscreen || !svg) return
    const timer = setTimeout(() => {
      const tmp = document.createElement('div')
      tmp.style.cssText = 'position:absolute;visibility:hidden;top:-9999px;left:-9999px'
      tmp.innerHTML = svg
      document.body.appendChild(tmp)
      const svgEl = tmp.querySelector('svg')
      if (svgEl) {
        const w = svgEl.getBoundingClientRect().width
        const h = svgEl.getBoundingClientRect().height
        if (w > 0) setNaturalSize({ width: w, height: h })
      }
      document.body.removeChild(tmp)
    }, 60)
    return () => clearTimeout(timer)
  }, [fullscreen, svg])

  // ESC para cerrar
  useEffect(() => {
    if (!fullscreen) return
    const h = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fullscreen])

  const handleOpen  = () => { setZoom(1); setNaturalSize(null); setFullscreen(true) }
  const handleClose = () => { setFullscreen(false); setZoom(1); setNaturalSize(null) }
  const zoomIn      = () => setZoom(z => Math.min(4,    +(z + 0.25).toFixed(2)))
  const zoomOut     = () => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))
  const zoomReset   = () => setZoom(1)

  // Arrastrar para desplazar
  const onMouseDown = (e) => {
    if (e.button !== 0 || !containerRef.current) return
    setIsDragging(true)
    dragRef.current = { x: e.clientX, y: e.clientY, sl: containerRef.current.scrollLeft, st: containerRef.current.scrollTop }
    e.preventDefault()
  }
  const onMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return
    containerRef.current.scrollLeft = dragRef.current.sl - (e.clientX - dragRef.current.x)
    containerRef.current.scrollTop  = dragRef.current.st - (e.clientY - dragRef.current.y)
  }
  const onMouseUp = () => setIsDragging(false)

  if (error) return (
    <div className="my-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
      {error}<pre className="mt-2 text-xs text-gray-500 overflow-auto">{code}</pre>
    </div>
  )

  if (!svg) return (
    <div className="my-4 flex items-center justify-center h-24 bg-gray-50 rounded border border-gray-200">
      <div className="text-gray-400 text-sm animate-pulse">Renderizando diagrama...</div>
    </div>
  )

  // BASE_SCALE: tamaño visual base del diagrama en el modal (independiente del % que ve el usuario)
  // zoom=1 se muestra como "100%" pero visualmente el diagrama ya es 3x su tamaño natural
  const BASE_SCALE = 3
  const W = naturalSize?.width  || 900
  const H = naturalSize?.height || 500

  return (
    <>
      {/* Vista normal */}
      <div className="relative my-6 group">
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg p-4"
          dangerouslySetInnerHTML={{ __html: svg }} />
        <button onClick={handleOpen}
          className="absolute top-3 right-3 p-2 bg-white border border-gray-300 rounded-lg shadow-sm
                     opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50
                     flex items-center gap-1.5 text-xs text-gray-600 font-medium"
          title="Ver en pantalla completa">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Expandir
        </button>
      </div>

      {/* Modal pantalla completa */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2"
          onClick={handleClose}>
          <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '98vw', height: '96vh' }}
            onClick={e => e.stopPropagation()}>

            {/* Header con controles */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Diagrama</span>
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                  {/* icono mano */}
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z" clipRule="evenodd" />
                  </svg>
                  Arrastra para desplazarte
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={zoomOut}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xl leading-none select-none"
                  title="Reducir">−</button>
                <button onClick={zoomReset}
                  className="px-3 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs text-gray-600 font-mono min-w-[56px] select-none"
                  title="Restablecer zoom">{Math.round(zoom * 100)}%</button>
                <button onClick={zoomIn}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xl leading-none select-none"
                  title="Ampliar">+</button>
                <div className="w-px h-5 bg-gray-200 mx-2" />
                <span className="text-xs text-gray-400 hidden sm:block">ESC para cerrar</span>
                <button onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Area de scroll con arrastre — el scroll funciona porque el wrapper tiene las dimensiones reales */}
            <div
              ref={containerRef}
              className="flex-1 overflow-auto bg-gray-50 select-none"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {/* padding exterior para dar espacio alrededor del diagrama */}
              <div style={{ padding: '2rem', display: 'inline-block', minWidth: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
                {/*
                  Truco clave: grid con dos celdas superpuestas (1/1).
                  - La celda exterior define el tamaño REAL del layout = W*zoom × H*zoom
                    → esto hace que el scroll sea correcto al hacer zoom
                  - La celda interior usa transform:scale para el zoom visual
                    → el diagrama se ve grande sin que el navegador haga scroll de la pagina
                */}
                <div style={{ display: 'grid', width: `${W * BASE_SCALE * zoom}px`, height: `${H * BASE_SCALE * zoom}px` }}>
                  {/* celda de layout — define el area de scroll real */}
                  <div style={{ gridArea: '1/1', width: `${W * BASE_SCALE * zoom}px`, height: `${H * BASE_SCALE * zoom}px` }} />
                  {/* celda visual — aplica base + zoom al diagrama */}
                  <div
                    style={{
                      gridArea: '1/1',
                      transform: `scale(${BASE_SCALE * zoom})`,
                      transformOrigin: 'top left',
                      width: `${W}px`,
                      height: `${H}px`,
                      transition: 'transform 0.12s ease',
                    }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
