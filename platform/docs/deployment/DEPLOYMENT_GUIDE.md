# Guia de Despliegue - GovTech Cloud Migration Platform

## Pre-requisitos

| Herramienta | Version | Instalacion |
|---|---|---|
| AWS CLI | >= 2.x | `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"` |
| Terraform | >= 1.5.0 | `https://developer.hashicorp.com/terraform/downloads` |
| kubectl | >= 1.28 | `https://kubernetes.io/docs/tasks/tools/` |
| Helm | >= 3.x | `https://helm.sh/docs/intro/install/` |
| Docker | >= 24.x | `https://docs.docker.com/get-docker/` |

Configurar AWS CLI:
```bash
aws configure
# AWS Access Key ID: <tu-key>
# AWS Secret Access Key: <tu-secret>
# Default region: us-east-1
# Default output format: json
```

## Paso 1: Infraestructura con Terraform

```bash
cd terraform/environments/dev

# Inicializar (descarga providers, configura backend S3)
terraform init

# Ver que va a crear
terraform plan

# Crear la infraestructura (tarda ~15-20 minutos para EKS)
export TF_VAR_db_password="tu-password-seguro"
terraform apply

# Ver outputs importantes
terraform output
```

Los recursos que se crean:
- VPC con subnets publicas y privadas
- EKS Cluster con Node Group
- RDS PostgreSQL (solo accesible dentro del cluster)
- S3 Bucket para archivos de la aplicacion
- IAM Roles y OIDC Provider

## Paso 2: Configurar kubectl

```bash
# Conectar kubectl al cluster EKS recien creado
aws eks update-kubeconfig --name govtech-dev --region us-east-1

# Verificar conexion
kubectl get nodes
kubectl get namespaces
```

## Paso 3: Instalar componentes del cluster

### AWS Load Balancer Controller (para Ingress ALB)
```bash
# Crear IAM Service Account para el controller
eksctl create iamserviceaccount \
  --cluster=govtech-dev \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name "AmazonEKSLoadBalancerControllerRole" \
  --attach-policy-arn=arn:aws:iam::835960996869:policy/GovTech-ALB-Controller \
  --approve

# Instalar el controller via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=govtech-dev \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Metrics Server (para HPA)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl get deployment metrics-server -n kube-system
```

### Prometheus + Grafana (Monitoring)
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  -f monitoring/prometheus/prometheus.yaml \
  --namespace monitoring \
  --create-namespace

# Verificar instalacion
kubectl get pods -n monitoring
```

### CloudWatch Container Insights
```bash
# Configurar la variable de entorno y ejecutar el script
export CLUSTER_NAME=govtech-dev
export AWS_REGION=us-east-1
chmod +x monitoring/cloudwatch/setup.sh
./monitoring/cloudwatch/setup.sh
```

## Paso 4: Desplegar la Aplicacion

### Crear Secrets de Kubernetes
```bash
# Los secrets NO se commitean en git - se crean manualmente
kubectl create secret generic govtech-secrets \
  --from-literal=DB_PASSWORD=<password-de-rds> \
  --from-literal=DB_USER=govtech_admin \
  --from-literal=DB_NAME=govtech \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  -n govtech

# Verificar que se creo
kubectl get secret govtech-secrets -n govtech
```

### Ejecutar el script de despliegue
```bash
chmod +x kubernetes/deploy.sh
./kubernetes/deploy.sh dev
```

O aplicar manualmente:
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/pvc.yaml
kubectl apply -f kubernetes/database/
kubectl wait --for=condition=ready pod -l app=postgres -n govtech --timeout=300s
kubectl apply -f kubernetes/backend/
kubectl rollout status deployment/backend -n govtech
kubectl apply -f kubernetes/frontend/
kubectl rollout status deployment/frontend -n govtech
kubectl apply -f kubernetes/ingress/ingress-aws.yaml
```

## Paso 5: Verificar Despliegue

```bash
# Estado de todos los pods
kubectl get pods -n govtech

# Ver el ingress y su URL (puede tardar 2-3 minutos en aparecer)
kubectl get ingress govtech-ingress -n govtech

# Obtener la URL del ALB
ALB_URL=$(kubectl get ingress govtech-ingress -n govtech -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "URL: http://$ALB_URL"

# Probar endpoints
curl http://$ALB_URL/api/health
curl http://$ALB_URL/api/health/database
curl http://$ALB_URL/api/health/cloud
```

## Paso 6: Acceder a los Dashboards

### Grafana
```bash
# Port-forward al servicio de Grafana
kubectl port-forward service/prometheus-grafana 3000:80 -n monitoring
# Abrir: http://localhost:3000 (usuario: admin, password: configurado en helm values)
```

### Prometheus
```bash
kubectl port-forward service/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
# Abrir: http://localhost:9090
```

## Flujo de Actualizaciones

Cuando hay cambios en el codigo:

1. Push a rama `staging` → GitHub Actions ejecuta CI (build, test, push a ECR)
2. GitHub Actions ejecuta CD automaticamente (deploy a dev)
3. Si todo funciona, el lider hace el deploy manual a prod via `workflow_dispatch`

## Costos Estimados

### Dev
- EKS Control Plane: $73/mes
- EC2 Nodes (2x t3.medium): ~$60/mes
- RDS db.t3.micro: ~$15/mes
- NAT Gateway: ~$32/mes
- **Total: ~$180/mes**

### Prod
- EKS Control Plane: $73/mes
- EC2 Nodes (3x t3.medium): ~$90/mes
- RDS db.t3.small Multi-AZ: ~$60/mes
- NAT Gateway (3x): ~$96/mes
- ALB: ~$16/mes
- **Total: ~$335/mes**

Destruir el ambiente cuando no se use:
```bash
cd terraform/environments/dev
terraform destroy
```
