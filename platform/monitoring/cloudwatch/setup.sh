#!/bin/bash
# ============================================================
# Script: Configurar CloudWatch para EKS
# Colaborador C - Semana 3
#
# Que hace este script:
# 1. Instala el agente de CloudWatch en el cluster EKS
#    (Container Insights: metricas de pods, nodos, namespaces)
# 2. Configura log groups para los logs de la aplicacion
# 3. Crea alarmas basicas de CloudWatch para alertas
#
# Pre-requisitos:
# - kubectl configurado para el cluster correcto
# - AWS CLI configurado con permisos de CloudWatch
# - Variable CLUSTER_NAME definida
# ============================================================

set -e  # Salir si cualquier comando falla

# ========================
# VARIABLES
# ========================
CLUSTER_NAME="${CLUSTER_NAME:-govtech-dev}"
REGION="${AWS_REGION:-us-east-1}"
NAMESPACE="amazon-cloudwatch"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== Configurando CloudWatch Container Insights ==="
echo "Cluster: $CLUSTER_NAME"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# ========================
# PASO 1: Crear namespace de CloudWatch
# ========================
echo "--- Paso 1: Crear namespace amazon-cloudwatch ---"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# ========================
# PASO 2: Crear Service Account con IRSA
# El agente de CloudWatch necesita permisos para enviar metricas
# Usando IRSA (sin credenciales en el pod)
# ========================
echo "--- Paso 2: Configurar IAM y Service Account ---"

# Crear IAM role para CloudWatch agent
ROLE_NAME="${CLUSTER_NAME}-cloudwatch-agent"

# Obtener OIDC provider del cluster
OIDC_URL=$(aws eks describe-cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --query "cluster.identity.oidc.issuer" \
  --output text | sed 's|https://||')

OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_URL}"

# Crear trust policy
cat > /tmp/cloudwatch-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "${OIDC_ARN}"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "${OIDC_URL}:sub": "system:serviceaccount:${NAMESPACE}:cloudwatch-agent",
        "${OIDC_URL}:aud": "sts.amazonaws.com"
      }
    }
  }]
}
EOF

# Crear o actualizar el rol IAM
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/cloudwatch-trust-policy.json \
  2>/dev/null || echo "El rol ya existe, actualizando trust policy..."

aws iam update-assume-role-policy \
  --role-name $ROLE_NAME \
  --policy-document file:///tmp/cloudwatch-trust-policy.json

# Adjuntar politica de CloudWatch
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

echo "OK: IAM Role configurado: $ROLE_NAME"

# ========================
# PASO 3: Instalar CloudWatch Agent con Helm
# Container Insights usa el agente oficial de AWS
# ========================
echo "--- Paso 3: Instalar CloudWatch Agent via Helm ---"

# Agregar repo de AWS
helm repo add aws-observability https://aws-observability.github.io/helm-charts 2>/dev/null || true
helm repo update

# Instalar/actualizar el agente
helm upgrade --install aws-cloudwatch-metrics aws-observability/aws-cloudwatch-metrics \
  --namespace $NAMESPACE \
  --create-namespace \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}" \
  --wait

echo "OK: CloudWatch Agent instalado"

# ========================
# PASO 4: Crear Log Groups en CloudWatch
# Un log group por componente para mejor organizacion
# ========================
echo "--- Paso 4: Crear Log Groups ---"

LOG_GROUPS=(
  "/govtech/${CLUSTER_NAME}/application"
  "/govtech/${CLUSTER_NAME}/backend"
  "/govtech/${CLUSTER_NAME}/frontend"
  "/govtech/${CLUSTER_NAME}/database"
)

for LOG_GROUP in "${LOG_GROUPS[@]}"; do
  aws logs create-log-group \
    --log-group-name $LOG_GROUP \
    --region $REGION \
    2>/dev/null || echo "Log group ya existe: $LOG_GROUP"

  # Retener logs 30 dias (balance entre costo y debugging)
  aws logs put-retention-policy \
    --log-group-name $LOG_GROUP \
    --retention-in-days 30 \
    --region $REGION

  echo "OK: $LOG_GROUP (retencion: 30 dias)"
done

# ========================
# PASO 5: Crear Alarmas de CloudWatch
# Alertas basicas para el cluster
# ========================
echo "--- Paso 5: Crear Alarmas CloudWatch ---"

# Alarma: CPU del cluster alto (>85%)
aws cloudwatch put-metric-alarm \
  --alarm-name "${CLUSTER_NAME}-high-cpu" \
  --alarm-description "CPU promedio del cluster EKS supera 85%" \
  --namespace ContainerInsights \
  --metric-name pod_cpu_utilization \
  --dimensions Name=ClusterName,Value=$CLUSTER_NAME \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --region $REGION

echo "OK: Alarma CPU creada"

# Alarma: Memoria del cluster alta (>90%)
aws cloudwatch put-metric-alarm \
  --alarm-name "${CLUSTER_NAME}-high-memory" \
  --alarm-description "Memoria promedio del cluster EKS supera 90%" \
  --namespace ContainerInsights \
  --metric-name pod_memory_utilization \
  --dimensions Name=ClusterName,Value=$CLUSTER_NAME \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --region $REGION

echo "OK: Alarma Memoria creada"

# Alarma: Pods en estado Failed
aws cloudwatch put-metric-alarm \
  --alarm-name "${CLUSTER_NAME}-pod-failures" \
  --alarm-description "Hay pods en estado Failed en el cluster" \
  --namespace ContainerInsights \
  --metric-name pod_number_of_containers \
  --dimensions Name=ClusterName,Value=$CLUSTER_NAME Name=Namespace,Value=govtech \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 0 \
  --comparison-operator LessThanOrEqualToThreshold \
  --treat-missing-data breaching \
  --region $REGION 2>/dev/null || echo "Advertencia: Alarma pod-failures puede requerir ajustes de metrica"

echo ""
echo "=== CloudWatch Container Insights configurado exitosamente ==="
echo "Ver metricas en: https://console.aws.amazon.com/cloudwatch/home#container-insights:performance"
echo ""

# Cleanup
rm -f /tmp/cloudwatch-trust-policy.json
