# División de Trabajo - Infraestructura Multi-Cloud

**Proyecto**: GovTech Cloud Migration Platform
**Duración**: 4 semanas por colaborador
**Enfoque**: AWS primero, multi-cloud después (si hay tiempo)
**Objetivo**: Construir toda la infraestructura necesaria para desplegar la aplicación web en AWS

---

## COLABORADOR A: Docker + Terraform
**Responsabilidad**: Containerización e Infraestructura como Código

### Semana 1: Containerización con Docker

**Objetivos**:
- Dockerizar backend (Node.js/Express)
- Dockerizar frontend (React/Vite)
- Crear orquestación local con docker-compose
- Configurar Container Registry (AWS ECR)

**Tareas**:
1. Crear `app/backend/Dockerfile`
   - Multi-stage build para optimización
   - Stage 1: Compilación (node:20-alpine)
   - Stage 2: Producción (solo dependencias necesarias)
   - Incluir health check
   - Exponer puerto 3000

2. Crear `app/frontend/Dockerfile`
   - Stage 1: Build con Node (npm run build)
   - Stage 2: Servir con nginx:alpine
   - Configurar nginx para React Router
   - Exponer puerto 80

3. Crear `docker-compose.yml` (raíz del proyecto)
   - Servicio: backend (puerto 3000)
   - Servicio: frontend (puerto 5173)
   - Servicio: postgres (puerto 5432)
   - Red compartida
   - Volúmenes para persistencia

4. Crear archivos `.dockerignore`
   - Backend: node_modules, .env, tests
   - Frontend: node_modules, dist, .env

5. Probar build y push a ECR
   - `docker build -t govtech-backend:latest app/backend`
   - `docker build -t govtech-frontend:latest app/frontend`
   - `docker-compose up -d`
   - Tag y push a AWS ECR

**Entregables**:
- `app/backend/Dockerfile`
- `app/frontend/Dockerfile`
- `docker-compose.yml`
- `app/backend/.dockerignore`
- `app/frontend/.dockerignore`
- Imágenes en ECR funcionando

---

### Semana 2: Terraform - Networking & Compute

**Objetivos**:
- Crear módulo de networking (VPC, subnets, gateways)
- Crear módulo de Kubernetes cluster (EKS)

**Tareas**:
1. Estructura base de Terraform
   ```
   terraform/
   ├── main.tf
   ├── variables.tf
   ├── outputs.tf
   ├── terraform.tfvars.example
   └── modules/
   ```

2. Módulo `terraform/modules/networking/`
   - Archivo: `aws.tf`
     - VPC (CIDR: 10.0.0.0/16)
     - 3 subnets públicas (AZs diferentes)
     - 3 subnets privadas (AZs diferentes)
     - Internet Gateway
     - NAT Gateway (1 por AZ)
     - Route Tables
     - Security Groups base
   - Archivo: `variables.tf`
     - vpc_cidr, environment, region, availability_zones
   - Archivo: `outputs.tf`
     - vpc_id, public_subnet_ids, private_subnet_ids, security_group_ids

3. Módulo `terraform/modules/kubernetes-cluster/`
   - Archivo: `aws.tf`
     - EKS Cluster (versión 1.28+)
     - Node Groups (t3.medium, min 2, max 6)
     - IAM Roles (cluster, node)
     - Security Groups para EKS
     - OIDC Provider
   - Archivo: `variables.tf`
     - cluster_name, node_instance_type, min_size, max_size, vpc_id, subnet_ids
   - Archivo: `outputs.tf`
     - cluster_endpoint, cluster_ca_certificate, cluster_name

**Entregables**:
- `terraform/modules/networking/` (completo)
- `terraform/modules/kubernetes-cluster/` (completo)
- README con descripción de variables y outputs

---

### Semana 3: Terraform - Database & Storage

**Objetivos**:
- Crear módulo de base de datos (RDS PostgreSQL)
- Crear módulo de almacenamiento (S3)

**Tareas**:
1. Módulo `terraform/modules/database/`
   - Archivo: `aws.tf`
     - RDS PostgreSQL (versión 15)
     - DB Instance (db.t3.micro para dev, escalable)
     - Subnet Group (subnets privadas)
     - Security Group (puerto 5432, solo desde EKS)
     - Automated Backups (7 días)
     - Multi-AZ (solo prod)
   - Archivo: `variables.tf`
     - db_name, db_username, db_password, instance_class, allocated_storage, environment
   - Archivo: `outputs.tf`
     - db_endpoint, db_name, db_port

2. Módulo `terraform/modules/storage/`
   - Archivo: `aws.tf`
     - S3 Bucket (documentos)
     - Versionado habilitado
     - Encryption (AES-256)
     - Lifecycle policy (borrar versiones >90 días)
     - Bucket policy (acceso solo desde EKS)
     - CORS configuration
   - Archivo: `variables.tf`
     - bucket_name, environment, enable_versioning
   - Archivo: `outputs.tf`
     - bucket_name, bucket_arn, bucket_domain

**Entregables**:
- `terraform/modules/database/` (completo)
- `terraform/modules/storage/` (completo)
- README con descripción de variables y outputs

---

### Semana 4: Terraform - Environments & Documentation

**Objetivos**:
- Integrar todos los módulos en ambientes (dev, staging, prod)
- Documentar uso completo de Terraform

**Tareas**:
1. Crear `terraform/environments/dev/main.tf`
   ```hcl
   module "networking" {
     source = "../../modules/networking"
     environment = "dev"
     region = "us-east-1"
   }

   module "eks" {
     source = "../../modules/kubernetes-cluster"
     cluster_name = "govtech-dev"
     vpc_id = module.networking.vpc_id
     subnet_ids = module.networking.private_subnet_ids
   }

   module "database" {
     source = "../../modules/database"
     environment = "dev"
     instance_class = "db.t3.micro"
   }

   module "storage" {
     source = "../../modules/storage"
     environment = "dev"
   }
   ```

2. Crear `terraform/environments/staging/main.tf` (similar)
3. Crear `terraform/environments/prod/main.tf` (instancias más grandes)

4. Crear `terraform/terraform.tfvars.example`
   ```hcl
   aws_region = "us-east-1"
   environment = "dev"
   vpc_cidr = "10.0.0.0/16"
   db_username = "govtech_admin"
   db_password = "CHANGE_ME"
   ```

5. Crear `terraform/README.md`
   - Requisitos previos (Terraform 1.5+, AWS CLI)
   - Configuración inicial
   - Comandos básicos:
     - `terraform init`
     - `terraform plan`
     - `terraform apply`
     - `terraform destroy`
   - Variables importantes
   - Outputs esperados
   - Troubleshooting común

**Entregables**:
- `terraform/environments/dev/` (completo)
- `terraform/environments/staging/` (completo)
- `terraform/environments/prod/` (completo)
- `terraform/terraform.tfvars.example`
- `terraform/README.md` (documentación completa)

---

## COLABORADOR B: Kubernetes + Deployment
**Responsabilidad**: Orquestación de contenedores y despliegue

### Semana 1: Manifiestos Base de Kubernetes

**Objetivos**:
- Crear manifiestos base (namespace, configmap, secrets)
- Configurar persistent volumes

**Tareas**:
1. Crear `kubernetes/namespace.yaml`
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: govtech
     labels:
       name: govtech
       environment: production
   ```

2. Crear `kubernetes/configmap.yaml`
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: govtech-config
     namespace: govtech
   data:
     NODE_ENV: "production"
     PORT: "3000"
     HOST: "0.0.0.0"
     CLOUD_PROVIDER: "aws"
     AWS_REGION: "us-east-1"
   ```

3. Crear `kubernetes/secrets.yaml.template`
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: govtech-secrets
     namespace: govtech
   type: Opaque
   stringData:
     DATABASE_URL: "postgresql://user:password@host:5432/dbname"
     AWS_ACCESS_KEY_ID: "CHANGE_ME"
     AWS_SECRET_ACCESS_KEY: "CHANGE_ME"
     JWT_SECRET: "CHANGE_ME"
   ```
   - IMPORTANTE: Este es un template, NO commitear con valores reales

4. Crear `kubernetes/pvc.yaml`
   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: postgres-pvc
     namespace: govtech
   spec:
     accessModes:
       - ReadWriteOnce
     resources:
       requests:
         storage: 10Gi
     storageClassName: gp2
   ```

5. Probar en minikube local
   - `kubectl apply -f kubernetes/namespace.yaml`
   - `kubectl apply -f kubernetes/configmap.yaml`
   - Verificar: `kubectl get configmap -n govtech`

**Entregables**:
- `kubernetes/namespace.yaml`
- `kubernetes/configmap.yaml`
- `kubernetes/secrets.yaml.template`
- `kubernetes/pvc.yaml`
- Validación en minikube exitosa

---

### Semana 2: Deployments de Aplicación

**Objetivos**:
- Desplegar backend en Kubernetes
- Desplegar frontend en Kubernetes
- Crear servicios para comunicación interna

**Tareas**:
1. Crear `kubernetes/backend/deployment.yaml`
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: backend
     namespace: govtech
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: backend
     template:
       metadata:
         labels:
           app: backend
       spec:
         containers:
         - name: backend
           image: <ECR_REPO>/govtech-backend:latest
           ports:
           - containerPort: 3000
           envFrom:
           - configMapRef:
               name: govtech-config
           - secretRef:
               name: govtech-secrets
           livenessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 10
             periodSeconds: 5
           resources:
             requests:
               memory: "256Mi"
               cpu: "250m"
             limits:
               memory: "512Mi"
               cpu: "500m"
   ```

2. Crear `kubernetes/backend/service.yaml`
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: backend-service
     namespace: govtech
   spec:
     type: ClusterIP
     selector:
       app: backend
     ports:
     - port: 80
       targetPort: 3000
       protocol: TCP
   ```

3. Crear `kubernetes/frontend/deployment.yaml` (similar estructura)
   - Usar imagen de ECR frontend
   - Puerto 80
   - 3 replicas
   - Health checks en /
   - Resources: memory 128Mi, cpu 100m

4. Crear `kubernetes/frontend/service.yaml`
   - ClusterIP
   - Puerto 80

**Entregables**:
- `kubernetes/backend/deployment.yaml`
- `kubernetes/backend/service.yaml`
- `kubernetes/frontend/deployment.yaml`
- `kubernetes/frontend/service.yaml`
- Pods corriendo correctamente en minikube

---

### Semana 3: Database & Scaling

**Objetivos**:
- Desplegar PostgreSQL en Kubernetes (opcional, para dev)
- Configurar auto-scaling horizontal

**Tareas**:
1. Crear `kubernetes/database/statefulset.yaml`
   ```yaml
   apiVersion: apps/v1
   kind: StatefulSet
   metadata:
     name: postgres
     namespace: govtech
   spec:
     serviceName: postgres-service
     replicas: 1
     selector:
       matchLabels:
         app: postgres
     template:
       metadata:
         labels:
           app: postgres
       spec:
         containers:
         - name: postgres
           image: postgres:15-alpine
           ports:
           - containerPort: 5432
           env:
           - name: POSTGRES_DB
             value: govtech_dev
           - name: POSTGRES_USER
             value: postgres
           - name: POSTGRES_PASSWORD
             valueFrom:
               secretKeyRef:
                 name: govtech-secrets
                 key: DB_PASSWORD
           volumeMounts:
           - name: postgres-storage
             mountPath: /var/lib/postgresql/data
     volumeClaimTemplates:
     - metadata:
         name: postgres-storage
       spec:
         accessModes: ["ReadWriteOnce"]
         resources:
           requests:
             storage: 10Gi
   ```

2. Crear `kubernetes/database/service.yaml`
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: postgres-service
     namespace: govtech
   spec:
     type: ClusterIP
     clusterIP: None
     selector:
       app: postgres
     ports:
     - port: 5432
       targetPort: 5432
   ```

3. Crear `kubernetes/backend/hpa.yaml`
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: backend-hpa
     namespace: govtech
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: backend
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
     - type: Resource
       resource:
         name: memory
         target:
           type: Utilization
           averageUtilization: 80
   ```

4. Crear `kubernetes/frontend/hpa.yaml` (similar)
   - minReplicas: 2
   - maxReplicas: 6
   - CPU: 60%, Memory: 70%

**Entregables**:
- `kubernetes/database/statefulset.yaml`
- `kubernetes/database/service.yaml`
- `kubernetes/backend/hpa.yaml`
- `kubernetes/frontend/hpa.yaml`
- Auto-scaling probado con carga simulada

---

### Semana 4: Ingress & Testing

**Objetivos**:
- Configurar ingress para exponer la aplicación
- Crear scripts de despliegue
- Probar despliegue completo en EKS

**Tareas**:
1. Crear `kubernetes/ingress/ingress-aws.yaml`
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: govtech-ingress
     namespace: govtech
     annotations:
       kubernetes.io/ingress.class: alb
       alb.ingress.kubernetes.io/scheme: internet-facing
       alb.ingress.kubernetes.io/target-type: ip
       alb.ingress.kubernetes.io/certificate-arn: <ACM_CERTIFICATE_ARN>
       alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
       alb.ingress.kubernetes.io/ssl-redirect: '443'
   spec:
     rules:
     - host: govtech.example.com
       http:
         paths:
         - path: /api
           pathType: Prefix
           backend:
             service:
               name: backend-service
               port:
                 number: 80
         - path: /
           pathType: Prefix
           backend:
             service:
               name: frontend-service
               port:
                 number: 80
   ```

2. Crear `kubernetes/ingress/ingress-nginx.yaml` (alternativa genérica)
   - Para clusters sin AWS Load Balancer Controller
   - Usa NGINX Ingress Controller

3. Crear `kubernetes/deploy.sh`
   ```bash
   #!/bin/bash
   # Script para desplegar en orden correcto

   echo "Aplicando namespace..."
   kubectl apply -f namespace.yaml

   echo "Aplicando configmap y secrets..."
   kubectl apply -f configmap.yaml
   kubectl apply -f secrets.yaml

   echo "Aplicando PVC..."
   kubectl apply -f pvc.yaml

   echo "Desplegando database..."
   kubectl apply -f database/

   echo "Esperando a que database esté listo..."
   kubectl wait --for=condition=ready pod -l app=postgres -n govtech --timeout=300s

   echo "Desplegando backend..."
   kubectl apply -f backend/

   echo "Desplegando frontend..."
   kubectl apply -f frontend/

   echo "Aplicando ingress..."
   kubectl apply -f ingress/ingress-aws.yaml

   echo "Despliegue completo!"
   kubectl get pods -n govtech
   ```

4. Probar en EKS (usar cluster creado por Colaborador A)
   - Conectar a EKS: `aws eks update-kubeconfig --name govtech-dev`
   - Ejecutar `./kubernetes/deploy.sh`
   - Verificar pods: `kubectl get pods -n govtech`
   - Verificar ingress: `kubectl get ingress -n govtech`
   - Probar endpoints públicos

5. Crear `kubernetes/README.md`
   - Requisitos (kubectl, aws-cli)
   - Orden de aplicación de manifiestos
   - Comandos útiles
   - Troubleshooting
   - Cómo conectarse a EKS

**Entregables**:
- `kubernetes/ingress/ingress-aws.yaml`
- `kubernetes/ingress/ingress-nginx.yaml`
- `kubernetes/deploy.sh` (con permisos de ejecución)
- `kubernetes/README.md`
- Despliegue completo funcionando en EKS
- URL pública accesible

---

## COLABORADOR C: CI/CD + Monitoring
**Responsabilidad**: Automatización y Observabilidad

### Semana 1: CI Pipeline (GitHub Actions)

**Objetivos**:
- Automatizar build, test y push de imágenes Docker
- Implementar security scanning

**Tareas**:
1. Crear `.github/workflows/backend-ci.yml`
   ```yaml
   name: Backend CI

   on:
     push:
       branches: [main, develop]
       paths:
         - 'app/backend/**'
     pull_request:
       branches: [main]
       paths:
         - 'app/backend/**'

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '20'

         - name: Install dependencies
           working-directory: ./app/backend
           run: npm ci

         - name: Run linter
           working-directory: ./app/backend
           run: npm run lint

         - name: Run security audit
           working-directory: ./app/backend
           run: npm audit --audit-level=high

         - name: Run tests
           working-directory: ./app/backend
           run: npm test

     build:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Configure AWS credentials
           uses: aws-actions/configure-aws-credentials@v2
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: us-east-1

         - name: Login to Amazon ECR
           id: login-ecr
           uses: aws-actions/amazon-ecr-login@v1

         - name: Build, tag, and push image
           working-directory: ./app/backend
           env:
             ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
             ECR_REPOSITORY: govtech-backend
             IMAGE_TAG: ${{ github.sha }}
           run: |
             docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
             docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
             docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
             docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
   ```

2. Crear `.github/workflows/frontend-ci.yml` (estructura similar)
   - Lint con ESLint
   - Build con Vite
   - Security audit
   - Docker build y push a ECR

3. Configurar GitHub Secrets necesarios
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - Documentar en `.github/workflows/README.md`

**Entregables**:
- `.github/workflows/backend-ci.yml`
- `.github/workflows/frontend-ci.yml`
- `.github/workflows/README.md` (secrets necesarios)
- Pipelines funcionando en cada push

---

### Semana 2: CD Pipeline (Deployment Automation)

**Objetivos**:
- Automatizar deployment a dev
- Configurar deployment a prod con aprobación manual
- Implementar estrategia blue-green

**Tareas**:
1. Crear `.github/workflows/deploy-dev.yml`
   ```yaml
   name: Deploy to Dev

   on:
     push:
       branches: [develop]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Configure AWS credentials
           uses: aws-actions/configure-aws-credentials@v2
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: us-east-1

         - name: Setup Terraform
           uses: hashicorp/setup-terraform@v2

         - name: Terraform Init
           working-directory: ./terraform/environments/dev
           run: terraform init

         - name: Terraform Apply
           working-directory: ./terraform/environments/dev
           run: terraform apply -auto-approve

         - name: Update kubeconfig
           run: aws eks update-kubeconfig --name govtech-dev --region us-east-1

         - name: Deploy to Kubernetes
           run: |
             kubectl apply -f kubernetes/namespace.yaml
             kubectl apply -f kubernetes/configmap.yaml
             kubectl apply -f kubernetes/secrets.yaml
             kubectl apply -f kubernetes/backend/
             kubectl apply -f kubernetes/frontend/
             kubectl apply -f kubernetes/ingress/ingress-aws.yaml

         - name: Wait for rollout
           run: |
             kubectl rollout status deployment/backend -n govtech
             kubectl rollout status deployment/frontend -n govtech

         - name: Run smoke tests
           run: |
             BACKEND_URL=$(kubectl get ingress govtech-ingress -n govtech -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
             curl -f http://$BACKEND_URL/api/health || exit 1
   ```

2. Crear `.github/workflows/deploy-prod.yml`
   - Trigger: manual (workflow_dispatch)
   - Environment: production (requiere approval)
   - Blue-Green deployment:
     ```yaml
     - name: Deploy new version (green)
       run: kubectl apply -f kubernetes/backend/deployment-green.yaml

     - name: Wait for green to be ready
       run: kubectl wait --for=condition=ready pod -l app=backend-green

     - name: Run health checks on green
       run: |
         # Probar que green funciona

     - name: Switch traffic to green
       run: kubectl patch service backend-service -p '{"spec":{"selector":{"version":"green"}}}'

     - name: Scale down blue
       run: kubectl scale deployment backend --replicas=0
     ```

3. Crear `kubernetes/backend/deployment-green.yaml` (para blue-green)
4. Crear `kubernetes/frontend/deployment-green.yaml`

**Entregables**:
- `.github/workflows/deploy-dev.yml`
- `.github/workflows/deploy-prod.yml`
- `kubernetes/backend/deployment-green.yaml`
- `kubernetes/frontend/deployment-green.yaml`
- Deployment automático a dev funcionando
- Deployment a prod con aprobación manual

---

### Semana 3: Monitoring & Observability

**Objetivos**:
- Configurar CloudWatch para EKS
- Instalar Prometheus en cluster
- Crear dashboards en Grafana

**Tareas**:
1. Configurar CloudWatch Container Insights
   ```bash
   # Script para instalar CloudWatch agent en EKS
   kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml
   ```
   - Crear `monitoring/cloudwatch/setup.sh`
   - Configurar log groups
   - Configurar métricas

2. Instalar Prometheus en Kubernetes
   - Crear `monitoring/prometheus/prometheus.yaml`
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: prometheus-config
     namespace: monitoring
   data:
     prometheus.yml: |
       global:
         scrape_interval: 15s
       scrape_configs:
         - job_name: 'kubernetes-pods'
           kubernetes_sd_configs:
             - role: pod
           relabel_configs:
             - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
               action: keep
               regex: true
   ```
   - Crear Deployment de Prometheus
   - Crear Service para Prometheus

3. Crear ServiceMonitor para backend
   - `monitoring/prometheus/backend-servicemonitor.yaml`
   ```yaml
   apiVersion: monitoring.coreos.com/v1
   kind: ServiceMonitor
   metadata:
     name: backend-monitor
     namespace: govtech
   spec:
     selector:
       matchLabels:
         app: backend
     endpoints:
       - port: http
         path: /metrics
         interval: 30s
   ```

4. Configurar alertas
   - `monitoring/prometheus/alerts.yaml`
   ```yaml
   groups:
     - name: backend-alerts
       rules:
         - alert: HighErrorRate
           expr: rate(http_requests_total{status="500"}[5m]) > 0.05
           for: 5m
           annotations:
             summary: "High error rate detected"
         - alert: HighMemoryUsage
           expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
           for: 5m
   ```

5. Instalar Grafana
   - `monitoring/grafana/deployment.yaml`
   - Configurar data source (Prometheus)
   - Crear dashboards:

6. Crear `monitoring/grafana/dashboards/system-dashboard.json`
   - Métricas de CPU/Memory por pod
   - Request rate
   - Error rate
   - Response time

7. Crear `monitoring/grafana/dashboards/application-dashboard.json`
   - API endpoints más usados
   - Database connections
   - Storage operations
   - Cache hit rate

**Entregables**:
- `monitoring/cloudwatch/setup.sh`
- `monitoring/prometheus/prometheus.yaml`
- `monitoring/prometheus/backend-servicemonitor.yaml`
- `monitoring/prometheus/alerts.yaml`
- `monitoring/grafana/deployment.yaml`
- `monitoring/grafana/dashboards/system-dashboard.json`
- `monitoring/grafana/dashboards/application-dashboard.json`
- Dashboards funcionando con datos reales

---

### Semana 4: Integration & Documentation

**Objetivos**:
- Crear documentación completa de deployment
- Documentar procedimientos de rollback
- Realizar pruebas end-to-end
- Crear overview de infraestructura

**Tareas**:
1. Crear `docs/deployment/DEPLOYMENT_GUIDE.md`
   ```markdown
   # Guía de Despliegue

   ## Requisitos Previos
   - AWS CLI configurado
   - kubectl instalado
   - Terraform instalado
   - Acceso a GitHub repository

   ## Paso 1: Provisionar Infraestructura
   cd terraform/environments/dev
   terraform init
   terraform plan
   terraform apply

   ## Paso 2: Configurar kubectl
   aws eks update-kubeconfig --name govtech-dev --region us-east-1

   ## Paso 3: Desplegar Aplicación
   cd kubernetes/
   ./deploy.sh

   ## Paso 4: Verificar Despliegue
   kubectl get pods -n govtech
   kubectl get ingress -n govtech

   ## Paso 5: Probar Endpoints
   curl https://govtech.example.com/api/health

   ## Troubleshooting
   - Si pods no inician: kubectl logs <pod-name> -n govtech
   - Si ingress no funciona: kubectl describe ingress -n govtech
   ```

2. Crear `docs/deployment/ROLLBACK_GUIDE.md`
   ```markdown
   # Guía de Rollback

   ## Rollback Rápido (5 minutos)

   ### Opción 1: Rollback de Kubernetes
   kubectl rollout undo deployment/backend -n govtech
   kubectl rollout undo deployment/frontend -n govtech

   ### Opción 2: Blue-Green Switch
   kubectl patch service backend-service -p '{"spec":{"selector":{"version":"blue"}}}'

   ### Opción 3: Terraform Rollback
   cd terraform/environments/prod
   terraform plan -destroy
   terraform apply -auto-approve

   ## Recovery Procedures

   ### Database Recovery
   1. Restore from RDS snapshot
   2. Update DATABASE_URL secret
   3. Restart backend pods

   ### Complete Disaster Recovery
   1. Restore Terraform state from S3
   2. Re-apply infrastructure
   3. Restore database from backup
   4. Re-deploy application
   ```

3. Crear `INFRASTRUCTURE.md` en raíz del proyecto
   ```markdown
   # Infraestructura Multi-Cloud

   ## Overview
   Este proyecto usa infraestructura como código (Terraform) y orquestación con Kubernetes para despliegue multi-cloud.

   ## Componentes

   ### Docker
   - Backend: Node.js 20 Alpine
   - Frontend: Nginx Alpine
   - Database: PostgreSQL 15

   ### Terraform Modules
   - Networking: VPC, subnets, gateways
   - Kubernetes: EKS cluster
   - Database: RDS PostgreSQL
   - Storage: S3 buckets

   ### Kubernetes Resources
   - Deployments: backend, frontend, database
   - Services: ClusterIP para comunicación interna
   - Ingress: AWS ALB para tráfico externo
   - HPA: Auto-scaling basado en CPU/Memory

   ### CI/CD
   - GitHub Actions para build y test
   - Deployment automático a dev
   - Deployment manual a prod (con aprobación)

   ### Monitoring
   - CloudWatch Container Insights
   - Prometheus para métricas
   - Grafana para visualización

   ## Ambientes

   | Ambiente | URL | Resources | Auto-scaling |
   |----------|-----|-----------|--------------|
   | Dev | dev.govtech.com | t3.micro | 2-6 pods |
   | Staging | staging.govtech.com | t3.small | 2-8 pods |
   | Prod | govtech.com | t3.medium | 3-10 pods |

   ## Costos Estimados (AWS)

   ### Dev
   - EKS: $73/mes
   - EC2 Nodes: $30/mes (2x t3.micro)
   - RDS: $15/mes (db.t3.micro)
   - ALB: $16/mes
   - Total: ~$134/mes

   ### Prod
   - EKS: $73/mes
   - EC2 Nodes: $150/mes (3x t3.medium)
   - RDS: $60/mes (db.t3.small multi-AZ)
   - ALB: $16/mes
   - Total: ~$299/mes
   ```

4. Crear pruebas end-to-end
   - Script `tests/e2e/test-deployment.sh`
   ```bash
   #!/bin/bash
   # Test end-to-end de deployment

   echo "Testing health endpoints..."
   curl -f https://govtech.example.com/api/health || exit 1

   echo "Testing database connectivity..."
   curl -f https://govtech.example.com/api/health/database || exit 1

   echo "Testing cloud provider..."
   curl -f https://govtech.example.com/api/health/cloud || exit 1

   echo "Testing migration API..."
   curl -f https://govtech.example.com/api/migration/providers || exit 1

   echo "All tests passed!"
   ```

5. Integración final
   - Verificar que todos los componentes trabajen juntos
   - Documentar cualquier issue encontrado
   - Crear checklist de deployment

**Entregables**:
- `docs/deployment/DEPLOYMENT_GUIDE.md`
- `docs/deployment/ROLLBACK_GUIDE.md`
- `INFRASTRUCTURE.md`
- `tests/e2e/test-deployment.sh`
- Checklist de deployment
- Sistema completo validado end-to-end

---

## OUTPUTS FINALES (Después de 4 semanas)

### Estructura de Archivos Creada

```
aws_cloud/
├── app/
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   └── frontend/
│       ├── Dockerfile
│       └── .dockerignore
│
├── docker-compose.yml
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars.example
│   ├── README.md
│   ├── modules/
│   │   ├── networking/
│   │   │   ├── aws.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── kubernetes-cluster/
│   │   │   ├── aws.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── database/
│   │   │   ├── aws.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── storage/
│   │       ├── aws.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   └── environments/
│       ├── dev/
│       │   └── main.tf
│       ├── staging/
│       │   └── main.tf
│       └── prod/
│           └── main.tf
│
├── kubernetes/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml.template
│   ├── pvc.yaml
│   ├── deploy.sh
│   ├── README.md
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── deployment-green.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── deployment-green.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── database/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   └── ingress/
│       ├── ingress-aws.yaml
│       └── ingress-nginx.yaml
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       ├── deploy-dev.yml
│       ├── deploy-prod.yml
│       └── README.md
│
├── monitoring/
│   ├── cloudwatch/
│   │   └── setup.sh
│   ├── prometheus/
│   │   ├── prometheus.yaml
│   │   ├── backend-servicemonitor.yaml
│   │   └── alerts.yaml
│   └── grafana/
│       ├── deployment.yaml
│       └── dashboards/
│           ├── system-dashboard.json
│           └── application-dashboard.json
│
├── tests/
│   └── e2e/
│       └── test-deployment.sh
│
├── docs/
│   └── deployment/
│       ├── DEPLOYMENT_GUIDE.md
│       └── ROLLBACK_GUIDE.md
│
└── INFRASTRUCTURE.md
```

### Capacidades del Sistema

1. **Containerización Completa**
   - Backend dockerizado
   - Frontend dockerizado
   - docker-compose para desarrollo local

2. **Infraestructura como Código**
   - Terraform modules reutilizables
   - 3 ambientes (dev, staging, prod)
   - Networking completo (VPC, subnets, gateways)
   - EKS cluster configurado
   - RDS PostgreSQL
   - S3 storage

3. **Orquestación con Kubernetes**
   - Deployments con health checks
   - Auto-scaling horizontal (HPA)
   - Persistent storage
   - Load balancing con Ingress
   - Blue-green deployment

4. **CI/CD Automatizado**
   - Build y test automático
   - Push a ECR
   - Deployment a dev automático
   - Deployment a prod con aprobación
   - Smoke tests post-deployment

5. **Monitoring Completo**
   - CloudWatch Container Insights
   - Prometheus metrics
   - Grafana dashboards
   - Alertas configuradas

6. **Documentación Completa**
   - Guías de deployment
   - Procedimientos de rollback
   - Troubleshooting
   - Tests end-to-end

### Punto de Integración con Aplicación Web

Una vez completada la infraestructura, la aplicación web puede:

1. **Build local**
   ```bash
   docker-compose up
   ```

2. **Deploy a dev**
   ```bash
   git push origin develop
   # GitHub Actions se encarga del resto
   ```

3. **Deploy a prod**
   ```bash
   # Trigger manual workflow en GitHub
   # Requiere aprobación
   ```

4. **Monitorear**
   - Ver dashboards en Grafana
   - Revisar logs en CloudWatch
   - Ver métricas en Prometheus

---

## COORDINACIÓN ENTRE COLABORADORES

### Dependencias Importantes

1. **Semana 1**
   - Colaborador A debe crear ECR repos primero
   - Colaborador B puede trabajar en paralelo con minikube

2. **Semana 2**
   - Colaborador B necesita URLs de ECR de Colaborador A
   - Colaborador C puede empezar CI/CD en paralelo

3. **Semana 3**
   - Colaborador B necesita EKS cluster de Colaborador A (creado en semana 2)
   - Colaborador C puede configurar monitoring cuando EKS esté listo

4. **Semana 4**
   - Todos colaboran en integración final
   - Colaborador C coordina documentación

### Reuniones Semanales Sugeridas

- **Lunes**: Planning semanal, revisar dependencias
- **Miércoles**: Check-in de progreso, resolver blockers
- **Viernes**: Demo de entregables, preparar siguiente semana

### Repositorio Git

- Colaborador A: branch `feature/terraform`
- Colaborador B: branch `feature/kubernetes`
- Colaborador C: branch `feature/cicd`
- Merge a `develop` al final de cada semana

---

## NOTAS IMPORTANTES

1. **NO commitear secrets reales**
   - Usar `.template` files
   - Secrets reales van en AWS Secrets Manager

2. **Costos de AWS**
   - Apagar recursos de dev cuando no se usen
   - Usar t3.micro para minimizar costos
   - Considerar AWS Free Tier

3. **Testing**
   - Probar primero en minikube local
   - Luego en EKS dev
   - Finalmente en prod

4. **Documentación**
   - Documentar mientras se desarrolla
   - No dejar documentación para el final
   - Incluir ejemplos en cada README

5. **Multi-Cloud**
   - Enfoque inicial: AWS
   - Si sobra tiempo: adaptar para OCI/GCP
   - Mantener portabilidad en mente

---

## CONTACTO Y SOPORTE

Para dudas o coordinación:
- Crear issues en GitHub
- Usar Slack/Discord para comunicación diaria
- Documentar decisiones importantes en `docs/decisions/`

**Éxito en la implementación!**
