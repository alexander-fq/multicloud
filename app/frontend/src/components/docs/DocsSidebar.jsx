import { useState } from 'react'
import { DOCS_TREE, searchDocs } from '../../data/docsData'

const ICONS = {
  arch: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  infra: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    </svg>
  ),
  deploy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  security: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  dr: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
}

export default function DocsSidebar({ activeDocId, onSelectDoc, onSearch }) {
  const [openSections, setOpenSections] = useState(() => {
    const state = {}
    DOCS_TREE.forEach(s => { state[s.id] = s.defaultOpen ?? false })
    return state
  })
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSearch = (value) => {
    setQuery(value)
    if (value.trim().length >= 2) {
      setSearchResults(searchDocs(value))
    } else {
      setSearchResults([])
    }
    onSearch?.(value)
  }

  const handleSelectDoc = (docId) => {
    setQuery('')
    setSearchResults([])
    onSelectDoc(docId)
  }

  return (
    <aside className="docs-sidebar w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar en la documentacion..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border-b border-gray-200 overflow-y-auto max-h-64">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100">
            {searchResults.length} resultado{searchResults.length > 1 ? 's' : ''}
          </div>
          {searchResults.map(doc => (
            <button
              key={doc.id}
              onClick={() => handleSelectDoc(doc.id)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <div className="text-sm font-medium text-gray-800">{doc.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{doc.section}</div>
              {doc.snippet && (
                <div className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{doc.snippet}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {searchResults.length === 0 && query.length >= 2 && (
        <div className="px-4 py-6 text-center text-sm text-gray-400 border-b border-gray-200">
          Sin resultados para "{query}"
        </div>
      )}

      {/* Nav tree */}
      <nav className="flex-1 overflow-y-auto py-4">
        {DOCS_TREE.map(section => (
          <div key={section.id} className="mb-1">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-start justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 hover:bg-gray-100 rounded-md mx-1 transition-colors text-left"
            >
              <div className="flex items-start gap-2 leading-tight">
                <span className="text-gray-400 flex-shrink-0 mt-0.5">{ICONS[section.icon]}</span>
                {section.title}
              </div>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${openSections[section.id] ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Section items */}
            {openSections[section.id] && (
              <ul className="ml-4 mt-1 space-y-0.5">
                {section.children.map(doc => (
                  <li key={doc.id}>
                    <button
                      onClick={() => handleSelectDoc(doc.id)}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                        activeDocId === doc.id
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {doc.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400">GovTech Cloud Migration Platform</div>
        <div className="text-xs text-gray-400">Documentacion v2.0</div>
      </div>
    </aside>
  )
}
