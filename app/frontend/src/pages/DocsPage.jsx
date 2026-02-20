import { useState } from 'react'
import DocsSidebar from '../components/docs/DocsSidebar'
import DocsContent from '../components/docs/DocsContent'
import { ALL_DOCS, DOCS_TREE } from '../data/docsData'

export default function DocsPage() {
  const [activeDocId, setActiveDocId] = useState('architecture-diagrams')

  const activeDoc = ALL_DOCS.find(d => d.id === activeDocId) || null

  return (
    <div
      className="docs-page flex -mx-4 -mt-8"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* Sidebar */}
      <DocsSidebar
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
      />

      {/* Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-6">
            {/* Quick nav buttons */}
            {DOCS_TREE.map(section => (
              <div key={section.id} className="relative group">
                <button className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors py-1">
                  {section.title}
                </button>
                {/* Dropdown on hover */}
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {section.children.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        activeDocId === doc.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Active doc info */}
          {activeDoc && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden lg:block">
                {activeDoc.section}
              </span>
            </div>
          )}
        </div>

        {/* Doc content */}
        <DocsContent doc={activeDoc} />
      </main>
    </div>
  )
}
