import { useState, useEffect } from 'react'
import { getArchitectureInfo } from '../services/api'

function ArchitecturePage() {
  const [architectureInfo, setArchitectureInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getArchitectureInfo()
        setArchitectureInfo(response.data)
      } catch (error) {
        console.error('Error fetching architecture info:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Multi-Cloud Architecture</h1>
        <p className="text-gray-600">
          Interface-based abstraction layer enabling seamless cloud provider switching
        </p>
      </div>

      {/* Architecture Layers */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Architecture Layers</h2>
        <div className="space-y-4">
          {architectureInfo?.layers && Object.entries(architectureInfo.layers).map(([key, value]) => (
            <div key={key} className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold mr-4 flex-shrink-0">
                {key}
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Design Patterns */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Design Patterns</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {architectureInfo?.designPatterns && architectureInfo.designPatterns.map((pattern, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900">{pattern}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <h2 className="text-2xl font-bold mb-4 text-green-900">Key Benefits</h2>
        <ul className="space-y-3">
          {architectureInfo?.benefits && architectureInfo.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-green-900">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Code Example */}
      <div className="card bg-gray-900 text-gray-100">
        <h2 className="text-2xl font-bold mb-4">Code Example</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-400">Usage Example</h3>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{architectureInfo?.codeExample?.usage}</code>
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-400">Migration Example</h3>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{architectureInfo?.codeExample?.migration}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Architecture Diagram</h2>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-lg border border-gray-200">

          {/* Application Layer */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Application Layer</h3>
                <p className="text-sm text-blue-100">Routes, Controllers, Business Logic</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-1 h-12 bg-gradient-to-b from-indigo-700 to-purple-600"></div>
            </div>
          </div>

          {/* Service Factories */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Service Factories</h3>
                <p className="text-sm text-purple-100">getStorageService, getDatabaseService, getMonitoringService</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-1 h-12 bg-gradient-to-b from-pink-600 to-orange-500"></div>
            </div>
          </div>

          {/* Interfaces */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-6 rounded-lg shadow-lg">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Interfaces</h3>
                <p className="text-sm text-orange-100">StorageService, DatabaseService, MonitoringService, AuthService</p>
              </div>
            </div>
            <div className="flex justify-center items-center h-16">
              <div className="relative w-full">
                <div className="absolute left-1/2 top-0 w-1 h-8 bg-gradient-to-b from-yellow-500 to-gray-400 transform -translate-x-1/2"></div>
                <div className="absolute left-1/2 top-8 w-3/4 h-1 bg-gradient-to-r from-gray-400 via-gray-400 to-gray-400 transform -translate-x-1/2"></div>
                <div className="absolute left-1/4 top-8 w-1 h-8 bg-gray-400"></div>
                <div className="absolute left-1/2 top-8 w-1 h-8 bg-gray-400"></div>
                <div className="absolute left-3/4 top-8 w-1 h-8 bg-gray-400"></div>
              </div>
            </div>
          </div>

          {/* Cloud Providers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold">AWS</span>
                </div>
                <h3 className="text-lg font-bold mb-1">AWS Provider</h3>
                <p className="text-xs text-yellow-100">Amazon Web Services</p>
                <div className="mt-3 px-3 py-1 bg-green-500 rounded-full text-xs font-semibold inline-block">
                  Implemented
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold">OCI</span>
                </div>
                <h3 className="text-lg font-bold mb-1">OCI Provider</h3>
                <p className="text-xs text-red-100">Oracle Cloud Infrastructure</p>
                <div className="mt-3 px-3 py-1 bg-yellow-500 rounded-full text-xs font-semibold inline-block">
                  Pending
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold">GCP</span>
                </div>
                <h3 className="text-lg font-bold mb-1">GCP Provider</h3>
                <p className="text-xs text-blue-100">Google Cloud Platform</p>
                <div className="mt-3 px-3 py-1 bg-yellow-500 rounded-full text-xs font-semibold inline-block">
                  Pending
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ArchitecturePage
