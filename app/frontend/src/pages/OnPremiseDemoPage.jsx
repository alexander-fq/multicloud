import { useState, useEffect } from 'react'
import {
  getDemoOnPremiseInfrastructure,
  getDemoMigrationWaves,
  getDemoDependencyGraph,
  simulateMigration
} from '../services/api'

function OnPremiseDemoPage() {
  const [infrastructure, setInfrastructure] = useState(null)
  const [waves, setWaves] = useState(null)
  const [dependencyGraph, setDependencyGraph] = useState(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [migrationSimulation, setMigrationSimulation] = useState(null)

  useEffect(() => {
    loadDemoData()
  }, [])

  const loadDemoData = async () => {
    setLoading(true)
    try {
      const [infraRes, wavesRes, depRes] = await Promise.all([
        getDemoOnPremiseInfrastructure(),
        getDemoMigrationWaves(),
        getDemoDependencyGraph()
      ])

      setInfrastructure(infraRes.data.data)
      setWaves(wavesRes.data.data)
      setDependencyGraph(depRes.data.data)
    } catch (error) {
      console.error('Error loading demo data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateMigration = async (wave) => {
    try {
      const res = await simulateMigration(wave.number, wave.servers.map(s => s.id))
      setMigrationSimulation(res.data.data)
    } catch (error) {
      console.error('Error simulating migration:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Mode Badge */}
      <div className="card bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">On-Premise to Cloud Migration</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white animate-pulse">
                DEMO MODE
              </span>
            </div>
            <p className="text-gray-700">
              Interactive demonstration with simulated government data center infrastructure
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Discovery Agent</p>
            <p className="text-lg font-bold text-green-600">Connected</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'infrastructure', label: 'Infrastructure', icon: '🖥️' },
            { id: 'waves', label: 'Migration Waves', icon: '🌊' },
            { id: 'dependencies', label: 'Dependencies', icon: '🔗' },
            { id: 'simulation', label: 'Simulation', icon: '🎮' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && infrastructure && (
        <div className="space-y-6">
          {/* Data Center Info */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold mb-4">{infrastructure.datacenter.name}</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-lg font-bold text-gray-900">{infrastructure.datacenter.location}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Rack Space</p>
                <p className="text-lg font-bold text-gray-900">
                  {infrastructure.datacenter.usedRackSpace}/{infrastructure.datacenter.totalRackSpace}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Power Usage</p>
                <p className="text-lg font-bold text-gray-900">{infrastructure.datacenter.powerUsage}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Redundancy</p>
                <p className="text-lg font-bold text-green-600">{infrastructure.datacenter.redundancy}</p>
              </div>
            </div>
          </div>

          {/* Resource Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card bg-purple-50 border-2 border-purple-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-purple-900">VMware Infrastructure</h3>
                <span className="text-4xl">☁️</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">vCenter Version:</span>
                  <span className="font-bold">{infrastructure.vmware.vcenterVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">ESXi Hosts:</span>
                  <span className="font-bold text-purple-600">{infrastructure.vmware.totalHosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Virtual Machines:</span>
                  <span className="font-bold text-purple-600">{infrastructure.vmware.totalVMs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Datastores:</span>
                  <span className="font-bold text-purple-600">{infrastructure.vmware.datastores.length}</span>
                </div>
              </div>
            </div>

            <div className="card bg-blue-50 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900">Hyper-V Infrastructure</h3>
                <span className="text-4xl">💻</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">SCVMM Version:</span>
                  <span className="font-bold">{infrastructure.hyperv.scvmmVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Hyper-V Hosts:</span>
                  <span className="font-bold text-blue-600">{infrastructure.hyperv.totalHosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Virtual Machines:</span>
                  <span className="font-bold text-blue-600">{infrastructure.hyperv.totalVMs}</span>
                </div>
              </div>
            </div>

            <div className="card bg-green-50 border-2 border-green-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-green-900">Physical Servers</h3>
                <span className="text-4xl">🖥️</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Servers:</span>
                  <span className="font-bold text-green-600">{infrastructure.physical.totalServers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Manufacturers:</span>
                  <span className="font-bold">Dell, HP, IBM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Conversion:</span>
                  <span className="font-bold">P2V Required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Readiness */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Migration Readiness Assessment</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall Readiness</span>
                  <span className="text-2xl font-bold text-orange-600">{infrastructure.migrationReadiness}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: infrastructure.migrationReadiness }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Estimated Time: {infrastructure.estimatedMigrationTime}
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Total Resources</p>
                <p className="text-4xl font-bold text-blue-600">{infrastructure.totalResources}</p>
                <p className="text-sm text-gray-600">Servers to Migrate</p>
              </div>
            </div>

            {/* Issues */}
            {infrastructure.readinessDetails.issues.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h3 className="font-bold text-yellow-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Issues Found
                </h3>
                <ul className="space-y-1">
                  {infrastructure.readinessDetails.issues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-800">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {infrastructure.readinessDetails.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-300">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Recommendations
                </h3>
                <ul className="space-y-1">
                  {infrastructure.readinessDetails.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-800">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Infrastructure Tab - Detailed Server Lists */}
      {selectedTab === 'infrastructure' && infrastructure && (
        <div className="space-y-6">
          {/* VMware VMs */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">VMware Virtual Machines ({infrastructure.vmware.totalVMs})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resources</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criticality</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Environment</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {infrastructure.vmware.vms.slice(0, 10).map((vm) => (
                    <tr key={vm.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{vm.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{vm.guestOS}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {vm.cpus} vCPU | {(vm.memoryMB / 1024).toFixed(0)} GB RAM | {vm.diskGB} GB
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          vm.powerState === 'poweredOn'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vm.powerState === 'poweredOn' ? 'Running' : 'Stopped'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          vm.criticality === 'critical' ? 'bg-red-100 text-red-800' :
                          vm.criticality === 'high' ? 'bg-orange-100 text-orange-800' :
                          vm.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {vm.criticality}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{vm.environment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {infrastructure.vmware.totalVMs > 10 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Showing 10 of {infrastructure.vmware.totalVMs} VMs
                </p>
              )}
            </div>
          </div>

          {/* Physical Servers */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Physical Servers ({infrastructure.physical.totalServers})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {infrastructure.physical.servers.map((server) => (
                <div key={server.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{server.hostname}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      server.criticality === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {server.criticality}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{server.purpose}</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>• {server.manufacturer} {server.model}</p>
                    <p>• {server.cpuCores} Cores, {server.memoryGB} GB RAM</p>
                    <p>• {server.diskTB} TB Storage</p>
                    <p>• {server.os}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-xs font-medium text-green-800">
                      Strategy: {server.conversionStrategy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Migration Waves Tab */}
      {selectedTab === 'waves' && waves && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold mb-2">Migration Wave Strategy</h2>
            <p className="text-gray-700 mb-4">
              Servers are grouped into waves based on criticality and dependencies.
              Total estimated time: <strong>{waves.estimatedTotalTime}</strong>
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              {waves.waves.map((wave) => (
                <div key={wave.number} className="p-4 bg-white rounded-lg border-2 border-blue-300">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg ${
                      wave.criticality === 'critical' ? 'bg-red-500' :
                      wave.criticality === 'high' ? 'bg-orange-500' :
                      wave.criticality === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      W{wave.number}
                    </div>
                    <p className="font-bold text-gray-900">Wave {wave.number}</p>
                    <p className="text-xs text-gray-600">{wave.name}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{wave.serverCount}</p>
                    <p className="text-xs text-gray-600">servers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Wave Information */}
          {waves.waves.map((wave) => (
            <div key={wave.number} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Wave {wave.number}: {wave.name}</h3>
                  <p className="text-sm text-gray-600">
                    {wave.startDate} to {wave.endDate} ({wave.estimatedTime})
                  </p>
                </div>
                <button
                  onClick={() => handleSimulateMigration(wave)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simulate Migration
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Server Count</p>
                  <p className="text-2xl font-bold">{wave.serverCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-2xl font-bold">{wave.applications.length}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Criticality</p>
                  <span className={`px-3 py-1 text-sm rounded-full font-semibold ${
                    wave.criticality === 'critical' ? 'bg-red-100 text-red-800' :
                    wave.criticality === 'high' ? 'bg-orange-100 text-orange-800' :
                    wave.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {wave.criticality}
                  </span>
                </div>
              </div>

              {/* Applications in Wave */}
              <div className="mb-4">
                <h4 className="font-bold mb-2">Applications:</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {wave.applications.map((app, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="font-medium text-gray-900">{app.name}</p>
                      <p className="text-sm text-gray-600">{app.type} • {app.users.toLocaleString()} users</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks */}
              <div className="mb-4">
                <h4 className="font-bold mb-2">Risks:</h4>
                <ul className="space-y-1">
                  {wave.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-yellow-800">• {risk}</li>
                  ))}
                </ul>
              </div>

              {/* Success Criteria */}
              <div>
                <h4 className="font-bold mb-2">Success Criteria:</h4>
                <ul className="space-y-1">
                  {wave.successCriteria.map((criteria, i) => (
                    <li key={i} className="text-sm text-green-800">• {criteria}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dependencies Tab - Visual Graph */}
      {selectedTab === 'dependencies' && dependencyGraph && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Application Dependency Map</h2>
            <p className="text-gray-600 mb-6">
              Visual representation of service dependencies. Arrows show communication flow between tiers.
            </p>

            {/* Simple visual dependency representation */}
            <div className="grid md:grid-cols-3 gap-8 p-8 bg-gray-50 rounded-lg">
              {dependencyGraph.nodes.map((node, i) => (
                <div key={node.id} className="text-center">
                  <div className={`p-6 rounded-lg shadow-lg ${
                    node.type === 'web' ? 'bg-blue-500' :
                    node.type === 'application' ? 'bg-purple-500' :
                    node.type === 'database' ? 'bg-green-500' :
                    node.type === 'cache' ? 'bg-red-500' :
                    node.type === 'queue' ? 'bg-yellow-500' :
                    node.type === 'storage' ? 'bg-indigo-500' :
                    node.type === 'auth' ? 'bg-pink-500' :
                    'bg-gray-500'
                  } text-white`}>
                    <p className="text-3xl mb-2">{
                      node.type === 'web' ? '🌐' :
                      node.type === 'application' ? '⚙️' :
                      node.type === 'database' ? '🗄️' :
                      node.type === 'cache' ? '⚡' :
                      node.type === 'queue' ? '📮' :
                      node.type === 'storage' ? '💾' :
                      node.type === 'auth' ? '🔐' :
                      '📊'
                    }</p>
                    <p className="font-bold">{node.name}</p>
                    <p className="text-sm mt-2 opacity-90">{node.count} servers</p>
                  </div>
                  {i < dependencyGraph.nodes.length - 1 && (
                    <div className="text-2xl text-gray-400 mt-4">↓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Dependency Table */}
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-3">Connection Details</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Protocol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Port</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dependencyGraph.edges.map((edge, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-gray-900">{edge.source}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{edge.target}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 uppercase">{edge.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{edge.port}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Tab */}
      {selectedTab === 'simulation' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Migration Simulation</h2>

            {!migrationSimulation ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">🎮</p>
                <p className="text-gray-600 mb-4">
                  Select a wave from the "Migration Waves" tab and click "Simulate Migration" to see the process in action.
                </p>
                <button
                  onClick={() => setSelectedTab('waves')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Migration Waves
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Simulation Header */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Migration ID</p>
                      <p className="font-mono text-lg font-bold">{migrationSimulation.migrationId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">Status</p>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        {migrationSimulation.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-6 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">Overall Progress</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {migrationSimulation.progress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 mb-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-500 flex items-center justify-center"
                      style={{ width: `${migrationSimulation.progress.percentage}%` }}
                    >
                      <span className="text-xs text-white font-bold">
                        {migrationSimulation.progress.current}/{migrationSimulation.progress.total} servers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phases */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">Migration Phases</h3>
                  {migrationSimulation.phases.map((phase, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{phase.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          phase.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {phase.status}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            phase.status === 'in-progress' ? 'bg-yellow-500 animate-pulse' :
                            phase.status === 'completed' ? 'bg-green-500' :
                            'bg-gray-300'
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Logs */}
                <div className="p-4 bg-gray-900 rounded-lg text-green-400 font-mono text-sm max-h-64 overflow-y-auto">
                  {migrationSimulation.logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`ml-2 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OnPremiseDemoPage
