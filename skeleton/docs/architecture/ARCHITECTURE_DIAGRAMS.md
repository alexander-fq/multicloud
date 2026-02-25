# Diagramas de Arquitectura - GovTech Cloud Migration Platform

> **Enfoque:** Arquitectura hibrida con AWS como nube principal e integracion con
> infraestructura on-premise del cliente. El diseno es cloud-agnostic en la capa
> de aplicacion (Kubernetes) para permitir portabilidad futura a otros proveedores.

---

## 1. Arquitectura Hibrida (On-Premise + AWS Cloud)

Este diagrama muestra el escenario de una organizacion: sistemas legacy en datacenter
propio que se integran con nuevos servicios en AWS. La migracion es gradual, no total.

```mermaid
graph TB
    subgraph USUARIOS["Usuarios / Internet"]
        USER[Navegador]
        MOBILE[App Movil]
    end

    subgraph ONPREMISE["Datacenter del Cliente (On-Premise)"]
        direction TB
        LEGACY_DB[(Base de datos\nlegacy Oracle/SQL)]
        LEGACY_APP[Sistemas\nlegacy Java/COBOL]
        LDAP[Directorio Activo\nLDAP / LDAPS]
        VPN_GW[VPN Gateway\nIPSec / Direct Connect]
    end

    subgraph AWS["AWS Cloud - us-east-1"]
        R53[Route53 DNS]
        CF[CloudFront CDN\nedge locations]
        ALB[Application Load Balancer\nHTTPS / WAF]

        subgraph VPC["VPC Privada"]
            subgraph EKS["EKS Cluster"]
                API[Backend\nNode.js API]
                FRONT[Frontend\nReact / Nginx]
                MIGRATOR[Servicio de\nMigracion]
            end
            RDS[(RDS PostgreSQL\nnuevos datos)]
            S3[S3\narchivos y docs]
        end

        DX[AWS Direct Connect\n1Gbps dedicado]
    end

    USER -->|HTTPS| CF
    MOBILE -->|HTTPS| CF
    CF --> ALB
    ALB --> FRONT
    ALB -->|/api| API
    API --> RDS
    API --> S3

    %% Integracion hibrida
    API <-->|Consultas legacy\nREST / SOAP| LEGACY_APP
    API <-->|Autenticacion\nLDAP sobre TLS| LDAP
    MIGRATOR <-->|Migracion\nde datos| LEGACY_DB

    %% Conectividad segura entre nube y datacenter
    VPN_GW <-->|Tunel cifrado\nAES-256| DX
    DX <--> VPC

    style ONPREMISE fill:#e8e8e8,stroke:#666
    style AWS fill:#fff8e1,stroke:#ff9900
    style USUARIOS fill:#e3f2fd,stroke:#1565c0
```

**Por que hibrido y no 100% cloud:**
- Las organizaciones tienen sistemas legacy de decadas que no pueden migrarse de golpe
- Algunas regulaciones exigen que ciertos datos permanezcan en la infraestructura propia
- La migracion gradual reduce el riesgo operativo
- Direct Connect da conectividad privada (no pasa por internet publico)

---

## 2. Arquitectura Multicloud (AWS + GCP como nube secundaria)

Escenario de alta disponibilidad maxima: si AWS us-east-1 falla completamente,
el trafico se redirige a GCP automaticamente via Route53 health checks.

```mermaid
graph TB
    subgraph DNS["DNS Global"]
        R53[Route53\nHealth Checks\nLatency routing]
    end

    subgraph AWS_CLOUD["AWS Cloud (Principal - 80% trafico)"]
        ALB_AWS[ALB\nus-east-1]
        EKS_AWS[EKS\ngovtech-prod]
        RDS_AWS[(RDS PostgreSQL\nMulti-AZ)]
        S3_AWS[S3\nus-east-1]
    end

    subgraph GCP_CLOUD["GCP Cloud (Secundario - 20% / failover)"]
        LB_GCP[Cloud Load Balancer\nus-central1]
        GKE[GKE\ngovtech-gcp]
        CLOUD_SQL[(Cloud SQL\nPostgreSQL)]
        GCS[Cloud Storage\nus-central1]
    end

    subgraph REPLICATION["Sincronizacion entre nubes"]
        SYNC[Servicio de\nReplicacion\nde datos]
    end

    USER[Usuario] -->|app.ejemplo.com| R53
    R53 -->|Healthy: 80%| ALB_AWS
    R53 -->|Failover / 20%| LB_GCP
    ALB_AWS --> EKS_AWS --> RDS_AWS
    LB_GCP --> GKE --> CLOUD_SQL
    RDS_AWS <-->|Replicacion async| SYNC
    SYNC <-->|cada 5 min| CLOUD_SQL
    S3_AWS <-->|Cross-cloud sync| GCS

    style AWS_CLOUD fill:#fff8e1,stroke:#ff9900
    style GCP_CLOUD fill:#e8f5e9,stroke:#1b5e20
    style REPLICATION fill:#f3e5f5,stroke:#6a1b9a
```

**Cuando aplica este modelo:**
- Requisito de disponibilidad 99.99% (menos de 52 min de downtime al año)
- Regulaciones que exigen no depender de un solo proveedor
- Reduccion de riesgo ante fallas de region completa

**Estado de implementacion:**
- AWS: **implementado** (Terraform + Kubernetes manifests en este repositorio)
- GCP: **disenado** (pendiente de implementacion si el cliente lo requiere)

---

## 3. Arquitectura General AWS (Vista de Alto Nivel)

```mermaid
graph TB
    subgraph Internet
        USER[Usuario / Navegador]
        ADMIN[Administrador]
    end

    subgraph AWS["AWS us-east-1"]
        R53[Route53\nDNS]
        ACM[ACM\nCertificado SSL]

        subgraph VPC["VPC 10.0.0.0/16"]
            subgraph PUBLIC["Subnets Publicas (us-east-1a, 1b, 1c)"]
                ALB[Application\nLoad Balancer]
                NAT[NAT Gateways]
                BASTION[Bastion Host\nSSH Jump]
            end

            subgraph PRIVATE["Subnets Privadas (us-east-1a, 1b, 1c)"]
                subgraph EKS["EKS Cluster - govtech-prod"]
                    BACKEND[backend pods\n2-10 replicas]
                    FRONTEND[frontend pods\n2-8 replicas]
                    POSTGRES[postgres\nStatefulSet]
                end
                RDS[(RDS PostgreSQL\nMulti-AZ)]
            end
        end

        subgraph SERVICES["Servicios AWS Gestionados"]
            ECR[ECR\nDocker Images]
            S3[S3\nBackups + Storage]
            CW[CloudWatch\nLogs + Metrics]
            CT[CloudTrail\nAuditoria]
        end
    end

    USER -->|HTTPS 443| R53
    R53 --> ALB
    ACM --> ALB
    ALB -->|/api/*| BACKEND
    ALB -->|/*| FRONTEND
    BACKEND --> POSTGRES
    BACKEND --> RDS
    BACKEND --> S3
    ADMIN -->|SSH via VPN| BASTION
    BASTION -->|SSH privado| EKS
    EKS --> CW
    EKS --> CT
    ECR --> BACKEND
    ECR --> FRONTEND
```

---

## 4. Arquitectura de Red (VPC)

```mermaid
graph LR
    IGW[Internet Gateway]

    subgraph VPC["VPC 10.0.0.0/16"]
        subgraph AZ_A["AZ: us-east-1a"]
            PUB_A["Subnet Publica\n10.0.1.0/24"]
            PRV_A["Subnet Privada\n10.0.10.0/24"]
            NAT_A["NAT Gateway\n+ Elastic IP"]
        end

        subgraph AZ_B["AZ: us-east-1b"]
            PUB_B["Subnet Publica\n10.0.2.0/24"]
            PRV_B["Subnet Privada\n10.0.11.0/24"]
            NAT_B["NAT Gateway\n+ Elastic IP"]
        end

        subgraph AZ_C["AZ: us-east-1c"]
            PUB_C["Subnet Publica\n10.0.3.0/24"]
            PRV_C["Subnet Privada\n10.0.12.0/24"]
            NAT_C["NAT Gateway\n+ Elastic IP"]
        end

        SG_EKS["Security Group EKS\nIngress: 443, 10250"]
        SG_RDS["Security Group RDS\nIngress: 5432 solo desde SG_EKS"]
    end

    IGW --> PUB_A & PUB_B & PUB_C
    PUB_A --> NAT_A --> PRV_A
    PUB_B --> NAT_B --> PRV_B
    PUB_C --> NAT_C --> PRV_C
    PRV_A & PRV_B & PRV_C --> SG_EKS
    SG_EKS --> SG_RDS
```

---

## 5. Pipeline CI/CD

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant GH as GitHub
    participant CI as GitHub Actions CI
    participant ECR as AWS ECR
    participant CD as GitHub Actions CD
    participant TF as Terraform
    participant EKS as EKS Cluster

    DEV->>GH: git push origin feature/mi-cambio
    DEV->>GH: Pull Request a staging

    GH->>CI: Trigger backend-ci.yml / frontend-ci.yml
    CI->>CI: npm ci + lint + test
    CI->>CI: docker build
    CI->>CI: trivy scan (vulnerabilidades)
    CI->>ECR: docker push :SHA123abc

    DEV->>GH: Merge PR a staging
    GH->>CD: Trigger deploy-dev.yml
    CD->>TF: terraform init + plan + apply
    TF->>EKS: Infraestructura actualizada
    CD->>ECR: Login
    CD->>EKS: kubectl apply -f kubernetes/
    EKS->>EKS: Rolling update pods
    CD->>CD: kubectl rollout status (esperar)
    CD->>CD: Smoke tests

    Note over DEV,EKS: Si todo funciona en dev/staging

    DEV->>GH: Trigger manual deploy-prod.yml
    GH->>GH: Aprobacion requerida (GitHub Environment)
    GH->>CD: Aprobado - Ejecutar
    CD->>EKS: kubectl set image (nueva version)
    EKS->>EKS: Blue-Green: nueva version (green)
    CD->>CD: Health checks en green
    Note over EKS: Si health checks fallan: rollback automatico
```

---

## 6. Flujo de Autoscaling (HPA)

```mermaid
graph TD
    MS[Metrics Server\n15s interval]
    MS -->|CPU/Memory metrics| HPA[HPA Controller]

    HPA -->|CPU > 70%| SCALE_UP{Calcular replicas\nreq = ceil pods * actual/target}
    SCALE_UP -->|Agregar pods| DEP[Deployment\nbackend/frontend]

    HPA -->|CPU < 70%\n5 min estable| SCALE_DOWN{Scale down\n1 pod cada 2 min}
    SCALE_DOWN -->|Remover pods| DEP

    DEP --> POD1[Pod 1]
    DEP --> POD2[Pod 2]
    DEP --> POD3[Pod 3 - nuevo]
    DEP --> PODN[Pod N - max 10]

    style SCALE_UP fill:#ff9900,color:#000
    style SCALE_DOWN fill:#3f8624,color:#fff
```

---

## 7. Arquitectura de Recuperacion ante Desastres

```mermaid
graph TB
    subgraph NORMAL["Operacion Normal"]
        PROD["EKS govtech-prod\nus-east-1"]
        RDS_MAIN["RDS Primary\nus-east-1a"]
        RDS_STANDBY["RDS Standby\nus-east-1b"]
        S3_BACKUP["S3 Backups\n(retencion 30 dias)"]

        RDS_MAIN -->|"Replicacion sincrona\n(Multi-AZ)"| RDS_STANDBY
        PROD -->|"pg_dump diario\n2am UTC"| S3_BACKUP
    end

    subgraph FALLA["Falla de AZ (Automatico ~2min)"]
        AZ_FAIL[/"AZ us-east-1a\nFALLA"/]
        FAILOVER["AWS RDS Failover\nAutomatico"]
        RDS_NOW["RDS (ahora primary)\nus-east-1b"]

        AZ_FAIL -->|"Detectado por AWS"| FAILOVER
        FAILOVER --> RDS_NOW
    end

    subgraph DESASTRE["Falla de Region (Manual ~4h)"]
        REGION_FAIL[/"Region us-east-1\nFALLA"/]
        TF_RESTORE["terraform apply\nen us-east-2"]
        S3_CROSS["S3 Cross-Region\nReplication"]
        RDS_RESTORE["RDS Restore\ndesde snapshot"]
        PROD_NEW["EKS govtech-prod\nus-east-2"]

        REGION_FAIL --> TF_RESTORE
        S3_BACKUP -->|"Replicacion CRR"| S3_CROSS
        S3_CROSS --> RDS_RESTORE
        TF_RESTORE --> PROD_NEW
        RDS_RESTORE --> PROD_NEW
    end
```

---

## 8. Stack de Monitoring

```mermaid
graph LR
    subgraph APPS["Aplicacion (namespace: govtech)"]
        BACKEND[backend pods\n/metrics endpoint]
        POSTGRES_POD[postgres pod]
        NODE_EXP[node-exporter\nen cada nodo]
    end

    subgraph MONITORING["Stack de Monitoring (namespace: monitoring)"]
        PROM[Prometheus\n30s scrape interval]
        ALERT[Alertmanager]
        GRAFANA[Grafana\nDashboards]
        KSM[kube-state-metrics]
    end

    subgraph AWS_MONITORING["AWS Monitoring"]
        CW[CloudWatch\nContainer Insights]
        CT[CloudTrail\nAuditoria API]
        CW_ALARMS[CloudWatch Alarms\nSeguridad]
    end

    BACKEND -->|scrape /metrics| PROM
    NODE_EXP -->|CPU, memoria, disco| PROM
    KSM -->|estado de pods/deployments| PROM
    PROM -->|evaluar reglas| ALERT
    ALERT -->|notificacion| SLACK[Slack\nPagerDuty]
    PROM -->|datasource| GRAFANA
    APPS -->|logs stdout| CW
    CT -->|API calls| CW_ALARMS
    CW_ALARMS -->|breach detections| SLACK
```
