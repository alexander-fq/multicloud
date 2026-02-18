# Diagramas de Arquitectura - GovTech Cloud Migration Platform

---

## 1. Arquitectura General (Vista de Alto Nivel)

```mermaid
graph TB
    subgraph Internet
        USER[Ciudadano / Navegador]
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

## 2. Arquitectura de Red (VPC)

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

## 3. Pipeline CI/CD

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

## 4. Flujo de Autoscaling (HPA)

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

## 5. Arquitectura de Recuperacion ante Desastres

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

## 6. Stack de Monitoring

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
