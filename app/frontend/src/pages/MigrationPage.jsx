import { useState, useEffect } from 'react'
import { scanInfrastructure, createMigrationPlan, getProviders } from '../services/api'
import { DonutChart, ProgressBar } from '../components/health/HealthCharts'

const PROVIDER_COLORS = {
  aws: '#FF9900', oci: '#F80000', gcp: '#4285F4', azure: '#0078D4',
}

function MigrationPage() {
  const [migrationType, setMigrationType] = useState('cloud-to-cloud')
  const [providers, setProviders] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [migrationPlan, setMigrationPlan] = useState(null)
  const [selectedFrom, setSelectedFrom] = useState('')
  const [selectedTo, setSelectedTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(null)

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
      setScanResult(response.data.data)
    } catch (error) {
      console.error('Error scanning infrastructure:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlan = async () => {
    if (!selectedFrom || !selectedTo) return
    setLoading(true)
    try {
      const response = await createMigrationPlan(selectedFrom, selectedTo)
      setMigrationPlan(response.data.data)
    } catch (error) {
      console.error('Error creating migration plan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Cloud Migration Tools</h1>
        <p className="text-slate-500">Escaneo automatizado, planificacion y ejecucion de migraciones multi-cloud</p>
      </div>

      {/* Migration Type Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={() => setMigrationType('cloud-to-cloud')}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            migrationType === 'cloud-to-cloud'
              ? 'border-gov-primary bg-blue-50 shadow-lg shadow-blue-500/10'
              : 'border-slate-200 bg-white hover:border-blue-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gov-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-gov-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900">Cloud-to-Cloud</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
              Disponible
            </span>
          </div>
          <p className="text-xs text-slate-500 ml-13">Migrar entre proveedores cloud (AWS, OCI, GCP, Azure)</p>
        </button>

        <button onClick={() => setMigrationType('on-premise-to-cloud')}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            migrationType === 'on-premise-to-cloud'
              ? 'border-gov-accent bg-purple-50 shadow-lg shadow-purple-500/10'
              : 'border-slate-200 bg-white hover:border-purple-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gov-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-gov-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900">On-Premise to Cloud</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
              Fase 4
            </span>
          </div>
          <p className="text-xs text-slate-500 ml-13">Migrar desde data centers locales a la nube</p>
        </button>
      </div>

      {/* On-Premise Pending */}
      {migrationType === 'on-premise-to-cloud' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Migracion On-Premise - En Desarrollo</h3>
              <p className="text-sm text-slate-500 mb-4">Esta funcionalidad estara disponible en la Fase 4. Incluira:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { title: 'Discovery Agents', desc: 'Escaneo de VMware vCenter, Hyper-V y servidores fisicos' },
                  { title: 'Dependency Mapping', desc: 'Deteccion automatica de dependencias entre aplicaciones' },
                  { title: 'Wave Planning', desc: 'Agrupacion por criticidad (no-critico a critico)' },
                  { title: 'Gov Compliance', desc: 'Soberania de datos, certificaciones de seguridad' },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-semibold text-sm text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">Timeline estimado: 6-8 semanas de desarrollo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud-to-Cloud Flow */}
      {migrationType === 'cloud-to-cloud' && (
        <>
          {/* Step 1: Scan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-gov-primary font-bold">1</div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Escanear Infraestructura</h2>
                  <p className="text-xs text-slate-500">Analizar tu configuracion cloud actual</p>
                </div>
              </div>
              <button onClick={handleScan} disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gov-primary text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-gov-primary/20 disabled:opacity-40">
                {loading ? 'Escaneando...' : 'Iniciar Escaneo'}
              </button>
            </div>

            {scanResult && (
              <div className="mt-6 space-y-4 animate-fade-in-up">
                {/* Provider & Region */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Proveedor Actual</p>
                    <p className="text-2xl font-bold uppercase mt-1" style={{ color: PROVIDER_COLORS[scanResult.currentProvider] || '#0f49bd' }}>
                      {scanResult.currentProvider}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Region</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{scanResult.region}</p>
                  </div>
                </div>

                {/* Resource Counts */}
                {scanResult.resourceCounts && (
                  <div>
                    <h3 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">Recursos Detectados</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'ec2', label: 'EC2 Instances', color: '#0f49bd' },
                        { key: 'rds', label: 'RDS Databases', color: '#059669' },
                        { key: 's3', label: 'S3 Buckets', color: '#d97706' },
                        { key: 'eks', label: 'EKS Clusters', color: '#7c3aed' },
                        { key: 'lambda', label: 'Lambda Functions', color: '#dc2626' },
                        { key: 'vpcs', label: 'VPCs', color: '#0f49bd' },
                        { key: 'loadBalancers', label: 'Load Balancers', color: '#059669' },
                        { key: 'cloudWatchAlarms', label: 'CW Alarms', color: '#d97706' },
                      ].map(r => (
                        <div key={r.key} className="p-3 bg-white rounded-xl border border-slate-200 text-center hover:border-slate-300 transition-colors">
                          <p className="text-3xl font-bold font-mono" style={{ color: r.color }}>
                            {scanResult.resourceCounts[r.key] || 0}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Readiness */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-gov-primary/5 to-gov-accent/5 border border-gov-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Migration Readiness</p>
                      <p className="text-3xl font-bold text-gov-primary mt-1">{scanResult.migrationReadiness}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase">Tiempo Estimado</p>
                      <p className="text-xl font-bold text-slate-800 mt-1">{scanResult.estimatedMigrationTime}</p>
                    </div>
                    <DonutChart value={parseInt(scanResult.migrationReadiness)} max={100} color="#0f49bd" size={64} />
                  </div>
                </div>

                {/* Issues & Recommendations */}
                {scanResult.readinessDetails?.issues?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <h3 className="font-bold text-sm text-amber-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                      Problemas Encontrados
                    </h3>
                    <ul className="space-y-1">
                      {scanResult.readinessDetails.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">&#9679;</span>{issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scanResult.readinessDetails?.recommendations?.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <h3 className="font-bold text-sm text-blue-900 mb-2">Recomendaciones</h3>
                    <ul className="space-y-1">
                      {scanResult.readinessDetails.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">&#8594;</span>{rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* IaC Detected */}
                {(scanResult.terraform?.resourcesFound > 0 || scanResult.kubernetes?.resourcesFound > 0) && (
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <h3 className="font-bold text-sm text-purple-900 mb-3">Infrastructure as Code Detectado</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {scanResult.terraform?.resourcesFound > 0 && (
                        <div className="p-3 bg-white rounded-lg border border-purple-200">
                          <p className="font-bold text-sm text-purple-900">Terraform</p>
                          <p className="text-xs text-slate-600">{scanResult.terraform.resourcesFound} recursos en {scanResult.terraform.filesProcessed} archivos</p>
                        </div>
                      )}
                      {scanResult.kubernetes?.resourcesFound > 0 && (
                        <div className="p-3 bg-white rounded-lg border border-purple-200">
                          <p className="font-bold text-sm text-purple-900">Kubernetes</p>
                          <p className="text-xs text-slate-600">{scanResult.kubernetes.resourcesFound} recursos en {scanResult.kubernetes.filesProcessed} archivos</p>
                          {scanResult.kubernetes.resourceRequirements && (
                            <p className="text-[10px] text-slate-500 mt-1">
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

          {/* Step 2: Migration Plan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-gov-accent font-bold">2</div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Crear Plan de Migracion</h2>
                <p className="text-xs text-slate-500">Selecciona origen y destino</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Proveedor Origen</label>
                <select value={selectedFrom} onChange={e => setSelectedFrom(e.target.value)}
                  className="w-full border-slate-200 rounded-lg focus:ring-gov-primary focus:border-gov-primary text-sm">
                  <option value="">Seleccionar proveedor</option>
                  {providers?.providers?.map(p => (
                    <option key={p.name} value={p.name}>{p.displayName} ({p.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Proveedor Destino</label>
                <select value={selectedTo} onChange={e => setSelectedTo(e.target.value)}
                  className="w-full border-slate-200 rounded-lg focus:ring-gov-primary focus:border-gov-primary text-sm">
                  <option value="">Seleccionar proveedor</option>
                  {providers?.providers?.filter(p => p.name !== selectedFrom).map(p => (
                    <option key={p.name} value={p.name}>{p.displayName} ({p.status})</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handlePlan} disabled={loading || !selectedFrom || !selectedTo}
              className="px-5 py-2.5 rounded-xl bg-gov-accent text-white font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-gov-accent/20 disabled:opacity-40">
              {loading ? 'Generando Plan...' : 'Generar Plan de Migracion'}
            </button>

            {migrationPlan && (
              <div className="mt-6 space-y-4 animate-fade-in-up">
                {/* Plan Header */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-gov-primary/5 to-gov-accent/5 border border-gov-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Plan de Migracion Generado</h3>
                      <p className="text-sm font-mono mt-1">
                        <span className="font-bold uppercase" style={{ color: PROVIDER_COLORS[migrationPlan.from] || '#0f49bd' }}>{migrationPlan.from}</span>
                        <span className="text-slate-400 mx-2">&#8594;</span>
                        <span className="font-bold uppercase" style={{ color: PROVIDER_COLORS[migrationPlan.to] || '#059669' }}>{migrationPlan.to}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Tiempo Total</p>
                        <p className="text-xl font-bold text-slate-900 font-mono">{migrationPlan.totalEstimatedTime}</p>
                      </div>
                      {migrationPlan.complexity && (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                          migrationPlan.complexity.level === 'Low' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : migrationPlan.complexity.level === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {migrationPlan.complexity.level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Migration Steps */}
                <div>
                  <h3 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">Pasos de Migracion</h3>
                  <div className="space-y-2">
                    {migrationPlan.steps?.map((step) => (
                      <div key={step.step}
                        onClick={() => setActiveStep(activeStep === step.step ? null : step.step)}
                        className="bg-white rounded-xl border border-slate-200 hover:border-gov-primary/30 transition-all cursor-pointer overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gov-primary to-gov-accent text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                            {step.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900">{step.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{step.estimatedTime}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step.automated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {step.automated ? 'AUTO' : 'MANUAL'}
                            </span>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${activeStep === step.step ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {activeStep === step.step && (
                          <div className="px-4 pb-4 pt-0 border-t border-slate-100 animate-fade-in">
                            {step.tasks?.length > 0 && (
                              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tareas</p>
                                <ul className="space-y-1">
                                  {step.tasks.map((task, i) => (
                                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                      <span className="text-gov-primary">&#10003;</span>{task}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {step.tools?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {step.tools.map((tool, i) => (
                                  <span key={i} className="text-[10px] bg-gov-primary/5 text-gov-primary px-2 py-1 rounded-lg border border-gov-primary/20 font-mono">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                {migrationPlan.risks?.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <h3 className="font-bold text-sm text-red-900 mb-3">Riesgos y Mitigaciones</h3>
                    <div className="space-y-2">
                      {migrationPlan.risks.map((risk, i) => (
                        <div key={i} className="p-3 bg-white rounded-lg border border-red-100">
                          <p className="font-semibold text-sm text-red-900">{risk.risk}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-bold text-slate-500">Mitigacion:</span> {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Estimate */}
                {migrationPlan.estimatedCost && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                    <h3 className="font-bold text-sm text-purple-900 mb-3">Estimacion de Costos</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Costo de Migracion</p>
                        <p className="text-2xl font-bold font-mono text-purple-900">{migrationPlan.estimatedCost.migrationCost}</p>
                        {migrationPlan.estimatedCost.breakdown && (
                          <ul className="mt-2 space-y-0.5">
                            {Object.entries(migrationPlan.estimatedCost.breakdown).map(([key, value]) => (
                              <li key={key} className="text-xs text-purple-700 capitalize">{key}: {value}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Ahorro Esperado</p>
                        {migrationPlan.estimatedCost.monthlySavings && (
                          <>
                            <p className="text-2xl font-bold font-mono text-gov-success">{migrationPlan.estimatedCost.monthlySavings}/mes</p>
                            <p className="text-xs text-slate-500 mt-1">Anual: {migrationPlan.estimatedCost.annualSavings}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {migrationPlan.recommendations?.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <h3 className="font-bold text-sm text-emerald-900 mb-2">Mejores Practicas</h3>
                    <ul className="space-y-1">
                      {migrationPlan.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                          <span className="text-emerald-500">&#8594;</span>{rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rollback */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <h3 className="font-bold text-sm text-amber-900 mb-2">Estrategia de Rollback</h3>
                  <p className="text-sm text-amber-800 font-medium">{migrationPlan.rollbackStrategy?.method}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Tiempo de rollback: <span className="font-bold font-mono">{migrationPlan.rollbackStrategy?.timeToRollback}</span>
                  </p>
                  {migrationPlan.rollbackStrategy?.steps && (
                    <ul className="mt-2 space-y-0.5">
                      {migrationPlan.rollbackStrategy.steps.map((s, i) => (
                        <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                          <span className="text-amber-500">&#9679;</span>{s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-lg text-slate-900 mb-1">Timeline de Migracion</h2>
            <p className="text-xs text-slate-500 mb-6">Cronograma tipico: 2-4 semanas</p>

            <div className="relative">
              <div className="absolute top-6 left-8 right-8 h-0.5 bg-gradient-to-r from-gov-primary via-gov-accent to-gov-success hidden md:block" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { week: 'S1', label: 'Preparacion', color: 'gov-primary', tasks: ['Escanear infraestructura', 'Crear backup', 'Generar plan'] },
                  { week: 'S2', label: 'Provisioning', color: 'gov-accent', tasks: ['Setup nueva nube', 'Configurar servicios', 'Deploy codigo'] },
                  { week: 'S3', label: 'Migracion', color: 'gov-primary', tasks: ['Migrar datos', 'Ejecutar tests', 'Validar setup'] },
                  { week: 'S4', label: 'Go Live', color: 'gov-success', tasks: ['Switch trafico', 'Monitorear', 'Decommission'] },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-12 h-12 bg-${item.color} rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-white z-10`}>
                      {i === 3 ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold text-sm">{item.week}</span>
                      )}
                    </div>
                    <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h3 className="font-bold text-sm text-slate-900 text-center">{item.label}</h3>
                      <ul className="text-[11px] text-slate-500 space-y-0.5 mt-2">
                        {item.tasks.map((t, j) => <li key={j} className="flex items-center gap-1"><span>&#9679;</span>{t}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Supported Providers */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-lg text-slate-900 mb-4">Proveedores Cloud Soportados</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {providers?.providers?.map(provider => (
            <div key={provider.name} className="p-4 rounded-xl border border-slate-200 hover:border-gov-primary/30 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: PROVIDER_COLORS[provider.name] || '#64748b' }}>
                    {provider.name.slice(0, 3).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm uppercase">{provider.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  provider.status === 'implemented'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {provider.status === 'implemented' ? 'ACTIVO' : 'PENDIENTE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{provider.displayName}</p>
              <div className="space-y-1">
                {Object.entries(provider.services).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-[11px]">
                    <span className="text-slate-400 capitalize">{key}</span>
                    <span className="font-mono text-slate-700">{value}</span>
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
