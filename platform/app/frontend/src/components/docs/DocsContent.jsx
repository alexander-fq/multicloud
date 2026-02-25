import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import MermaidDiagram from './MermaidDiagram'
import { useEffect, useState, useRef } from 'react'

// Extrae texto plano de children de React (puede ser string, array o elemento)
function getChildText(children) {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getChildText).join('')
  if (children?.props?.children) return getChildText(children.props.children)
  return ''
}

// Genera id a partir de children (mismo algoritmo que extractHeadings)
function headingId(children) {
  const text = getChildText(children).replace(/\*\*/g, '').trim()
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
}

// Componentes de heading con id — node se descarta para no pasar prop invalido al DOM
function makeHeading(Tag) {
  return function Heading({ children, node, ...props }) {
    const id = headingId(children)
    return <Tag id={id} {...props}>{children}</Tag>
  }
}

// Componente personalizado para bloques de codigo
function CodeBlock({ node, inline, className, children, ...props }) {
  const match  = /language-(\w+)/.exec(className || '')
  const lang   = match ? match[1] : ''
  const code   = String(children).replace(/\n$/, '')

  if (!inline && lang === 'mermaid') {
    return <MermaidDiagram code={code} />
  }

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-[13px] font-mono" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="relative group my-4">
      {lang && (
        <div className="absolute top-0 right-0 px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800 rounded-bl rounded-tr-md">
          {lang}
        </div>
      )}
      <pre className={`${className} rounded-lg text-sm overflow-x-auto`} {...props}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

// Extrae headings del markdown para la tabla de contenidos
function extractHeadings(content) {
  const lines = content.split('\n')
  const headings = []
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+)/)
    if (m) {
      const level = m[1].length
      const text  = m[2].replace(/\*\*/g, '').trim()
      const id    = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
      headings.push({ level, text, id })
    }
  }
  return headings
}

export default function DocsContent({ doc }) {
  const [headings, setHeadings] = useState([])
  const [activeHeading, setActiveHeading] = useState('')
  const contentRef = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    if (doc) {
      setHeadings(extractHeadings(doc.content))
      setActiveHeading('')
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
    }
  }, [doc])

  // Marca el heading visible en el sidebar derecho al hacer scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveHeading(entry.target.id)
        }
      },
      { root: container, rootMargin: '-80px 0px -70% 0px' }
    )
    const els = contentRef.current?.querySelectorAll('h1, h2, h3') || []
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [doc])

  // Scroll al heading dentro del contenedor correcto
  function scrollToHeading(id) {
    const el = document.getElementById(id)
    const container = scrollContainerRef.current
    if (!el || !container) return
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    container.scrollTo({
      top: container.scrollTop + (elRect.top - containerRect.top) - 80,
      behavior: 'smooth',
    })
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-500">Selecciona un documento</p>
          <p className="text-sm text-gray-400 mt-1">Usa la barra lateral para navegar por la documentacion</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Main content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-3xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
            <span>Docs</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-400">{doc.section}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-800 font-medium">{doc.title}</span>
          </nav>

          {/* Markdown */}
          <div className="docs-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: CodeBlock,
                h1: makeHeading('h1'),
                h2: makeHeading('h2'),
                h3: makeHeading('h3'),
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400">
            GovTech Cloud Migration Platform &middot; Documentacion Tecnica
          </div>
        </div>
      </div>

      {/* Table of Contents (right side) */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-56 flex-shrink-0 overflow-y-auto py-8 px-4">
          <div className="sticky top-8">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              En esta pagina
            </p>
            <ul className="space-y-1">
              {headings.map((h, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollToHeading(h.id)}
                    className={`block w-full text-left text-xs py-1 transition-colors hover:text-blue-600 ${
                      h.level === 1 ? 'font-medium' :
                      h.level === 2 ? 'pl-3 text-gray-600' :
                      'pl-6 text-gray-500'
                    } ${activeHeading === h.id ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}
