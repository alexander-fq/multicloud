import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
})

let mermaidId = 0

export default function MermaidDiagram({ code }) {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
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
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto bg-white border border-gray-200 rounded-lg p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
