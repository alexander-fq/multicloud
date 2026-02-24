import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ArchitecturePage from './pages/ArchitecturePage'
import HealthPage from './pages/HealthPage'
import DocsPage from './pages/DocsPage'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:docId" element={<DocsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
