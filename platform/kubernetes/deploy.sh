#!/bin/bash
# ============================================================
# Script: Despliegue completo en Kubernetes
# Colaborador B - Semana 4
#
# Aplica todos los manifiestos en el orden correcto:
# 1. Namespace y configuracion base
# 2. Almacenamiento persistente
# 3. Base de datos (debe estar lista antes del backend)
# 4. Backend (debe estar listo antes del frontend)
# 5. Frontend
# 6. Ingress (expone la app al exterior)
#
# Uso:
#   ./kubernetes/deploy.sh [ENVIRONMENT]
#
# Ejemplos:
#   ./kubernetes/deploy.sh           # Dev por defecto
#   ./kubernetes/deploy.sh dev       # Conectar a govtech-dev
#   ./kubernetes/deploy.sh staging   # Conectar a govtech-staging
#   ./kubernetes/deploy.sh prod      # Conectar a govtech-prod
# ============================================================

set -e  # Salir si cualquier comando falla

# ========================
# VARIABLES
# ========================
ENVIRONMENT="${1:-dev}"
NAMESPACE="govtech"
CLUSTER_NAME="govtech-${ENVIRONMENT}"
REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colores para el output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ========================
# VALIDACIONES
# ========================
echo ""
log_info "=== GovTech Kubernetes Deploy ==="
log_info "Ambiente: $ENVIRONMENT"
log_info "Cluster: $CLUSTER_NAME"
log_info "Namespace: $NAMESPACE"
echo ""

# Verificar que kubectl esta instalado
if ! command -v kubectl &> /dev/null; then
  log_error "kubectl no encontrado. Instalar: https://kubernetes.io/docs/tasks/tools/"
  exit 1
fi

# Verificar que AWS CLI esta instalado
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI no encontrado. Instalar: https://aws.amazon.com/cli/"
  exit 1
fi

# Confirmar en produccion
if [ "$ENVIRONMENT" = "prod" ]; then
  log_warn "ATENCION: Vas a desplegar en PRODUCCION"
  read -p "Escribe 'PRODUCCION' para confirmar: " CONFIRM
  if [ "$CONFIRM" != "PRODUCCION" ]; then
    log_error "Despliegue cancelado"
    exit 1
  fi
fi

# ========================
# PASO 1: Conectar al cluster EKS
# ========================
log_info "--- Paso 1: Conectar a EKS $CLUSTER_NAME ---"
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"

# Verificar que el contexto es el correcto
CURRENT_CONTEXT=$(kubectl config current-context)
log_info "Contexto activo: $CURRENT_CONTEXT"

# ========================
# PASO 2: Namespace y configuracion base
# ========================
log_info "--- Paso 2: Aplicar namespace, RBAC y configuracion base ---"
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
kubectl apply -f "$SCRIPT_DIR/rbac.yaml"        # ServiceAccounts y Roles (antes de los pods)
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/pdb.yaml"         # PodDisruptionBudgets (garantias de disponibilidad)

# Verificar que el Secret existe (no lo creamos aqui - debe existir antes)
if ! kubectl get secret govtech-secrets -n "$NAMESPACE" &> /dev/null; then
  log_error "Secret 'govtech-secrets' no encontrado en namespace '$NAMESPACE'"
  log_error "Crear el secret antes de continuar:"
  log_error "  kubectl create secret generic govtech-secrets \\"
  log_error "    --from-literal=DB_PASSWORD=<password> \\"
  log_error "    --from-literal=DB_USER=govtech_admin \\"
  log_error "    --from-literal=DB_NAME=govtech \\"
  log_error "    -n $NAMESPACE"
  exit 1
fi

log_info "Secret 'govtech-secrets' encontrado"

# ========================
# PASO 3: Almacenamiento persistente
# ========================
log_info "--- Paso 3: Aplicar PersistentVolumeClaims ---"
kubectl apply -f "$SCRIPT_DIR/pvc.yaml"

# ========================
# PASO 4: Base de datos
# ========================
log_info "--- Paso 4: Desplegar base de datos (PostgreSQL) ---"
kubectl apply -f "$SCRIPT_DIR/database/"

log_info "Esperando a que PostgreSQL este listo (timeout: 5 minutos)..."
kubectl wait --for=condition=ready pod \
  -l app=postgres \
  -n "$NAMESPACE" \
  --timeout=300s

log_info "PostgreSQL listo"

# ========================
# PASO 5: Backend
# ========================
log_info "--- Paso 5: Desplegar Backend ---"
kubectl apply -f "$SCRIPT_DIR/backend/"

log_info "Esperando rollout del backend..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s

log_info "Backend listo"

# ========================
# PASO 6: Frontend
# ========================
log_info "--- Paso 6: Desplegar Frontend ---"
kubectl apply -f "$SCRIPT_DIR/frontend/"

log_info "Esperando rollout del frontend..."
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s

log_info "Frontend listo"

# ========================
# PASO 7: Network Policies (Zero-Trust networking)
# ========================
log_info "--- Paso 7: Aplicar Network Policies ---"
kubectl apply -f "$SCRIPT_DIR/network-policies.yaml"
log_info "Network Policies aplicadas: trafico entre pods controlado"

# ========================
# PASO 8: Ingress
# ========================
log_info "--- Paso 8: Aplicar Ingress (AWS ALB) ---"
kubectl apply -f "$SCRIPT_DIR/ingress/ingress-aws.yaml"

log_info "Esperando que el ALB sea creado (puede tardar 2-3 minutos)..."
sleep 30

# Obtener URL del ALB
ALB_URL=$(kubectl get ingress govtech-ingress -n "$NAMESPACE" \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pendiente")

# ========================
# RESUMEN FINAL
# ========================
echo ""
log_info "=== Despliegue Completado ==="
echo ""
echo "Estado de los pods:"
kubectl get pods -n "$NAMESPACE"
echo ""
echo "Estado de los servicios:"
kubectl get services -n "$NAMESPACE"
echo ""
echo "Estado del ingress:"
kubectl get ingress -n "$NAMESPACE"
echo ""

if [ "$ALB_URL" != "pendiente" ] && [ -n "$ALB_URL" ]; then
  log_info "URL de la aplicacion: http://$ALB_URL"
  log_info "Probar: curl http://$ALB_URL/api/health"
else
  log_warn "El ALB todavia se esta creando. Verificar en 2-3 minutos:"
  log_warn "  kubectl get ingress govtech-ingress -n govtech"
fi

echo ""
log_info "Comandos utiles:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -f deploy/backend -n $NAMESPACE"
echo "  kubectl logs -f deploy/frontend -n $NAMESPACE"
echo "  kubectl describe ingress govtech-ingress -n $NAMESPACE"
echo ""
log_info "Verificar seguridad:"
echo "  kubectl get networkpolicies -n $NAMESPACE"
echo "  kubectl get pdb -n $NAMESPACE"
echo "  kubectl get serviceaccounts -n $NAMESPACE"
