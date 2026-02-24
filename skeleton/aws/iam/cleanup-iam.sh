#!/bin/bash

###############################################################################
# IAM Cleanup Script - GovTech Cloud Migration Platform
#
# Este script ELIMINA todos los usuarios, grupos y políticas creados
# por setup-iam.sh
#
# ADVERTENCIA: Esta acción NO se puede deshacer
#
# Uso: ./cleanup-iam.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "=========================================="
echo "  GovTech IAM Cleanup Script"
echo "=========================================="
echo ""

print_warning "Este script ELIMINARÁ todos los recursos de IAM creados:"
echo "  - Usuarios: collab-infrastructure, collab-deployment, collab-devops"
echo "  - Grupos: GovTech-Infrastructure, GovTech-Deployment, GovTech-DevOps"
echo "  - Políticas custom: GovTech-*"
echo "  - Access keys asociados"
echo ""

read -p "¿Estás SEGURO de que deseas continuar? (escribe 'DELETE' para confirmar): " confirmation

if [ "$confirmation" != "DELETE" ]; then
    print_error "Operación cancelada"
    exit 1
fi

echo ""

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# List of users to delete
USERS=("collab-infrastructure" "collab-deployment" "collab-devops")

# List of groups
GROUPS=("GovTech-Infrastructure" "GovTech-Deployment" "GovTech-DevOps")

# List of custom policies
POLICIES=(
    "GovTech-ECR-Admin"
    "GovTech-Terraform-State"
    "GovTech-RDS-Admin"
    "GovTech-EKS-Deploy"
    "GovTech-ECR-ReadOnly"
    "GovTech-Secrets-Read"
    "GovTech-CICD-Access"
    "GovTech-Monitoring"
    "GovTech-PermissionBoundary"
)

# Step 1: Delete users
echo "========== Eliminando Usuarios =========="
echo ""

for user in "${USERS[@]}"; do
    if aws iam get-user --user-name "$user" &> /dev/null; then
        echo "Procesando usuario: $user"

        # Remove user from all groups
        for group in "${GROUPS[@]}"; do
            if aws iam remove-user-from-group --user-name "$user" --group-name "$group" 2> /dev/null; then
                echo "  - Removido de grupo: $group"
            fi
        done

        # Delete permission boundary
        if aws iam delete-user-permissions-boundary --user-name "$user" 2> /dev/null; then
            echo "  - Permission boundary eliminado"
        fi

        # Delete access keys
        keys=$(aws iam list-access-keys --user-name "$user" --query 'AccessKeyMetadata[].AccessKeyId' --output text)
        for key in $keys; do
            if aws iam delete-access-key --user-name "$user" --access-key-id "$key" 2> /dev/null; then
                echo "  - Access key eliminado: $key"
            fi
        done

        # Delete login profile
        if aws iam delete-login-profile --user-name "$user" 2> /dev/null; then
            echo "  - Login profile eliminado"
        fi

        # Delete user
        if aws iam delete-user --user-name "$user" 2> /dev/null; then
            print_success "Usuario $user eliminado"
        fi
    else
        print_warning "Usuario $user no existe"
    fi
    echo ""
done

# Step 2: Detach policies from groups and delete groups
echo "========== Eliminando Grupos =========="
echo ""

for group in "${GROUPS[@]}"; do
    if aws iam get-group --group-name "$group" &> /dev/null; then
        echo "Procesando grupo: $group"

        # List and detach all policies
        policies=$(aws iam list-attached-group-policies --group-name "$group" --query 'AttachedPolicies[].PolicyArn' --output text)

        for policy in $policies; do
            if aws iam detach-group-policy --group-name "$group" --policy-arn "$policy" 2> /dev/null; then
                echo "  - Política desadjuntada: $policy"
            fi
        done

        # Delete group
        if aws iam delete-group --group-name "$group" 2> /dev/null; then
            print_success "Grupo $group eliminado"
        fi
    else
        print_warning "Grupo $group no existe"
    fi
    echo ""
done

# Step 3: Delete custom policies
echo "========== Eliminando Políticas Custom =========="
echo ""

for policy in "${POLICIES[@]}"; do
    policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy}"

    if aws iam get-policy --policy-arn "$policy_arn" &> /dev/null; then
        echo "Eliminando política: $policy"

        # Delete all non-default policy versions first
        versions=$(aws iam list-policy-versions --policy-arn "$policy_arn" --query 'Versions[?!IsDefaultVersion].VersionId' --output text)

        for version in $versions; do
            if aws iam delete-policy-version --policy-arn "$policy_arn" --version-id "$version" 2> /dev/null; then
                echo "  - Versión eliminada: $version"
            fi
        done

        # Delete policy
        if aws iam delete-policy --policy-arn "$policy_arn" 2> /dev/null; then
            print_success "Política $policy eliminada"
        fi
    else
        print_warning "Política $policy no existe"
    fi
    echo ""
done

# Step 4: Clean up credential files
echo "========== Limpiando Archivos de Credenciales =========="
echo ""

if ls credentials-*.json 1> /dev/null 2>&1; then
    read -p "¿Eliminar archivos credentials-*.json locales? (y/n): " delete_creds
    if [ "$delete_creds" = "y" ] || [ "$delete_creds" = "Y" ]; then
        rm -f credentials-*.json
        print_success "Archivos de credenciales eliminados"
    fi
else
    echo "No se encontraron archivos de credenciales"
fi

echo ""
echo "=========================================="
print_success "Cleanup Completado!"
echo "=========================================="
echo ""

print_warning "Todos los recursos de IAM han sido eliminados"
echo "Para recrear la configuración, ejecuta: ./setup-iam.sh"
echo ""
