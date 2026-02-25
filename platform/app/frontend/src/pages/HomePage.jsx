import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="card bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-3">GovTech Cloud Migration Platform</p>
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Infraestructura cloud-agnostica para la transformacion digital de cualquier organizacion
        </h1>
        <p className="text-lg text-blue-100 mb-8 max-w-2xl">
          Migra entre proveedores cloud sin reescribir codigo. Todo el stack — aplicacion, infraestructura, seguridad y CI/CD — esta listo para produccion en AWS y es portable a cualquier proveedor.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/architecture" className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Ver Arquitectura
          </Link>
          <Link to="/health" className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400">
            Estado del Sistema
          </Link>
        </div>
      </div>

      {/* Numeros clave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: '4', label: 'Proveedores Cloud', sub: 'AWS · OCI · GCP · Azure' },
          { value: '2–3sem', label: 'Tiempo de Migracion', sub: 'vs 6+ meses tradicional' },
          { value: '96%', label: 'Reduccion de Costos', sub: 'vs soluciones tradicionales' },
          { value: '1', label: 'Variable de Entorno', sub: 'para cambiar de proveedor' },
        ].map((s) => (
          <div key={s.label} className="card text-center py-5">
            <p className="text-4xl font-bold text-blue-600">{s.value}</p>
            <p className="font-semibold text-gray-900 mt-1">{s.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Stack de arquitectura — visual */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">Stack de Arquitectura</h2>
        <p className="text-gray-600 mb-6">Cinco capas independientes. Cada una puede evolucionar o reemplazarse sin tocar las demas.</p>
        <div className="space-y-2">
          {[
            { layer: 'Aplicacion', desc: 'API Node.js + frontend React · basado en interfaces, sin acoplamiento al proveedor cloud', color: 'bg-blue-600', width: '100%' },
            { layer: 'Service Factory', desc: 'Selecciona el proveedor cloud correcto en tiempo de ejecucion · una variable de entorno', color: 'bg-purple-600', width: '90%' },
            { layer: 'Interfaces', desc: 'StorageService · DatabaseService · MonitoringService · AuthService', color: 'bg-indigo-500', width: '80%' },
            { layer: 'Proveedores Cloud', desc: 'AWS (activo) · OCI · GCP · Azure (estructurados, listos para implementar)', color: 'bg-teal-600', width: '70%' },
            { layer: 'Infraestructura (IaC)', desc: 'Modulos Terraform · EKS · RDS · VPC · Seguridad · 3 ambientes', color: 'bg-green-600', width: '60%' },
          ].map((item) => (
            <div key={item.layer} className="flex items-center gap-4">
              <div className="w-36 text-right">
                <span className="text-sm font-semibold text-gray-700">{item.layer}</span>
              </div>
              <div className="flex-1 rounded-lg overflow-hidden bg-gray-100">
                <div className={`${item.color} text-white px-4 py-2.5 text-sm`} style={{ width: item.width }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 pilares */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            title: 'Infraestructura (Terraform)',
            highlights: [
              'VPC · EKS · RDS · ECR · S3 definidos como codigo',
              'Modulo de seguridad: KMS, WAF, GuardDuty, Security Hub',
              'Estructura identica en ambientes dev / staging / prod',
            ],
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            border: 'border-purple-400', icon_bg: 'bg-purple-100 text-purple-600'
          },
          {
            title: 'Kubernetes (EKS)',
            highlights: [
              'NetworkPolicies: zero-trust, trafico bloqueado por defecto',
              'RBAC: ServiceAccount por componente + IRSA para AWS SDK',
              'PodDisruptionBudgets + Pod Security Standards',
            ],
            icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
            border: 'border-blue-400', icon_bg: 'bg-blue-100 text-blue-600'
          },
          {
            title: 'Seguridad IAM',
            highlights: [
              '10 grupos funcionales en 3 niveles de riesgo',
              '13 politicas custom, cada una con alcance a un solo dominio',
              'Nuevos usuarios: solo asignar grupos, sin cambiar politicas',
            ],
            icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
            border: 'border-red-400', icon_bg: 'bg-red-100 text-red-600'
          },
          {
            title: 'DevSecOps (CI/CD)',
            highlights: [
              'Autenticacion OIDC: cero access keys de larga vida en pipelines',
              'Controles de seguridad: Gitleaks · Semgrep · Trivy (bloquea en CRITICAL)',
              'SBOM generado por build · Checkov para analisis de IaC',
            ],
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            border: 'border-green-400', icon_bg: 'bg-green-100 text-green-600'
          },
        ].map((p) => (
          <div key={p.title} className={`card border-l-4 ${p.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.icon_bg}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={p.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{p.title}</h3>
            </div>
            <ul className="space-y-2">
              {p.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Estado de proveedores */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">Estado de Proveedores Cloud</h2>
        <p className="text-gray-600 mb-5">AWS esta completamente implementado. Los demas proveedores tienen la interfaz y la factory listos — 3 a 4 dias para implementar cada uno.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'AWS', status: 'Implementado', statusColor: 'bg-green-100 text-green-800', gradient: 'from-yellow-400 to-orange-500' },
            { name: 'OCI', status: 'Estructurado', statusColor: 'bg-yellow-100 text-yellow-700', gradient: 'from-red-500 to-orange-600' },
            { name: 'GCP', status: 'Estructurado', statusColor: 'bg-yellow-100 text-yellow-700', gradient: 'from-blue-500 to-cyan-600' },
            { name: 'Azure', status: 'Estructurado', statusColor: 'bg-yellow-100 text-yellow-700', gradient: 'from-blue-600 to-indigo-600' },
          ].map((p) => (
            <div key={p.name} className={`bg-gradient-to-br ${p.gradient} text-white rounded-lg p-4 text-center`}>
              <p className="text-3xl font-bold">{p.name}</p>
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${p.statusColor}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default HomePage
