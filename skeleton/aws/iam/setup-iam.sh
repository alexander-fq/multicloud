#!/bin/bash

###############################################################################
# IAM Setup Script - GovTech Cloud Migration Platform
#
# Este script configura usuarios, grupos y políticas de IAM basado en el
# principio de mínimo privilegio.
#
# Requisitos:
# - AWS CLI configurado con credenciales de root
# - Permisos de AdministratorAccess
#
# Uso: ./setup-iam.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI no está instalado. Por favor instálalo primero."
        exit 1
    fi

    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI no está configurado con credenciales válidas."
        print_info "Ejecuta: aws configure"
        exit 1
    fi

    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS CLI configurado correctamente"
    print_info "Account ID: $ACCOUNT_ID"
}

# Function to create IAM policy
create_policy() {
    local policy_name=$1
    local policy_file=$2

    print_info "Creando política: $policy_name"

    # Check if policy already exists
    if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}" &> /dev/null; then
        print_warning "La política $policy_name ya existe. Saltando..."
        return 0
    fi

    # Create policy
    if aws iam create-policy \
        --policy-name "$policy_name" \
        --policy-document "file://$policy_file" \
        --description "GovTech custom policy" > /dev/null; then
        print_success "Política $policy_name creada"
    else
        print_error "Error al crear política $policy_name"
        return 1
    fi
}

# Function to create IAM group
create_group() {
    local group_name=$1

    print_info "Creando grupo: $group_name"

    # Check if group already exists
    if aws iam get-group --group-name "$group_name" &> /dev/null; then
        print_warning "El grupo $group_name ya existe. Saltando..."
        return 0
    fi

    # Create group
    if aws iam create-group --group-name "$group_name" > /dev/null; then
        print_success "Grupo $group_name creado"
    else
        print_error "Error al crear grupo $group_name"
        return 1
    fi
}

# Function to attach policy to group
attach_policy_to_group() {
    local group_name=$1
    local policy_arn=$2

    print_info "Adjuntando política a grupo: $group_name"

    if aws iam attach-group-policy \
        --group-name "$group_name" \
        --policy-arn "$policy_arn" 2> /dev/null; then
        print_success "Política adjuntada a $group_name"
    else
        print_warning "La política ya está adjuntada o hubo un error"
    fi
}

# Function to create IAM user
create_user() {
    local username=$1

    print_info "Creando usuario: $username"

    # Check if user already exists
    if aws iam get-user --user-name "$username" &> /dev/null; then
        print_warning "El usuario $username ya existe. Saltando..."
        return 0
    fi

    # Create user
    if aws iam create-user --user-name "$username" > /dev/null; then
        print_success "Usuario $username creado"
    else
        print_error "Error al crear usuario $username"
        return 1
    fi
}

# Function to add user to group
add_user_to_group() {
    local username=$1
    local group_name=$2

    print_info "Añadiendo $username al grupo $group_name"

    if aws iam add-user-to-group \
        --user-name "$username" \
        --group-name "$group_name" 2> /dev/null; then
        print_success "Usuario $username añadido a $group_name"
    else
        print_warning "El usuario ya está en el grupo o hubo un error"
    fi
}

# Function to apply permission boundary
apply_permission_boundary() {
    local username=$1
    local boundary_policy_arn=$2

    print_info "Aplicando permission boundary a $username"

    if aws iam put-user-permissions-boundary \
        --user-name "$username" \
        --permissions-boundary "$boundary_policy_arn" 2> /dev/null; then
        print_success "Permission boundary aplicado a $username"
    else
        print_warning "La permission boundary ya está aplicada o hubo un error"
    fi
}

# Function to create access key
create_access_key() {
    local username=$1

    print_info "Creando access key para $username"

    # Check if user already has access keys
    key_count=$(aws iam list-access-keys --user-name "$username" --query 'AccessKeyMetadata' --output text | wc -l)

    if [ "$key_count" -ge 2 ]; then
        print_warning "El usuario $username ya tiene 2 access keys (máximo). Saltando..."
        return 0
    fi

    # Create access key and save to file
    aws iam create-access-key --user-name "$username" > "credentials-${username}.json"
    print_success "Access key creado para $username"
    print_info "Credenciales guardadas en: credentials-${username}.json"
}

# Function to create login profile (console password)
create_login_profile() {
    local username=$1
    local temp_password="GovTech2026!TempPass"

    print_info "Creando console login para $username"

    if aws iam create-login-profile \
        --user-name "$username" \
        --password "$temp_password" \
        --password-reset-required 2> /dev/null; then
        print_success "Console login creado para $username"
        print_warning "Password temporal: $temp_password"
        print_info "El usuario debe cambiar su password en el primer login"
    else
        print_warning "El login profile ya existe o hubo un error"
    fi
}

###############################################################################
# MAIN EXECUTION
###############################################################################

echo "=========================================="
echo "  GovTech IAM Setup Script"
echo "  Configuración de Seguridad con Mínimo Privilegio"
echo "=========================================="
echo ""

# Step 0: Check AWS CLI
print_info "Verificando configuración de AWS CLI..."
check_aws_cli
echo ""

# Step 1: Create custom policies
print_info "========== PASO 1: Crear Políticas Custom =========="
echo ""

cd "$(dirname "$0")/policies"

create_policy "GovTech-ECR-Admin" "govtech-ecr-admin.json"
create_policy "GovTech-Terraform-State" "govtech-terraform-state.json"
create_policy "GovTech-RDS-Admin" "govtech-rds-admin.json"
create_policy "GovTech-EKS-Deploy" "govtech-eks-deploy.json"
create_policy "GovTech-ECR-ReadOnly" "govtech-ecr-readonly.json"
create_policy "GovTech-Secrets-Read" "govtech-secrets-read.json"
create_policy "GovTech-CICD-Access" "govtech-cicd-access.json"
create_policy "GovTech-Monitoring" "govtech-monitoring.json"
create_policy "GovTech-PermissionBoundary" "govtech-permission-boundary.json"

cd - > /dev/null

echo ""
print_success "Políticas custom creadas"
echo ""

# Step 2: Create IAM groups
print_info "========== PASO 2: Crear Grupos IAM =========="
echo ""

create_group "GovTech-Infrastructure"
create_group "GovTech-Deployment"
create_group "GovTech-DevOps"

echo ""
print_success "Grupos IAM creados"
echo ""

# Step 3: Attach policies to groups
print_info "========== PASO 3: Adjuntar Políticas a Grupos =========="
echo ""

# Group: GovTech-Infrastructure
print_info "Configurando grupo GovTech-Infrastructure..."
attach_policy_to_group "GovTech-Infrastructure" "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
attach_policy_to_group "GovTech-Infrastructure" "arn:aws:iam::aws:policy/AmazonVPCFullAccess"
attach_policy_to_group "GovTech-Infrastructure" "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
attach_policy_to_group "GovTech-Infrastructure" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-ECR-Admin"
attach_policy_to_group "GovTech-Infrastructure" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Terraform-State"
attach_policy_to_group "GovTech-Infrastructure" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-RDS-Admin"
echo ""

# Group: GovTech-Deployment
print_info "Configurando grupo GovTech-Deployment..."
attach_policy_to_group "GovTech-Deployment" "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
attach_policy_to_group "GovTech-Deployment" "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
attach_policy_to_group "GovTech-Deployment" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-EKS-Deploy"
attach_policy_to_group "GovTech-Deployment" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-ECR-ReadOnly"
attach_policy_to_group "GovTech-Deployment" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Secrets-Read"
echo ""

# Group: GovTech-DevOps
print_info "Configurando grupo GovTech-DevOps..."
attach_policy_to_group "GovTech-DevOps" "arn:aws:iam::aws:policy/CloudWatchFullAccess"
attach_policy_to_group "GovTech-DevOps" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-CICD-Access"
attach_policy_to_group "GovTech-DevOps" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Monitoring"
echo ""

print_success "Políticas adjuntadas a grupos"
echo ""

# Step 4: Create users
print_info "========== PASO 4: Crear Usuarios IAM =========="
echo ""

create_user "collab-infrastructure"
create_user "collab-deployment"
create_user "collab-devops"

echo ""
print_success "Usuarios IAM creados"
echo ""

# Step 5: Add users to groups
print_info "========== PASO 5: Asignar Usuarios a Grupos =========="
echo ""

add_user_to_group "collab-infrastructure" "GovTech-Infrastructure"
add_user_to_group "collab-deployment" "GovTech-Deployment"
add_user_to_group "collab-devops" "GovTech-DevOps"

echo ""
print_success "Usuarios asignados a grupos"
echo ""

# Step 6: Apply permission boundaries
print_info "========== PASO 6: Aplicar Permission Boundaries =========="
echo ""

BOUNDARY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-PermissionBoundary"

apply_permission_boundary "collab-infrastructure" "$BOUNDARY_ARN"
apply_permission_boundary "collab-deployment" "$BOUNDARY_ARN"
apply_permission_boundary "collab-devops" "$BOUNDARY_ARN"

echo ""
print_success "Permission boundaries aplicados"
echo ""

# Step 7: Create access keys
print_info "========== PASO 7: Crear Access Keys =========="
echo ""

read -p "¿Deseas crear access keys para los usuarios? (y/n): " create_keys

if [ "$create_keys" = "y" ] || [ "$create_keys" = "Y" ]; then
    cd "$(dirname "$0")"
    create_access_key "collab-infrastructure"
    create_access_key "collab-deployment"
    create_access_key "collab-devops"
    echo ""
    print_warning "IMPORTANTE: Guarda los archivos credentials-*.json en un lugar seguro"
    print_warning "IMPORTANTE: No los compartas por canales inseguros"
fi

echo ""

# Step 8: Create console login profiles
print_info "========== PASO 8: Crear Console Login (Opcional) =========="
echo ""

read -p "¿Deseas crear console login para los usuarios? (y/n): " create_console

if [ "$create_console" = "y" ] || [ "$create_console" = "Y" ]; then
    create_login_profile "collab-infrastructure"
    create_login_profile "collab-deployment"
    create_login_profile "collab-devops"

    echo ""
    print_warning "IMPORTANTE: Comparte las passwords temporales de forma segura"
    print_info "Los usuarios deben cambiar su password en el primer login"
    print_info "Console URL: https://${ACCOUNT_ID}.signin.aws.amazon.com/console"
fi

echo ""
echo "=========================================="
print_success "IAM Setup Completado!"
echo "=========================================="
echo ""

# Print summary
print_info "Resumen de la configuración:"
echo ""
echo "Grupos creados:"
echo "  - GovTech-Infrastructure (Colaborador A)"
echo "  - GovTech-Deployment (Colaborador B)"
echo "  - GovTech-DevOps (Colaborador C)"
echo ""
echo "Usuarios creados:"
echo "  - collab-infrastructure"
echo "  - collab-deployment"
echo "  - collab-devops"
echo ""
echo "Políticas custom creadas: 9"
echo "Permission boundaries aplicados: Sí"
echo ""

print_info "Próximos pasos:"
echo "1. Distribuir credenciales de forma segura a cada colaborador"
echo "2. Configurar MFA para cada usuario (recomendado)"
echo "3. Revisar CloudTrail para auditoría"
echo "4. Ejecutar tests de permisos (ver IAM_SECURITY_POLICIES.md)"
echo ""

print_warning "Recuerda:"
echo "- Los access keys deben rotarse cada 90 días"
echo "- Habilitar MFA para mayor seguridad"
echo "- Revisar permisos mensualmente"
echo ""
