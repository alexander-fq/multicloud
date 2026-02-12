import { useState, useEffect } from 'react'
import { scanInfrastructure, createMigrationPlan, getProviders } from '../services/api'

function MigrationPage() {
  const [migrationType, setMigrationType] = useState('cloud-to-cloud') // 'cloud-to-cloud' or 'on-premise-to-cloud'
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
      setScanResult(response.data.data) // Extract data from { success: true, data: {...} }
    } catch (error) {
      console.error('Error scanning infrastructure:', error)
      alert('Error scanning infrastructure. Check console for details.')
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
      setMigrationPlan(response.data.data) // Extract data from { success: true, data: {...} }
    } catch (error) {
      console.error('Error creating migration plan:', error)
      alert('Error creating migration plan. Check console for details.')
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

      {/* Migration Type Selection */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Select Migration Type</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Cloud to Cloud */}
          <button
            onClick={() => setMigrationType('cloud-to-cloud')}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              migrationType === 'cloud-to-cloud'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Cloud-to-Cloud Migration</h3>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                IMPLEMENTED
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Migrate between cloud providers (AWS, OCI, GCP, Azure)
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• AWS to Oracle Cloud (OCI)</li>
              <li>• OCI to Google Cloud (GCP)</li>
              <li>• Multi-cloud infrastructure scanning</li>
              <li>• Automated migration planning</li>
            </ul>
          </button>

          {/* On-Premise to Cloud */}
          <button
            onClick={() => setMigrationType('on-premise-to-cloud')}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              migrationType === 'on-premise-to-cloud'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 bg-white hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">On-Premise-to-Cloud Migration</h3>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                PENDING
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Migrate from on-premise data centers to cloud providers
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• VMware/Hyper-V to Cloud</li>
              <li>• Physical servers to Cloud</li>
              <li>• Government data center migrations</li>
              <li>• Wave-based migration planning</li>
            </ul>
          </button>
        </div>
      </div>

      {/* Pending Implementation Message for On-Premise */}
      {migrationType === 'on-premise-to-cloud' && (
        <div className="card bg-orange-50 border-2 border-orange-300">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                On-Premise-to-Cloud Migration - Coming Soon
              </h3>
              <p className="text-sm text-orange-800 mb-3">
                This feature is currently under development. It will include:
              </p>
              <ul className="text-sm text-orange-800 space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Discovery Agents:</strong> Scan VMware vCenter, Hyper-V, and physical servers</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Dependency Mapping:</strong> Automatically detect application dependencies</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Wave Planning:</strong> Group servers by criticality (non-critical → critical)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Government Compliance:</strong> Data sovereignty, security certifications</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Lift-and-Shift:</strong> Move existing workloads with minimal changes</span>
                </li>
              </ul>
              <div className="p-3 bg-white rounded border border-orange-200">
                <p className="text-xs text-orange-900 font-medium">
                  Expected Timeline: Phase 4 (6-8 weeks development)
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  See the complete roadmap in docs/ROADMAP_ONPREMISE_TO_CLOUD.md for full implementation details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud-to-Cloud Migration Steps */}
      {migrationType === 'cloud-to-cloud' && (
        <>
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
          <div className="mt-6 space-y-4">
            {/* Provider and Region Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Current Provider</p>
                <p className="text-2xl font-bold uppercase text-blue-900">{scanResult.currentProvider}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Region</p>
                <p className="text-2xl font-bold text-purple-900">{scanResult.region}</p>
              </div>
            </div>

            {/* Resource Counts */}
            {scanResult.resourceCounts && (
              <div>
                <h3 className="font-bold text-lg mb-3">Resource Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-blue-600">{scanResult.resourceCounts.ec2 || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">EC2 Instances</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-green-600">{scanResult.resourceCounts.rds || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">RDS Databases</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-orange-600">{scanResult.resourceCounts.s3 || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">S3 Buckets</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-purple-600">{scanResult.resourceCounts.eks || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">EKS Clusters</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-yellow-600">{scanResult.resourceCounts.lambda || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Lambda Functions</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-indigo-600">{scanResult.resourceCounts.vpcs || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">VPCs</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-pink-600">{scanResult.resourceCounts.loadBalancers || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Load Balancers</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-3xl font-bold text-red-600">{scanResult.resourceCounts.cloudWatchAlarms || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">CloudWatch Alarms</p>
                  </div>
                </div>
              </div>
            )}

            {/* Services Detected */}
            <div>
              <h3 className="font-bold text-lg mb-3">Services Detected</h3>
              {scanResult.services && Object.keys(scanResult.services).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(scanResult.services).map(([key, value]) => (
                    <div key={key} className="p-3 bg-white rounded-lg border-2 border-gray-200">
                      <p className="text-xs text-gray-500 uppercase font-semibold">{key}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{value.provider}</p>
                      {value.count !== undefined && (
                        <p className="text-xs text-gray-600 mt-1">{value.count} resource(s)</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <p className="text-gray-500 text-center italic">
                    No services detected. This may indicate that AWS credentials are not configured or no resources exist in the account.
                  </p>
                </div>
              )}
            </div>

            {/* Migration Readiness */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">Migration Readiness</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{scanResult.migrationReadiness}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700">Estimated Time</p>
                  <p className="text-xl font-bold text-green-900 mt-1">{scanResult.estimatedMigrationTime}</p>
                </div>
              </div>
            </div>

            {/* Readiness Details - Issues */}
            {scanResult.readinessDetails?.issues && scanResult.readinessDetails.issues.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h3 className="font-bold text-yellow-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Issues Found
                </h3>
                <ul className="space-y-1">
                  {scanResult.readinessDetails.issues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-800">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Readiness Details - Recommendations */}
            {scanResult.readinessDetails?.recommendations && scanResult.readinessDetails.recommendations.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Recommendations
                </h3>
                <ul className="space-y-1">
                  {scanResult.readinessDetails.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-800">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Infrastructure as Code Analysis */}
            {(scanResult.terraform?.resourcesFound > 0 || scanResult.kubernetes?.resourcesFound > 0) && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3">Infrastructure as Code Detected</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {scanResult.terraform?.resourcesFound > 0 && (
                    <div className="p-3 bg-white rounded border border-purple-200">
                      <p className="font-semibold text-purple-900">Terraform</p>
                      <p className="text-sm text-gray-700">{scanResult.terraform.resourcesFound} resources in {scanResult.terraform.filesProcessed} files</p>
                    </div>
                  )}
                  {scanResult.kubernetes?.resourcesFound > 0 && (
                    <div className="p-3 bg-white rounded border border-purple-200">
                      <p className="font-semibold text-purple-900">Kubernetes</p>
                      <p className="text-sm text-gray-700">{scanResult.kubernetes.resourcesFound} resources in {scanResult.kubernetes.filesProcessed} files</p>
                      {scanResult.kubernetes.resourceRequirements && (
                        <p className="text-xs text-gray-600 mt-1">
                          {scanResult.kubernetes.resourceRequirements.totalPods} pods, {scanResult.kubernetes.resourceRequirements.totalCPU}, {scanResult.kubernetes.resourceRequirements.totalMemory}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
            {/* Plan Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-blue-900 text-xl">Migration Plan Generated</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {migrationPlan.from.toUpperCase()} → {migrationPlan.to.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-blue-600">Total Time</p>
                    <p className="text-xl font-bold text-blue-900">{migrationPlan.totalEstimatedTime}</p>
                  </div>
                  {migrationPlan.complexity && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      migrationPlan.complexity.level === 'Low' ? 'bg-green-100 text-green-800' :
                      migrationPlan.complexity.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {migrationPlan.complexity.level} Complexity
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Migration Steps */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Migration Steps</h3>
              {migrationPlan.steps?.map((step) => (
                <div key={step.step} className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0 shadow-md">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-lg text-gray-900">{step.name}</h4>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {step.estimatedTime}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            step.automated
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {step.automated ? '✓ Automated' : '⚠ Manual'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                      {/* Tasks List */}
                      {step.tasks && step.tasks.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Tasks:</p>
                          <ul className="space-y-1">
                            {step.tasks.map((task, i) => (
                              <li key={i} className="text-xs text-gray-700 flex items-start">
                                <span className="text-blue-500 mr-2">✓</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tools */}
                      {step.tools && step.tools.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {step.tools.map((tool, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Risks */}
            {migrationPlan.risks && migrationPlan.risks.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <h3 className="font-bold text-red-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Migration Risks & Mitigations
                </h3>
                <div className="space-y-3">
                  {migrationPlan.risks.map((risk, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-red-200">
                      <p className="font-semibold text-red-900 text-sm">⚠ {risk.risk}</p>
                      <p className="text-xs text-gray-700 mt-1">
                        <span className="font-medium">Mitigation:</span> {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {migrationPlan.recommendations && migrationPlan.recommendations.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Best Practice Recommendations
                </h3>
                <ul className="space-y-2">
                  {migrationPlan.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-green-800 flex items-start">
                      <span className="text-green-600 mr-2 font-bold">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cost Estimate */}
            {migrationPlan.estimatedCost && (
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3">Cost Estimate</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Migration Cost</p>
                    <p className="text-2xl font-bold text-purple-900">{migrationPlan.estimatedCost.migrationCost}</p>
                    {migrationPlan.estimatedCost.breakdown && (
                      <ul className="mt-2 text-xs text-purple-700 space-y-1">
                        {Object.entries(migrationPlan.estimatedCost.breakdown).map(([key, value]) => (
                          <li key={key} className="capitalize">{key}: {value}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Expected Savings</p>
                    {migrationPlan.estimatedCost.monthlySavings && (
                      <>
                        <p className="text-2xl font-bold text-purple-900">{migrationPlan.estimatedCost.monthlySavings}/month</p>
                        <p className="text-xs text-purple-700 mt-1">Annual: {migrationPlan.estimatedCost.annualSavings}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rollback Strategy */}
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <h3 className="font-bold text-yellow-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                Rollback Strategy
              </h3>
              <p className="text-sm text-yellow-800 font-medium">{migrationPlan.rollbackStrategy?.method}</p>
              <p className="text-xs text-yellow-700 mt-2">
                ⏱ Time to rollback: <span className="font-semibold">{migrationPlan.rollbackStrategy?.timeToRollback}</span>
              </p>
              {migrationPlan.rollbackStrategy?.steps && (
                <ul className="mt-2 space-y-1">
                  {migrationPlan.rollbackStrategy.steps.map((step, i) => (
                    <li key={i} className="text-xs text-yellow-800">• {step}</li>
                  ))}
                </ul>
              )}
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
        </>
      )}

      {/* Supported Providers */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Supported Cloud Providers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers?.providers?.map((provider) => (
            <div key={provider.name} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
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
