#!/bin/bash

###############################################################################
# Script para Agregar Permisos Faltantes - GovTech IAM
#
# Este script crea 4 políticas adicionales y las adjunta a los grupos
# correspondientes para completar los permisos necesarios.
#
# Uso: ./add-missing-permissions.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "=========================================="
echo "  Agregar Permisos Faltantes - GovTech"
echo "=========================================="
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -d "policies" ]; then
    print_error "No se encuentra la carpeta 'policies'. Ejecuta desde aws/iam/"
    exit 1
fi

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_info "Account ID: $ACCOUNT_ID"
echo ""

# Definir políticas a crear
declare -A POLICIES=(
    ["GovTech-IAM-EKS-Roles"]="policies/govtech-iam-eks-roles.json"
    ["GovTech-S3-Admin"]="policies/govtech-s3-admin.json"
    ["GovTech-ALB-Controller"]="policies/govtech-alb-controller.json"
    ["GovTech-AutoScaling"]="policies/govtech-autoscaling.json"
)

# Paso 1: Crear políticas
echo "========== PASO 1: Crear Políticas Custom =========="
echo ""

for policy_name in "${!POLICIES[@]}"; do
    policy_file="${POLICIES[$policy_name]}"

    if [ ! -f "$policy_file" ]; then
        print_error "Archivo no encontrado: $policy_file"
        continue
    fi

    print_info "Creando política: $policy_name"

    # Verificar si la política ya existe
    policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
    if aws iam get-policy --policy-arn "$policy_arn" &> /dev/null; then
        print_warning "Política $policy_name ya existe, se actualizará"

        # Crear nueva versión
        aws iam create-policy-version \
            --policy-arn "$policy_arn" \
            --policy-document file://"$policy_file" \
            --set-as-default &> /dev/null || {
            print_warning "No se pudo actualizar, puede tener 5 versiones. Eliminando versiones antiguas..."

            # Eliminar versiones antiguas (no default)
            versions=$(aws iam list-policy-versions --policy-arn "$policy_arn" --query 'Versions[?!IsDefaultVersion].VersionId' --output text)
            for version in $versions; do
                aws iam delete-policy-version --policy-arn "$policy_arn" --version-id "$version" 2>/dev/null || true
            done

            # Reintentar
            aws iam create-policy-version \
                --policy-arn "$policy_arn" \
                --policy-document file://"$policy_file" \
                --set-as-default
        }
        print_success "Política $policy_name actualizada"
    else
        # Crear nueva política
        aws iam create-policy \
            --policy-name "$policy_name" \
            --policy-document file://"$policy_file" \
            --description "GovTech Multi-Cloud Migration Platform - ${policy_name}" \
            &> /dev/null

        print_success "Política $policy_name creada"
    fi
    echo ""
done

echo ""

# Paso 2: Adjuntar políticas a grupos
echo "========== PASO 2: Adjuntar Políticas a Grupos =========="
echo ""

# Colaborador A (Infrastructure) - Necesita IAM y S3
print_info "Configurando grupo GovTech-Infrastructure..."

aws iam attach-group-policy \
    --group-name GovTech-Infrastructure \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-IAM-EKS-Roles" \
    2>/dev/null && print_success "GovTech-IAM-EKS-Roles adjuntado a GovTech-Infrastructure" || print_warning "Ya estaba adjuntado"

aws iam attach-group-policy \
    --group-name GovTech-Infrastructure \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-S3-Admin" \
    2>/dev/null && print_success "GovTech-S3-Admin adjuntado a GovTech-Infrastructure" || print_warning "Ya estaba adjuntado"

echo ""

# Colaborador B (Deployment) - Necesita ALB y AutoScaling
print_info "Configurando grupo GovTech-Deployment..."

aws iam attach-group-policy \
    --group-name GovTech-Deployment \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-ALB-Controller" \
    2>/dev/null && print_success "GovTech-ALB-Controller adjuntado a GovTech-Deployment" || print_warning "Ya estaba adjuntado"

aws iam attach-group-policy \
    --group-name GovTech-Deployment \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-AutoScaling" \
    2>/dev/null && print_success "GovTech-AutoScaling adjuntado a GovTech-Deployment" || print_warning "Ya estaba adjuntado"

echo ""

# Paso 3: Verificación
echo "========== PASO 3: Verificación =========="
echo ""

print_info "Verificando políticas del grupo GovTech-Infrastructure..."
infrastructure_policies=$(aws iam list-attached-group-policies --group-name GovTech-Infrastructure --query 'AttachedPolicies[].PolicyName' --output text)
echo "Políticas: $infrastructure_policies"
echo ""

print_info "Verificando políticas del grupo GovTech-Deployment..."
deployment_policies=$(aws iam list-attached-group-policies --group-name GovTech-Deployment --query 'AttachedPolicies[].PolicyName' --output text)
echo "Políticas: $deployment_policies"
echo ""

print_info "Verificando políticas del grupo GovTech-DevOps..."
devops_policies=$(aws iam list-attached-group-policies --group-name GovTech-DevOps --query 'AttachedPolicies[].PolicyName' --output text)
echo "Políticas: $devops_policies"
echo ""

# Resumen
echo "=========================================="
print_success "Permisos Faltantes Agregados Exitosamente"
echo "=========================================="
echo ""

echo "Resumen de permisos agregados:"
echo ""
echo "Colaborador A (collab-infrastructure):"
echo "  + GovTech-IAM-EKS-Roles  - Puede crear IAM roles para EKS"
echo "  + GovTech-S3-Admin       - Puede crear y gestionar buckets S3"
echo ""
echo "Colaborador B (collab-deployment):"
echo "  + GovTech-ALB-Controller - Puede crear ALB/Ingress"
echo "  + GovTech-AutoScaling    - Puede configurar HPA"
echo ""

print_warning "IMPORTANTE: Los usuarios deben cerrar sesión y volver a iniciar para que los cambios surtan efecto"
echo ""

echo "Próximos pasos:"
echo "1. Cerrar sesión en AWS Console"
echo "2. Volver a iniciar sesión"
echo "3. Probar permisos con comandos de verificación"
echo ""
