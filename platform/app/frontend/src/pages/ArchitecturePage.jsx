function ArchitecturePage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h1 className="text-3xl font-bold mb-2">Arquitectura de la Plataforma</h1>
        <p className="text-blue-100">
          Infraestructura cloud de nivel productivo construida sobre AWS con seguridad, escalabilidad y portabilidad multi-cloud.
        </p>
      </div>

      {/* Capa de abstraccion multi-cloud */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">Capa de Abstraccion Multi-Cloud</h2>
        <p className="text-gray-600 mb-6">
          El codigo de la aplicacion nunca referencia un proveedor cloud directamente. Todas las operaciones cloud pasan por interfaces, y el patron Factory selecciona la implementacion correcta en tiempo de ejecucion basandose en una sola variable de entorno.
        </p>
        <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm space-y-1">
          <p className="text-blue-300">// Codigo de aplicacion — funciona con CUALQUIER proveedor</p>
          <p><span className="text-purple-300">const</span> storage = <span className="text-yellow-300">getStorageService</span>();</p>
          <p><span className="text-purple-300">const</span> url = <span className="text-purple-300">await</span> storage.<span className="text-yellow-300">uploadFile</span>(file, <span className="text-green-300">'docs/archivo.pdf'</span>);</p>
          <p className="mt-3 text-blue-300">// Para cambiar de AWS a GCP: modificar UNA linea en .env</p>
          <p><span className="text-green-300">CLOUD_PROVIDER</span>=<span className="text-yellow-300">gcp</span></p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { layer: 'Capa de Aplicacion', desc: 'Rutas, Controladores, Logica de negocio', color: 'from-blue-600 to-indigo-700' },
            { layer: 'Service Factory', desc: 'getStorageService, getDatabaseService', color: 'from-purple-600 to-pink-600' },
            { layer: 'Interfaces', desc: 'StorageService, DatabaseService, AuthService', color: 'from-orange-500 to-yellow-500' },
            { layer: 'Proveedores Cloud', desc: 'AWS (activo) · OCI · GCP · Azure (estructurados)', color: 'from-green-600 to-teal-600' },
          ].map((item, i) => (
            <div key={i} className={`bg-gradient-to-r ${item.color} text-white p-4 rounded-lg text-center`}>
              <p className="font-bold text-sm">{item.layer}</p>
              <p className="text-xs opacity-80 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stack de infraestructura */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Stack de Infraestructura (Terraform)</h2>
        <p className="text-gray-600 mb-6">
          Toda la infraestructura esta definida como codigo con Terraform en estructura modular. Cada modulo es independiente y reutilizable entre ambientes (dev, staging, prod).
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              module: 'networking',
              title: 'Modulo Networking',
              items: ['VPC con subnets publicas y privadas', 'Internet Gateway + NAT Gateway', 'Route tables por nivel de subnet', 'Security Groups por componente'],
              color: 'border-blue-500 bg-blue-50',
              badge: 'bg-blue-100 text-blue-800'
            },
            {
              module: 'kubernetes-cluster',
              title: 'Modulo Kubernetes (EKS)',
              items: ['Cluster EKS con managed node groups', 'OIDC provider para GitHub Actions', 'Repositorios ECR con encriptacion KMS', 'Politicas de ciclo de vida (mantiene ultimas 30 imagenes)'],
              color: 'border-purple-500 bg-purple-50',
              badge: 'bg-purple-100 text-purple-800'
            },
            {
              module: 'database',
              title: 'Modulo Base de Datos (RDS)',
              items: ['PostgreSQL en RDS Multi-AZ', 'Backups automaticos con retencion de 7 dias', 'Subnet group en subnets privadas', 'Proteccion contra eliminacion en tag de produccion'],
              color: 'border-green-500 bg-green-50',
              badge: 'bg-green-100 text-green-800'
            },
            {
              module: 'security',
              title: 'Modulo de Seguridad',
              items: ['KMS con rotacion automatica cada 90 dias', 'CloudTrail multi-region con integracion a CloudWatch', 'GuardDuty (deteccion S3, K8s, malware)', 'Security Hub (CIS + AWS Best Practices)', 'WAF con 5 grupos de reglas gestionadas', 'Secrets Manager para credenciales de BD y JWT', 'Deteccion de anomalias de costo con alertas'],
              color: 'border-red-500 bg-red-50',
              badge: 'bg-red-100 text-red-800'
            },
          ].map((mod) => (
            <div key={mod.module} className={`p-5 rounded-lg border-l-4 ${mod.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-mono px-2 py-1 rounded ${mod.badge}`}>module.{mod.module}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{mod.title}</h3>
              <ul className="space-y-1">
                {mod.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-600 font-mono">Ambientes: <span className="font-semibold">terraform/environments/dev</span> · <span className="font-semibold">staging</span> · <span className="font-semibold">prod</span></p>
        </div>
      </div>

      {/* Arquitectura Kubernetes */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Arquitectura Kubernetes</h2>
        <p className="text-gray-600 mb-6">
          Los workloads corren en EKS con hardening para produccion: aislamiento de red por defecto, control de acceso por rol por componente, y presupuestos de interrupcion para garantizar disponibilidad durante actualizaciones.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: 'Network Policies',
              icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
              items: ['Default deny-all (modelo zero-trust)', 'Frontend: solo recibe del ALB, solo habla con el backend', 'Backend: solo desde frontend/ALB, solo hacia BD y HTTPS', 'Base de datos: solo desde backend, sin egreso excepto DNS'],
              color: 'text-red-600 bg-red-50'
            },
            {
              title: 'RBAC',
              icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
              items: ['ServiceAccount por componente (backend, frontend, db)', 'Backend: anotacion IRSA para acceso al AWS SDK', 'Frontend/DB: montaje automatico de token desactivado', 'Rol deployer para operaciones kubectl del CI/CD'],
              color: 'text-blue-600 bg-blue-50'
            },
            {
              title: 'Seguridad de Pods',
              icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              items: ['Pod Security Standards: enforce=baseline', 'warn=restricted, audit=restricted', 'PodDisruptionBudget en los 3 servicios (minAvailable: 1)', 'Evita interrupcion total durante drenado de nodos'],
              color: 'text-green-600 bg-green-50'
            },
          ].map((section) => (
            <div key={section.title} className="p-4 border border-gray-200 rounded-lg">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${section.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
              <ul className="space-y-1">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Arquitectura IAM */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Arquitectura IAM</h2>
        <p className="text-gray-600 mb-6">
          10 grupos funcionales organizados en 3 niveles de riesgo. Cada grupo tiene acceso a exactamente un dominio. Agregar un nuevo miembro es asignarlo a los grupos correspondientes, sin modificar politicas.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              level: 'Nivel 1 - Critico',
              desc: 'Puede destruir infraestructura. Requiere MFA + acceso temporal.',
              groups: ['GovTech-Network-Admin', 'GovTech-EKS-Admin', 'GovTech-Database-Admin', 'GovTech-Terraform-Operator'],
              color: 'border-red-500',
              headerColor: 'bg-red-600',
              badge: 'bg-red-100 text-red-700'
            },
            {
              level: 'Nivel 2 - Operacional',
              desc: 'Puede comprometer la aplicacion pero no destruir infraestructura.',
              groups: ['GovTech-Container-Deploy', 'GovTech-ALB-Operator', 'GovTech-CICD-Operator'],
              color: 'border-yellow-500',
              headerColor: 'bg-yellow-500',
              badge: 'bg-yellow-100 text-yellow-700'
            },
            {
              level: 'Nivel 3 - Solo Lectura',
              desc: 'Solo puede leer. Riesgo maximo es exfiltracion de informacion.',
              groups: ['GovTech-Secrets-ReadOnly', 'GovTech-Monitor-ReadOnly', 'GovTech-Security-Auditor'],
              color: 'border-green-500',
              headerColor: 'bg-green-600',
              badge: 'bg-green-100 text-green-700'
            },
          ].map((level) => (
            <div key={level.level} className={`border-l-4 ${level.color} rounded-lg overflow-hidden`}>
              <div className={`${level.headerColor} text-white px-4 py-3`}>
                <p className="font-bold text-sm">{level.level}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-600 mb-3">{level.desc}</p>
                <div className="space-y-2">
                  {level.groups.map((group) => (
                    <span key={group} className={`block text-xs font-mono px-2 py-1 rounded ${level.badge}`}>
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">13 politicas custom</span> · <span className="font-semibold">10 grupos funcionales</span> · Scope a <span className="font-mono text-xs bg-gray-200 px-1 rounded">us-east-1</span> y prefijo <span className="font-mono text-xs bg-gray-200 px-1 rounded">govtech-*</span>
          </p>
        </div>
      </div>

      {/* Pipeline CI/CD */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Pipeline CI/CD</h2>
        <p className="text-gray-600 mb-6">
          GitHub Actions con autenticacion OIDC. Cero access keys de AWS en los pipelines. Los escaneos de seguridad corren antes de que cualquier imagen llegue a produccion.
        </p>
        <div className="space-y-3">
          {[
            { step: '1', name: 'Push de Codigo', desc: 'El desarrollador hace push a una rama', color: 'bg-gray-600' },
            { step: '2', name: 'Escaneo de Seguridad', desc: 'Gitleaks (secretos) · Semgrep SAST · npm audit · Checkov (IaC)', color: 'bg-red-600' },
            { step: '3', name: 'Build', desc: 'Imagen Docker construida con Dockerfile multi-etapa', color: 'bg-blue-600' },
            { step: '4', name: 'Escaneo Trivy', desc: 'Escaneo de vulnerabilidades — CRITICAL/HIGH bloquea el pipeline (exit-code 1)', color: 'bg-orange-600' },
            { step: '5', name: 'Push a ECR', desc: 'Imagen etiquetada y enviada a Amazon ECR via OIDC (sin access keys)', color: 'bg-purple-600' },
            { step: '6', name: 'SBOM', desc: 'Software Bill of Materials generado en formato CycloneDX (retencion 90 dias)', color: 'bg-teal-600' },
            { step: '7', name: 'Deploy a EKS', desc: 'kubectl apply via rol OIDC — rollout y verificacion de salud', color: 'bg-green-600' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full ${s.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5`}>
                {s.step}
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patrones de diseno */}
      <div className="card bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <h2 className="text-2xl font-bold mb-4 text-indigo-900">Patrones de Diseno Aplicados</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Strategy Pattern', desc: 'Multiples implementaciones de la misma interfaz (proveedores AWS, OCI, GCP, Azure)' },
            { name: 'Factory Pattern', desc: 'Punto de entrada unico (getStorageService) que retorna el proveedor correcto en tiempo de ejecucion' },
            { name: 'Dependency Injection', desc: 'Servicios inyectados via factory methods, no hardcodeados — facilita testing y reemplazo' },
            { name: 'Interface Segregation', desc: 'StorageService, DatabaseService, MonitoringService, AuthService — cada uno con contratos claros' },
          ].map((pattern) => (
            <div key={pattern.name} className="p-4 bg-white rounded-lg border border-indigo-200">
              <p className="font-bold text-indigo-900">{pattern.name}</p>
              <p className="text-sm text-gray-600 mt-1">{pattern.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default ArchitecturePage
