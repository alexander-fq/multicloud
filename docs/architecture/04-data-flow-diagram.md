# Data Flow Diagram - GovTech Trámites

## Overview

This document shows how data travels through every component
of the architecture for each user action.

## Flow 1: Citizen Creates a New Tramite (Most Important)

```
CITIZEN BROWSER                    AWS CLOUD
───────────────                    ─────────

1. Types: govtech.com
   │
   ▼
2. DNS Resolution (Route 53)
   │  "govtech.com → 52.23.145.67"
   │
   ▼
3. HTTPS Request (port 443)
   │  Encrypted with TLS 1.3
   │
   ▼
╔══════════════════════════════════════════════════════════════════╗
║  INTERNET GATEWAY                                               ║
╚══════════════╤═══════════════════════════════════════════════════╝
               │
               ▼
        ┌──────────────┐
        │  AWS WAF      │  Check: Is this a bot? SQL injection? XSS?
        │  ✅ Clean     │  Result: Request is safe, let it pass
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  NACL        │  Check: Port 443 from 0.0.0.0/0?
        │  (public)    │  Result: Rule 100 → ALLOW
        │  ✅ Allowed  │
        └──────┬───────┘
               │
               ▼
        ┌──────────────────────────────────────────────────┐
        │  APPLICATION LOAD BALANCER (ALB)                  │
        │                                                  │
        │  1. SSL Termination (decrypts HTTPS)             │
        │  2. Reads request path:                          │
        │     GET / → route to Frontend pods               │
        │     POST /api/* → route to Backend pods          │
        │  3. Health check: picks healthy pod              │
        │  4. Sticky session: same user → same pod         │
        └──────────────────────┬───────────────────────────┘
               │               │
       ┌───────┘               └───────┐
       │ GET /                         │ POST /api/v1/tramites
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│  NACL        │               │  NACL        │
│  (private)   │               │  (private)   │
│  ✅ Port 80  │               │  ✅ Port 3000│
└──────┬───────┘               └──────┬───────┘
       │                               │
       ▼                               ▼
┌──────────────┐               ┌──────────────────────────────────┐
│ SG: frontend │               │ SG: backend                      │
│ ✅ From ALB  │               │ ✅ From ALB                      │
└──────┬───────┘               └──────┬───────────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────────┐           ┌──────────────────────────────────┐
│ FRONTEND POD     │           │ BACKEND POD                      │
│                  │           │                                  │
│ Serves React SPA │           │ Step A: Validate input           │
│ (index.html +    │           │   - DNI: 8 digits? ✅            │
│  JS + CSS)       │           │   - Name: 3-200 chars? ✅        │
│                  │           │   - Type: valid enum? ✅          │
│ Browser loads    │           │                                  │
│ then makes API   │           │ Step B: Check for duplicates     │
│ call to backend  │──────────►│   - Query RDS: existing DNI+type?│
│                  │           │                                  │
└──────────────────┘           │ Step C: Verify citizen identity  │
                               │   │                              │
                               │   ▼ (Transit Gateway)           │
                               │   ┌──────────────────────────┐  │
                               │   │ ON-PREMISE VPC            │  │
                               │   │ Identity Service          │  │
                               │   │ GET /verify/12345678      │  │
                               │   │ Response: "Valid - Juan"  │  │
                               │   └──────────────────────────┘  │
                               │                                  │
                               │ Step D: Create tramite in DB     │
                               │   │                              │
                               │   ▼                              │
                               │   ┌──────────────────────────┐  │
                               │   │ NACL (database)           │  │
                               │   │ ✅ Port 5432 from backend │  │
                               │   └──────────┬───────────────┘  │
                               │              │                   │
                               │              ▼                   │
                               │   ┌──────────────────────────┐  │
                               │   │ SG: database              │  │
                               │   │ ✅ From sg-backend        │  │
                               │   └──────────┬───────────────┘  │
                               │              │                   │
                               │              ▼                   │
                               │   ┌──────────────────────────┐  │
                               │   │ RDS PostgreSQL            │  │
                               │   │                          │  │
                               │   │ INSERT INTO tramites     │  │
                               │   │ VALUES (uuid, 'TRAM-...',│  │
                               │   │   '12345678', 'Juan',    │  │
                               │   │   'DNI', 'PENDIENTE')    │  │
                               │   │                          │  │
                               │   │ Returns: created record  │  │
                               │   └──────────────────────────┘  │
                               │                                  │
                               │ Step E: Send metrics             │
                               │   │                              │
                               │   ▼ (Transit Gateway)           │
                               │   ┌──────────────────────────┐  │
                               │   │ MANAGEMENT VPC            │  │
                               │   │ Prometheus: record metric │  │
                               │   │ "tramite_created_total+1"│  │
                               │   └──────────────────────────┘  │
                               │                                  │
                               │ Step F: Send response            │
                               │   HTTP 201 Created               │
                               │   {                              │
                               │     "success": true,             │
                               │     "data": {                    │
                               │       "numeroTramite":           │
                               │         "TRAM-20260208-00001",   │
                               │       "estado": "PENDIENTE"      │
                               │     }                            │
                               │   }                              │
                               └──────────┬───────────────────────┘
                                          │
                               (Response travels back)
                                          │
                                          ▼
                               ALB → Internet GW → Citizen Browser
                               "Your tramite TRAM-20260208-00001 was created!"
```

## Flow 2: Citizen Checks Tramite Status

```
Citizen: "I want to check my tramite TRAM-20260208-00001"

Browser ──► DNS ──► Internet GW ──► WAF ──► ALB ──► Frontend Pod
                                                        │
                                              Serves React SPA
                                              User types tramite number
                                              React makes API call:
                                                        │
                                                        ▼
        GET /api/v1/tramites/numero/TRAM-20260208-00001
                                                        │
                                              ALB ──► Backend Pod
                                                        │
                                              Step 1: Parse tramite number
                                              Step 2: Query RDS
                                                        │
                                                        ▼
                                                    RDS PostgreSQL
                                                    SELECT * FROM tramites
                                                    WHERE numero_tramite =
                                                    'TRAM-20260208-00001'
                                                        │
                                                        ▼
                                                    Returns record:
                                                    {
                                                      estado: "EN_PROCESO",
                                                      documentosPendientes:
                                                        ["Pago de tasa"],
                                                      ...
                                                    }
                                                        │
                                              Backend Pod formats response
                                                        │
                                                        ▼
                                              ALB ──► Internet GW ──► Browser

Citizen sees:
┌──────────────────────────────────────┐
│ Trámite: TRAM-20260208-00001        │
│ Estado: [🔵 EN PROCESO]              │
│ Documentos Pendientes:              │
│   • Pago de tasa                    │
│ Fecha estimada: 15/02/2026          │
└──────────────────────────────────────┘
```

## Flow 3: Admin Views Dashboard Statistics

```
Admin: Opens dashboard page

Browser ──► ALB ──► Frontend Pod (serves React SPA)
                        │
            React mounts, calls 2 APIs in parallel:
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
  GET /api/v1/tramites        GET /api/v1/tramites/estadisticas
  ?page=1&limit=5              │
            │                  │
            ▼                  ▼
       Backend Pod         Backend Pod
            │                  │
            ▼                  ▼
        RDS Query          RDS Query
        SELECT *           SELECT estado,
        FROM tramites      COUNT(*) as total
        ORDER BY           FROM tramites
        created_at DESC    GROUP BY estado
        LIMIT 5
            │                  │
            ▼                  ▼
        Returns:           Returns:
        [5 recent          { total: 150,
         tramites]           porEstado: {
                               PENDIENTE: 45,
                               EN_PROCESO: 60,
                               COMPLETADO: 30,
                               ...
                             }
                           }
            │                  │
            └───────┬──────────┘
                    ▼
            React renders dashboard:
            ┌──────────────────────────────────────────┐
            │  📊 Total: 150  │  ⏳ Pendientes: 45     │
            │  ✅ Completados: 30  │  ❌ Rechazados: 10 │
            ├──────────────────────────────────────────┤
            │  Recent: TRAM-001, TRAM-002, TRAM-003... │
            │  [Chart: Pie chart by status]            │
            └──────────────────────────────────────────┘
```

## Flow 4: Monitoring & Alerting (Behind the Scenes)

```
This happens continuously, NOT triggered by users.

Every 15 seconds:
┌──────────────────────────────────────────────────────────────────┐
│                     VPC MANAGEMENT                                │
│                                                                  │
│  Prometheus Server                                               │
│  │                                                               │
│  ├──► Scrape Backend Pods (port 3000/metrics)                    │
│  │    Transit GW → VPC Cloud → Backend Pod                       │
│  │    Collects: request_count, response_time, error_rate         │
│  │                                                               │
│  ├──► Scrape RDS Metrics (via CloudWatch exporter)               │
│  │    Collects: connections, cpu_usage, storage_used             │
│  │                                                               │
│  ├──► Scrape EKS Metrics (via kube-state-metrics)                │
│  │    Collects: pod_count, pod_restarts, cpu_usage, memory       │
│  │                                                               │
│  └──► Scrape On-Premise Services                                 │
│       Transit GW → VPC On-Premise → EC2 instances                │
│       Collects: service_up, response_time                        │
│                                                                  │
│  AlertManager                                                    │
│  │                                                               │
│  ├──► IF error_rate > 5% for 5 minutes                           │
│  │    THEN send alert to Slack: "⚠️ High error rate on backend"  │
│  │                                                               │
│  ├──► IF cpu_usage > 80% for 10 minutes                          │
│  │    THEN send alert: "⚠️ High CPU on EKS nodes"               │
│  │    AND trigger: Kubernetes HPA scales up pods                 │
│  │                                                               │
│  ├──► IF rds_connections > 80% of max                            │
│  │    THEN send alert: "⚠️ Database connections running high"    │
│  │                                                               │
│  └──► IF pod_restarts > 3 in 10 minutes                          │
│       THEN send alert: "🔴 Pod crash loop detected"              │
│                                                                  │
│  Grafana Dashboards                                              │
│  │                                                               │
│  ├──► Infrastructure Dashboard                                   │
│  │    Shows: CPU, Memory, Network, Disk for all resources        │
│  │                                                               │
│  ├──► Application Dashboard                                      │
│  │    Shows: Request/sec, Response time, Error rate, Active users│
│  │                                                               │
│  └──► Security Dashboard                                         │
│       Shows: Failed logins, Blocked IPs (WAF), Unusual traffic   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Flow 5: Backup & Disaster Recovery (Automated)

```
Daily at 02:00 AM (automatic):

┌──────────────────────────────────────────────────────────────────┐
│                     BACKUP FLOW                                   │
│                                                                  │
│  RDS PostgreSQL (Primary)                                        │
│  │                                                               │
│  ├──► Automated Snapshot (RDS built-in)                          │
│  │    - Full database backup                                     │
│  │    - Retained for 30 days                                     │
│  │    - Encrypted with KMS key                                   │
│  │                                                               │
│  └──► Transaction Logs (continuous)                               │
│       - Every 5 minutes                                          │
│       - Enables Point-in-Time Recovery                           │
│       - Can restore to any second in last 30 days                │
│                                                                  │
│  S3 Bucket (Backup Storage)                                      │
│  │                                                               │
│  ├──► RDS snapshots stored here                                  │
│  ├──► Application logs archived here                             │
│  ├──► Terraform state backup                                     │
│  │                                                               │
│  └──► Cross-Region Replication (optional)                         │
│       S3 us-east-1 ──sync──► S3 us-west-2                       │
│       (in case entire region goes down)                          │
│                                                                  │
│  EKS Cluster                                                     │
│  │                                                               │
│  └──► No backup needed!                                           │
│       Kubernetes manifests are in Git (Infrastructure as Code)   │
│       If cluster dies → recreate from Git + Terraform            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Recovery Scenarios:
┌─────────────────────────────────────────────────────────────────┐
│ Scenario                    │ Recovery Method      │ Time (RTO) │
├─────────────────────────────┼──────────────────────┼────────────┤
│ Pod crashes                 │ K8s auto-restart     │ < 30 sec   │
│ Node fails                  │ K8s reschedules pods │ < 2 min    │
│ AZ-A goes down              │ Auto failover to AZ-B│ < 5 min    │
│ Database corrupted          │ Point-in-Time restore│ < 30 min   │
│ Entire region fails         │ DR plan activation   │ < 4 hours  │
│ Accidental data deletion    │ Restore from snapshot│ < 15 min   │
└─────────────────────────────┴──────────────────────┴────────────┘
```

## Flow 6: CI/CD Deployment (Developer pushes code)

```
Developer: git push origin main

GitHub                          AWS
──────                          ───

1. Push triggers
   GitHub Actions
   │
   ▼
2. CI Pipeline runs:
   ├──► Install dependencies
   ├──► Run linter (eslint)
   ├──► Run tests (jest)
   ├──► Security scan (trivy)
   └──► Build Docker image
           │
           ▼
3. Push image to ECR
   (Elastic Container Registry)
   │                            ┌─────────────────┐
   └───────────────────────────►│ ECR Registry     │
                                │ govtech/backend  │
                                │ tag: v1.2.3      │
                                └────────┬────────┘
                                         │
4. CD Pipeline:                          │
   ├──► Update K8s deployment    ────────┘
   │    (new image tag)
   │         │
   │         ▼
   │    ┌─────────────────────────────────────────┐
   │    │ EKS Cluster                              │
   │    │                                         │
   │    │ Rolling Update Strategy:                │
   │    │                                         │
   │    │ Step 1: Start new pod (v1.2.3)          │
   │    │   [v1.2.2] [v1.2.2] [v1.2.3-starting]  │
   │    │                                         │
   │    │ Step 2: New pod healthy? Run health check│
   │    │   [v1.2.2] [v1.2.2] [v1.2.3-✅ healthy] │
   │    │                                         │
   │    │ Step 3: Remove one old pod              │
   │    │   [v1.2.2] [v1.2.3] [v1.2.3]           │
   │    │                                         │
   │    │ Step 4: Repeat until all updated        │
   │    │   [v1.2.3] [v1.2.3] [v1.2.3] ✅ Done   │
   │    │                                         │
   │    │ If health check fails → automatic rollback│
   │    │   [v1.2.2] [v1.2.2] [v1.2.2] ⏪ Reverted│
   │    └─────────────────────────────────────────┘
   │
   ├──► Run smoke tests against new deployment
   │
   └──► Notify team (Slack/email):
        "✅ Backend v1.2.3 deployed to production"
```

## Complete Data Flow Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    ALL FLOWS IN ONE VIEW                        │
│                                                                │
│  EXTERNAL                                                      │
│  ════════                                                      │
│  Citizens ──► DNS ──► WAF ──► ALB ──► App Pods ──► Database   │
│  (browsers)   │                              │                 │
│               │                              │                 │
│  INTERNAL     │                              │                 │
│  ════════     │                              │                 │
│  Monitoring ◄─┼── Prometheus scrapes ◄───────┘                 │
│  (Grafana)    │                                                │
│               │                                                │
│  HYBRID       │                                                │
│  ══════       │                                                │
│  On-Premise ◄─┼── Transit GW ◄── Backend Pods                 │
│  (Identity)   │   (verify DNI)                                 │
│               │                                                │
│  CI/CD        │                                                │
│  ════         │                                                │
│  GitHub ──► Actions ──► ECR ──► EKS (rolling update)          │
│               │                                                │
│  BACKUP       │                                                │
│  ══════       │                                                │
│  RDS ──► Snapshots ──► S3 (encrypted, 30 days retention)      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Equivalent in OCI (Oracle Cloud)

| AWS Service | OCI Equivalent | Used In Flow |
|-------------|---------------|--------------|
| Route 53 | OCI DNS | Flow 1 (DNS resolution) |
| WAF | OCI WAF | Flow 1 (attack filtering) |
| ALB | OCI Load Balancer | Flow 1, 2, 3 (traffic routing) |
| EKS | OKE | Flow 1-3 (app hosting), Flow 6 (deploy) |
| RDS | OCI DB System | Flow 1-3 (data storage), Flow 5 (backup) |
| CloudWatch | OCI Monitoring | Flow 4 (metrics) |
| ECR | OCIR (Container Registry) | Flow 6 (Docker images) |
| S3 | Object Storage | Flow 5 (backups) |
| KMS | OCI Vault | Flow 5 (encryption keys) |
| Transit GW | DRG | Flow 1 (hybrid connection) |

## Key Concepts for OCI Certification

```
1. RPO (Recovery Point Objective):
   "How much data can I afford to LOSE?"
   Our design: 0 seconds (synchronous replication to Standby)
   With S3 backups: max 5 minutes of transaction logs

2. RTO (Recovery Time Objective):
   "How long can the system be DOWN?"
   Pod crash: 30 seconds (K8s auto-restart)
   AZ failure: 5 minutes (auto failover)
   Region failure: 4 hours (manual DR activation)

3. Rolling Update:
   "How to deploy without downtime?"
   New pods start → health check → old pods removed
   Users never see downtime (zero-downtime deployment)

4. SSL Termination:
   "Where does encryption end?"
   At the Load Balancer. Internal traffic is on private network.
   For government: consider re-encryption (ALB → Pod also encrypted)
```
