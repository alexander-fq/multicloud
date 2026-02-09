import { useState, useEffect } from 'react'
import { getHealth, getDatabaseHealth, getCloudHealth } from '../services/api'

function HealthPage() {
  const [health, setHealth] = useState(null)
  const [dbHealth, setDbHealth] = useState(null)
  const [cloudHealth, setCloudHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchHealthData = async () => {
    setLoading(true)
    try {
      const [healthRes, dbRes, cloudRes] = await Promise.all([
        getHealth(),
        getDatabaseHealth(),
        getCloudHealth()
      ])
      setHealth(healthRes.data)
      setDbHealth(dbRes.data)
      setCloudHealth(cloudRes.data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching health data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unhealthy': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return 'HEALTHY'
      case 'degraded': return 'DEGRADED'
      case 'unhealthy': return 'UNHEALTHY'
      default: return 'UNKNOWN'
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Health</h1>
            <p className="text-gray-600">Real-time health monitoring of all services</p>
          </div>
          <button
            onClick={fetchHealthData}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Overall Health */}
      <div className={`card border-2 ${getStatusColor(health?.status)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Overall Status</h2>
            <p className="text-4xl font-bold uppercase">
              {getStatusIcon(health?.status)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Response Time</p>
            <p className="text-2xl font-bold">{health?.responseTime}</p>
            <p className="text-sm text-gray-600 mt-2">Uptime</p>
            <p className="text-xl font-semibold">{Math.floor(health?.uptime / 60)} min</p>
          </div>
        </div>
      </div>

      {/* Database Health */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Database Health</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className={`p-4 rounded-lg border-2 ${getStatusColor(dbHealth?.status)}`}>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="text-2xl font-bold uppercase">
                {getStatusIcon(dbHealth?.status)}
              </p>
            </div>
          </div>
          <div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Provider</p>
              <p className="text-xl font-bold uppercase">{dbHealth?.provider}</p>
            </div>
          </div>
        </div>

        {dbHealth?.stats && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Total Connections</p>
              <p className="text-3xl font-bold text-blue-900">{dbHealth.stats.total}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Idle Connections</p>
              <p className="text-3xl font-bold text-green-900">{dbHealth.stats.idle}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 mb-1">Waiting</p>
              <p className="text-3xl font-bold text-yellow-900">{dbHealth.stats.waiting}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cloud Provider Health */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Cloud Provider Health</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className={`p-4 rounded-lg border-2 ${getStatusColor(cloudHealth?.status)}`}>
              <p className="text-sm text-gray-600 mb-1">Credentials Status</p>
              <p className="text-2xl font-bold uppercase">
                {getStatusIcon(cloudHealth?.status)}
              </p>
            </div>
          </div>
          <div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Provider</p>
              <p className="text-xl font-bold uppercase">{cloudHealth?.provider}</p>
            </div>
          </div>
        </div>

        {cloudHealth?.identity && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Identity Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Account</p>
                <p className="font-mono text-sm">{cloudHealth.identity.account}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ARN</p>
                <p className="font-mono text-xs text-gray-700">{cloudHealth.identity.arn}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Checks */}
      {health?.checks && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Service Checks</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(health.checks).map(([service, check]) => (
              <div key={service} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <span className={`badge ${
                    check.status === 'healthy' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {check.status}
                  </span>
                </div>
                {check.stats && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {Object.entries(check.stats).map(([key, value]) => (
                      <div key={key}>
                        <span className="capitalize">{key}:</span> <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="card bg-gray-900 text-white">
        <h2 className="text-2xl font-bold mb-4">System Information</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Provider</p>
            <p className="text-xl font-bold uppercase">{health?.provider}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Timestamp</p>
            <p className="text-sm font-mono">{health?.timestamp}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Uptime</p>
            <p className="text-xl font-bold">{Math.floor(health?.uptime / 60)} minutes</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HealthPage
