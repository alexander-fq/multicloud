// Importacion de archivos Markdown del proyecto con Vite ?raw
import archDiagrams    from '../../../../docs/architecture/ARCHITECTURE_DIAGRAMS.md?raw'
import archOpts        from '../../../../docs/architecture/ARCHITECTURE_OPTIMIZATIONS.md?raw'
import multiCloud      from '../../../../docs/architecture/MULTI_CLOUD_SERVICES.md?raw'
import deployGuide     from '../../../../docs/deployment/DEPLOYMENT_GUIDE.md?raw'
import rollbackGuide   from '../../../../docs/deployment/ROLLBACK_GUIDE.md?raw'
import iamPolicies     from '../../../../docs/IAM_SECURITY_POLICIES.md?raw'
import securityPolicy  from '../../../../security/policies/SECURITY_POLICY.md?raw'
import drPlan          from '../../../../disaster-recovery/runbooks/DR_PLAN.md?raw'
import infra           from '../../../../INFRASTRUCTURE.md?raw'
import terraformReadme from '../../../../terraform/README.md?raw'
import k8sReadme       from '../../../../kubernetes/README.md?raw'

// Estructura de la documentacion (como un arbol de navegacion)
export const DOCS_TREE = [
  {
    id: 'architecture',
    title: 'Arquitectura',
    icon: 'arch',
    defaultOpen: true,
    children: [
      {
        id: 'architecture-diagrams',
        title: 'Diagramas de Arquitectura',
        content: archDiagrams,
        description: 'Diagramas Mermaid: hibrido, multicloud, VPC, CI/CD, HPA, DR y monitoring',
        tags: ['mermaid', 'vpc', 'eks', 'aws', 'gcp', 'hybrid'],
      },
      {
        id: 'architecture-optimizations',
        title: 'Optimizaciones y Escalabilidad',
        content: archOpts,
        description: 'Analisis de optimizaciones de performance y costos en la plataforma',
        tags: ['performance', 'cost', 'optimization', 'scalability'],
      },
      {
        id: 'multi-cloud-services',
        title: 'Servicios Multi-Cloud',
        content: multiCloud,
        description: 'Mapa de servicios equivalentes en AWS, OCI, GCP y Azure. Proceso de migracion entre proveedores.',
        tags: ['multicloud', 'oci', 'gcp', 'azure', 'aws', 'migration', 'services', 'portability'],
      },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infraestructura',
    icon: 'infra',
    children: [
      {
        id: 'infrastructure-overview',
        title: 'Vision General',
        content: infra,
        description: 'Descripcion completa de la infraestructura: VPC, EKS, RDS, S3, ECR',
        tags: ['vpc', 'eks', 'rds', 's3', 'terraform', 'kubernetes'],
      },
      {
        id: 'terraform',
        title: 'Terraform',
        content: terraformReadme,
        description: 'Guia de uso de Terraform: modulos, environments dev/staging/prod',
        tags: ['terraform', 'iac', 'modules', 'state', 'init', 'apply'],
      },
      {
        id: 'kubernetes',
        title: 'Kubernetes',
        content: k8sReadme,
        description: 'Manifiestos Kubernetes: deployments, services, ingress, HPA, StatefulSet',
        tags: ['kubernetes', 'k8s', 'pods', 'deployment', 'ingress', 'hpa'],
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Despliegue',
    icon: 'deploy',
    children: [
      {
        id: 'deployment-guide',
        title: 'Guia de Deployment',
        content: deployGuide,
        description: 'Pasos para desplegar en AWS: Terraform → EKS → Prometheus → Grafana',
        tags: ['deploy', 'eks', 'kubectl', 'cicd', 'github-actions'],
      },
      {
        id: 'rollback-guide',
        title: 'Guia de Rollback',
        content: rollbackGuide,
        description: 'Procedimiento de rollback: kubectl, Terraform, RDS snapshot restore',
        tags: ['rollback', 'kubectl', 'rds', 'snapshot', 'emergency'],
      },
    ],
  },
  {
    id: 'security',
    title: 'Seguridad',
    icon: 'security',
    children: [
      {
        id: 'security-policy',
        title: 'Politica de Seguridad',
        content: securityPolicy,
        description: 'Principios: least privilege, defense in depth, cifrado, respuesta a incidentes',
        tags: ['security', 'iam', 'encryption', 'compliance', 'iso27001', 'gdpr'],
      },
      {
        id: 'iam-policies',
        title: 'Politicas IAM',
        content: iamPolicies,
        description: 'Grupos, usuarios y politicas IAM para cada colaborador',
        tags: ['iam', 'groups', 'policies', 'permissions', 'least-privilege'],
      },
    ],
  },
  {
    id: 'disaster-recovery',
    title: 'Recuperacion ante Desastres',
    icon: 'dr',
    children: [
      {
        id: 'dr-plan',
        title: 'Plan DR',
        content: drPlan,
        description: 'RTO: 4h / RPO: 24h. Procedimientos para fallas de AZ y region completa',
        tags: ['dr', 'rto', 'rpo', 'backup', 'restore', 'failover'],
      },
    ],
  },
]

// Todas las paginas como lista plana para busqueda
export const ALL_DOCS = DOCS_TREE.flatMap(section =>
  section.children.map(doc => ({ ...doc, section: section.title, sectionId: section.id }))
)

// Busqueda simple en titulo, descripcion, tags y contenido
export function searchDocs(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()

  const results = []
  for (const doc of ALL_DOCS) {
    const titleMatch  = doc.title.toLowerCase().includes(q)
    const descMatch   = doc.description.toLowerCase().includes(q)
    const tagMatch    = doc.tags.some(t => t.includes(q))
    const contentIdx  = doc.content.toLowerCase().indexOf(q)

    if (titleMatch || descMatch || tagMatch || contentIdx !== -1) {
      let snippet = doc.description
      if (contentIdx !== -1 && !titleMatch && !descMatch) {
        const start = Math.max(0, contentIdx - 60)
        const end   = Math.min(doc.content.length, contentIdx + 120)
        snippet = (start > 0 ? '...' : '') + doc.content.slice(start, end).replace(/[#*`]/g, '') + '...'
      }
      results.push({
        ...doc,
        snippet,
        score: (titleMatch ? 3 : 0) + (descMatch ? 2 : 0) + (tagMatch ? 1 : 0) + (contentIdx !== -1 ? 1 : 0),
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
