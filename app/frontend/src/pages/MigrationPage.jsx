import { useState, useEffect } from 'react'
import { scanInfrastructure, createMigrationPlan, getProviders } from '../services/api'

function MigrationPage() {
  const [providers, setProviders] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [migrationPlan, setMigrationPlan] = useState(null)
  const [selectedFrom, setSelectedFrom] = useState('')
  const [selectedTo, setSelectedTo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await getProviders()
        setProviders(response.data)
        setSelectedFrom(response.data.current)
      } catch (error) {
        console.error('Error fetching providers:', error)
      }
    }
    fetchProviders()
  }, [])

  const handleScan = async () => {
    setLoading(true)
    try {
      const response = await scanInfrastructure()
      setScanResult(response.data)
    } catch (error) {
      console.error('Error scanning infrastructure:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlan = async () => {
    if (!selectedFrom || !selectedTo) {
      alert('Please select source and target providers')
      return
    }
    setLoading(true)
    try {
      const response = await createMigrationPlan(selectedFrom, selectedTo)
      setMigrationPlan(response.data)
    } catch (error) {
      console.error('Error creating migration plan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Cloud Migration Tools</h1>
        <p className="text-gray-600">
          Automated tools to scan, plan, and execute cloud migrations
        </p>
      </div>

      {/* Step 1: Scan Infrastructure */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Step 1: Scan Infrastructure</h2>
            <p className="text-gray-600">Analyze your current cloud setup</p>
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>

        {scanResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <p className="text-sm text-gray-600">Current Provider</p>
              <p className="text-xl font-bold uppercase">{scanResult.currentProvider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Region</p>
              <p className="font-semibold">{scanResult.region}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Services Detected</p>
              <div className="grid grid-cols-2 gap-2">
                {scanResult.services && Object.entries(scanResult.services).map(([key, value]) => (
                  <div key={key} className="p-2 bg-white rounded border border-gray-200">
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                    <p className="text-sm font-medium">{value.provider}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm font-semibold text-green-900">
                Migration Readiness: {scanResult.migrationReadiness}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Estimated Time: {scanResult.estimatedMigrationTime}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Create Migration Plan */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Step 2: Create Migration Plan</h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Provider
            </label>
            <select
              value={selectedFrom}
              onChange={(e) => setSelectedFrom(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select provider</option>
              {providers?.providers?.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Provider
            </label>
            <select
              value={selectedTo}
              onChange={(e) => setSelectedTo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select provider</option>
              {providers?.providers?.filter(p => p.name !== selectedFrom).map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePlan}
          disabled={loading || !selectedFrom || !selectedTo}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Creating Plan...' : 'Create Migration Plan'}
        </button>

        {migrationPlan && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-blue-900">Migration Plan</h3>
                <span className="badge badge-info">{migrationPlan.totalEstimatedTime}</span>
              </div>
              <p className="text-sm text-blue-700">
                {migrationPlan.from.toUpperCase()} → {migrationPlan.to.toUpperCase()}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold">Migration Steps</h3>
              {migrationPlan.steps?.map((step) => (
                <div key={step.step} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{step.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="text-xs text-gray-500">Duration: {step.estimatedTime}</span>
                        <span className={`badge ${step.automated ? 'badge-success' : 'badge-warning'}`}>
                          {step.automated ? 'Automated' : 'Manual'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-yellow-900 mb-2">Rollback Strategy</h3>
              <p className="text-sm text-yellow-700">{migrationPlan.rollbackStrategy?.method}</p>
              <p className="text-xs text-yellow-600 mt-1">
                Time to rollback: {migrationPlan.rollbackStrategy?.timeToRollback}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Migration Timeline Visual */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">Migration Timeline</h2>
        <p className="text-gray-700 mb-6">Typical migration schedule: 2-3 weeks</p>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>

          {/* Timeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Week 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-white z-10">
                <span className="text-white font-bold text-lg">W1</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-200 w-full">
                <h3 className="font-bold text-blue-900 mb-2">Week 1</h3>
                <p className="text-xs text-gray-600 mb-2">Preparation</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Scan infrastructure</li>
                  <li>• Create backup</li>
                  <li>• Generate plan</li>
                </ul>
              </div>
            </div>

            {/* Week 2 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-white z-10">
                <span className="text-white font-bold text-lg">W2</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200 w-full">
                <h3 className="font-bold text-purple-900 mb-2">Week 2</h3>
                <p className="text-xs text-gray-600 mb-2">Provisioning</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Setup new cloud</li>
                  <li>• Configure services</li>
                  <li>• Deploy code</li>
                </ul>
              </div>
            </div>

            {/* Week 3 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-white z-10">
                <span className="text-white font-bold text-lg">W3</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-indigo-200 w-full">
                <h3 className="font-bold text-indigo-900 mb-2">Week 3</h3>
                <p className="text-xs text-gray-600 mb-2">Migration</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Migrate data</li>
                  <li>• Run tests</li>
                  <li>• Validate setup</li>
                </ul>
              </div>
            </div>

            {/* Week 4 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-white z-10">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-green-200 w-full">
                <h3 className="font-bold text-green-900 mb-2">Go Live</h3>
                <p className="text-xs text-gray-600 mb-2">Completion</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Switch traffic</li>
                  <li>• Monitor</li>
                  <li>• Decommission old</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Total Migration Time</p>
              <p className="text-sm text-gray-600">Start to production</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">2-3 Weeks</p>
              <p className="text-xs text-gray-500">vs 6+ months traditional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Providers */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Supported Cloud Providers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers?.providers?.map((provider) => (
            <div key={provider.name} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold uppercase">{provider.name}</h3>
                <span className={`badge ${
                  provider.status === 'implemented' ? 'badge-success' : 'badge-warning'
                }`}>
                  {provider.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{provider.displayName}</p>
              <div className="space-y-1">
                {Object.entries(provider.services).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-500 capitalize">{key}:</span>{' '}
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MigrationPage
