#!/bin/bash
# =============================================================================
# GovTech IAM Setup v2 - Estructura por Funcion (10 grupos)
# =============================================================================
# Reemplaza la estructura anterior de 3 colaboradores por 10 grupos funcionales.
# Cada grupo tiene acceso a UN solo dominio de responsabilidad.
# Un usuario puede estar en multiples grupos segun la tarea que realice.
#
# Uso:
#   ./setup-iam-v2.sh
#
# Requisitos:
#   - AWS CLI configurado con credenciales de AdministratorAccess
#   - aws configure (region: us-east-1)
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
err()  { echo -e "${RED}[ERR]${NC}  $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# =============================================================================
# VERIFICACION INICIAL
# =============================================================================
check_prereqs() {
    if ! command -v aws &> /dev/null; then
        err "AWS CLI no instalado."
        exit 1
    fi
    if ! aws sts get-caller-identity &> /dev/null; then
        err "AWS CLI sin credenciales validas. Ejecutar: aws configure"
        exit 1
    fi

    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    CALLER=$(aws sts get-caller-identity --query Arn --output text)
    ok "Conectado como: $CALLER"
    info "Account ID: $ACCOUNT_ID"
}

# =============================================================================
# FUNCIONES REUTILIZABLES
# =============================================================================
create_policy() {
    local name=$1
    local file=$2
    local desc=$3

    if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${name}" &>/dev/null; then
        warn "Politica ya existe: $name"
    else
        aws iam create-policy \
            --policy-name "$name" \
            --policy-document "file://$file" \
            --description "$desc" > /dev/null
        ok "Politica creada: $name"
    fi
}

create_group() {
    local name=$1
    if aws iam get-group --group-name "$name" &>/dev/null; then
        warn "Grupo ya existe: $name"
    else
        aws iam create-group --group-name "$name" > /dev/null
        ok "Grupo creado: $name"
    fi
}

attach_to_group() {
    local group=$1
    local arn=$2
    aws iam attach-group-policy --group-name "$group" --policy-arn "$arn" 2>/dev/null \
        && ok "  -> $arn" \
        || warn "  -> Ya adjuntada o error: $arn"
}

create_user() {
    local username=$1
    if aws iam get-user --user-name "$username" &>/dev/null; then
        warn "Usuario ya existe: $username"
    else
        aws iam create-user --user-name "$username" > /dev/null
        ok "Usuario creado: $username"
    fi
}

add_to_group() {
    local user=$1
    local group=$2
    aws iam add-user-to-group --user-name "$user" --group-name "$group" 2>/dev/null \
        && ok "  $user -> $group" \
        || warn "  Ya en el grupo: $group"
}

# =============================================================================
# PASO OPCIONAL: Limpiar estructura anterior (3 colaboradores)
# =============================================================================
cleanup_old_structure() {
    echo ""
    warn "Se eliminaran los grupos y usuarios de la estructura anterior:"
    echo "  Grupos:  GovTech-Infrastructure, GovTech-Deployment, GovTech-DevOps"
    echo "  Usuarios: collab-infrastructure, collab-deployment, collab-devops"
    echo ""
    read -p "Confirmar eliminacion (s/n): " confirm
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        info "Limpieza cancelada. Continuando sin eliminar estructura anterior."
        return 0
    fi

    OLD_USERS=("collab-infrastructure" "collab-deployment" "collab-devops")
    OLD_GROUPS=("GovTech-Infrastructure" "GovTech-Deployment" "GovTech-DevOps")

    # Remover usuarios de grupos y eliminar usuarios
    for user in "${OLD_USERS[@]}"; do
        if aws iam get-user --user-name "$user" &>/dev/null; then
            # Remover de todos los grupos
            groups=$(aws iam list-groups-for-user --user-name "$user" \
                --query 'Groups[].GroupName' --output text 2>/dev/null || echo "")
            for g in $groups; do
                aws iam remove-user-from-group --user-name "$user" --group-name "$g" 2>/dev/null || true
            done
            # Eliminar access keys
            keys=$(aws iam list-access-keys --user-name "$user" \
                --query 'AccessKeyMetadata[].AccessKeyId' --output text 2>/dev/null || echo "")
            for key in $keys; do
                aws iam delete-access-key --user-name "$user" --access-key-id "$key" 2>/dev/null || true
            done
            # Eliminar login profile si existe
            aws iam delete-login-profile --user-name "$user" 2>/dev/null || true
            # Eliminar permission boundary si existe
            aws iam delete-user-permissions-boundary --user-name "$user" 2>/dev/null || true
            # Eliminar usuario
            aws iam delete-user --user-name "$user" 2>/dev/null && ok "Usuario eliminado: $user" || warn "No se pudo eliminar: $user"
        fi
    done

    # Desasociar politicas y eliminar grupos
    for group in "${OLD_GROUPS[@]}"; do
        if aws iam get-group --group-name "$group" &>/dev/null; then
            # Desasociar todas las politicas del grupo
            policies=$(aws iam list-attached-group-policies --group-name "$group" \
                --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
            for policy in $policies; do
                aws iam detach-group-policy --group-name "$group" --policy-arn "$policy" 2>/dev/null || true
            done
            aws iam delete-group --group-name "$group" 2>/dev/null && ok "Grupo eliminado: $group" || warn "No se pudo eliminar: $group"
        fi
    done
}

# =============================================================================
# MAIN
# =============================================================================
echo ""
echo "============================================================"
echo "  GovTech IAM Setup v2"
echo "  Estructura por Funcion - 10 Grupos de Acceso"
echo "============================================================"
echo ""

check_prereqs
POLICIES_DIR="$(dirname "$0")/policies"
echo ""

# =============================================================================
# PASO 1: Migracion desde estructura anterior
# =============================================================================
echo "====== PASO 1: Estructura anterior ======"
echo ""
read -p "Limpiar grupos y usuarios de la estructura anterior (3 colaboradores)? (s/n): " do_cleanup
if [ "$do_cleanup" = "s" ] || [ "$do_cleanup" = "S" ]; then
    cleanup_old_structure
fi

# =============================================================================
# PASO 2: Crear politicas custom
# Las politicas que ya existen se saltan automaticamente
# =============================================================================
echo ""
echo "====== PASO 2: Crear politicas custom ======"
echo ""

# Politicas ya existentes (se crean si no existen)
create_policy "GovTech-ECR-Admin"       "$POLICIES_DIR/govtech-ecr-admin.json"       "GovTech - ECR push/pull admin"
create_policy "GovTech-Terraform-State" "$POLICIES_DIR/govtech-terraform-state.json" "GovTech - Terraform state S3"
create_policy "GovTech-RDS-Admin"       "$POLICIES_DIR/govtech-rds-admin.json"       "GovTech - RDS full access"
create_policy "GovTech-EKS-Deploy"      "$POLICIES_DIR/govtech-eks-deploy.json"      "GovTech - EKS deployments"
create_policy "GovTech-ECR-ReadOnly"    "$POLICIES_DIR/govtech-ecr-readonly.json"    "GovTech - ECR read only"
create_policy "GovTech-Secrets-Read"    "$POLICIES_DIR/govtech-secrets-read.json"    "GovTech - Secrets Manager read"
create_policy "GovTech-CICD-Access"     "$POLICIES_DIR/govtech-cicd-access.json"     "GovTech - CI/CD pipelines"
create_policy "GovTech-Monitoring"      "$POLICIES_DIR/govtech-monitoring.json"      "GovTech - CloudWatch monitoring"
create_policy "GovTech-ALB-Controller"  "$POLICIES_DIR/govtech-alb-controller.json"  "GovTech - ALB management"
create_policy "GovTech-AutoScaling"     "$POLICIES_DIR/govtech-autoscaling.json"     "GovTech - AutoScaling"
create_policy "GovTech-IAM-EKS-Roles"  "$POLICIES_DIR/govtech-iam-eks-roles.json"   "GovTech - IAM roles for EKS"
create_policy "GovTech-S3-Admin"        "$POLICIES_DIR/govtech-s3-admin.json"        "GovTech - S3 full access"

# Politica nueva para auditoria de seguridad
create_policy "GovTech-Security-Auditor" "$POLICIES_DIR/govtech-security-auditor.json" "GovTech - Security audit readonly"

# =============================================================================
# PASO 3: Crear los 10 grupos funcionales
# =============================================================================
echo ""
echo "====== PASO 3: Crear grupos funcionales ======"
echo ""

create_group "GovTech-Network-Admin"
create_group "GovTech-EKS-Admin"
create_group "GovTech-Database-Admin"
create_group "GovTech-Terraform-Operator"
create_group "GovTech-Container-Deploy"
create_group "GovTech-ALB-Operator"
create_group "GovTech-Secrets-ReadOnly"
create_group "GovTech-CICD-Operator"
create_group "GovTech-Monitor-ReadOnly"
create_group "GovTech-Security-Auditor"

# =============================================================================
# PASO 4: Asignar politicas a cada grupo
# =============================================================================
echo ""
echo "====== PASO 4: Asignar politicas a grupos ======"
echo ""

# ---- GovTech-Network-Admin ----
# Gestiona VPC, subnets, security groups, internet gateways, NAT
info "Configurando GovTech-Network-Admin..."
attach_to_group "GovTech-Network-Admin" "arn:aws:iam::aws:policy/AmazonVPCFullAccess"
attach_to_group "GovTech-Network-Admin" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-Network-Admin" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-EKS-Admin ----
# Gestiona el cluster EKS, node groups, actualizaciones de version
info "Configurando GovTech-EKS-Admin..."
attach_to_group "GovTech-EKS-Admin" "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
attach_to_group "GovTech-EKS-Admin" "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
attach_to_group "GovTech-EKS-Admin" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-IAM-EKS-Roles"
attach_to_group "GovTech-EKS-Admin" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-EKS-Admin" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-Database-Admin ----
# Gestiona instancias RDS: create, modify, restore, snapshots
info "Configurando GovTech-Database-Admin..."
attach_to_group "GovTech-Database-Admin" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-RDS-Admin"
attach_to_group "GovTech-Database-Admin" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-Database-Admin" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-Terraform-Operator ----
# Ejecuta Terraform: lee/escribe estado en S3, crea recursos
info "Configurando GovTech-Terraform-Operator..."
attach_to_group "GovTech-Terraform-Operator" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Terraform-State"
attach_to_group "GovTech-Terraform-Operator" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-S3-Admin"
attach_to_group "GovTech-Terraform-Operator" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-Terraform-Operator" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-Container-Deploy ----
# Hace push/pull de imagenes Docker a ECR y aplica deployments en EKS
info "Configurando GovTech-Container-Deploy..."
attach_to_group "GovTech-Container-Deploy" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-ECR-Admin"
attach_to_group "GovTech-Container-Deploy" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-EKS-Deploy"
attach_to_group "GovTech-Container-Deploy" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-Container-Deploy" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-ALB-Operator ----
# Gestiona el Application Load Balancer, Target Groups, certificados ACM
info "Configurando GovTech-ALB-Operator..."
attach_to_group "GovTech-ALB-Operator" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-ALB-Controller"
attach_to_group "GovTech-ALB-Operator" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-AutoScaling"
attach_to_group "GovTech-ALB-Operator" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-ALB-Operator" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-Secrets-ReadOnly ----
# Solo puede leer secretos de Secrets Manager (para backends, scripts)
info "Configurando GovTech-Secrets-ReadOnly..."
attach_to_group "GovTech-Secrets-ReadOnly" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Secrets-Read"
attach_to_group "GovTech-Secrets-ReadOnly" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
echo ""

# ---- GovTech-CICD-Operator ----
# Ejecuta pipelines de CI/CD: GitHub Actions, CodePipeline
info "Configurando GovTech-CICD-Operator..."
attach_to_group "GovTech-CICD-Operator" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-CICD-Access"
attach_to_group "GovTech-CICD-Operator" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-ECR-ReadOnly"
attach_to_group "GovTech-CICD-Operator" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-CICD-Operator" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-Monitor-ReadOnly ----
# Monitoreo: CloudWatch metricas, logs, alarmas, GuardDuty findings
info "Configurando GovTech-Monitor-ReadOnly..."
attach_to_group "GovTech-Monitor-ReadOnly" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Monitoring"
attach_to_group "GovTech-Monitor-ReadOnly" "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
attach_to_group "GovTech-Monitor-ReadOnly" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-Monitor-ReadOnly" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# ---- GovTech-Security-Auditor ----
# Auditoria: CloudTrail, Security Hub, GuardDuty, IAM Access Analyzer
# Solo lectura. Para auditores de seguridad y compliance.
info "Configurando GovTech-Security-Auditor..."
attach_to_group "GovTech-Security-Auditor" "arn:aws:iam::${ACCOUNT_ID}:policy/GovTech-Security-Auditor"
attach_to_group "GovTech-Security-Auditor" "arn:aws:iam::aws:policy/SecurityAudit"
attach_to_group "GovTech-Security-Auditor" "arn:aws:iam::aws:policy/AWSCloudShellFullAccess"
attach_to_group "GovTech-Security-Auditor" "arn:aws:iam::aws:policy/ReadOnlyAccess"
echo ""

# =============================================================================
# PASO 5: Crear usuario administrador principal
# Para el operador principal (uso diario, nunca usar root para tareas rutinarias)
# =============================================================================
echo "====== PASO 5: Usuario administrador ======"
echo ""

create_user "govtech-admin"

echo ""
info "Asignando grupos iniciales a govtech-admin..."
info "(Como operador principal, tiene acceso a todos los dominios)"
echo ""

for group in \
    "GovTech-Network-Admin" \
    "GovTech-EKS-Admin" \
    "GovTech-Database-Admin" \
    "GovTech-Terraform-Operator" \
    "GovTech-Container-Deploy" \
    "GovTech-ALB-Operator" \
    "GovTech-Secrets-ReadOnly" \
    "GovTech-CICD-Operator" \
    "GovTech-Monitor-ReadOnly" \
    "GovTech-Security-Auditor"; do
    add_to_group "govtech-admin" "$group"
done

# =============================================================================
# PASO 6: Consola y credenciales
# =============================================================================
echo ""
echo "====== PASO 6: Acceso a consola y credenciales ======"
echo ""

read -p "Crear acceso a consola para govtech-admin? (s/n): " do_console
if [ "$do_console" = "s" ] || [ "$do_console" = "S" ]; then
    TEMP_PASS="GovTech2026!Admin"
    if aws iam create-login-profile \
        --user-name "govtech-admin" \
        --password "$TEMP_PASS" \
        --password-reset-required 2>/dev/null; then
        ok "Acceso a consola creado"
        warn "Password temporal: $TEMP_PASS"
        info "Cambiar en el primer login"
        info "URL: https://${ACCOUNT_ID}.signin.aws.amazon.com/console"
    else
        warn "Login profile ya existe"
    fi
fi

echo ""
read -p "Crear access key para govtech-admin? (s/n): " do_key
if [ "$do_key" = "s" ] || [ "$do_key" = "S" ]; then
    key_count=$(aws iam list-access-keys --user-name "govtech-admin" \
        --query 'AccessKeyMetadata' --output text 2>/dev/null | wc -l)
    if [ "$key_count" -ge 2 ]; then
        warn "Ya tiene 2 access keys (maximo). Eliminar una primero."
    else
        aws iam create-access-key --user-name "govtech-admin" \
            > "$(dirname "$0")/credentials-govtech-admin.json"
        ok "Access key guardado en: aws/iam/credentials-govtech-admin.json"
        warn "NO commitear este archivo. Esta en .gitignore."
    fi
fi

# =============================================================================
# PASO 7: Activar MFA (recomendacion)
# =============================================================================
echo ""
echo "====== PASO 7: MFA ======"
echo ""
warn "MFA no configurado automaticamente (requiere interaccion manual)."
info "Para activar MFA en govtech-admin:"
echo "  1. Ingresar a la consola AWS como govtech-admin"
echo "  2. IAM -> Users -> govtech-admin -> Security credentials"
echo "  3. Assign MFA device -> Authenticator app (Google Authenticator / Authy)"
echo ""

# =============================================================================
# RESUMEN FINAL
# =============================================================================
echo ""
echo "============================================================"
ok "Setup IAM v2 completado"
echo "============================================================"
echo ""
echo "Grupos creados (10):"
echo "  GovTech-Network-Admin      - VPC, subnets, security groups"
echo "  GovTech-EKS-Admin          - Cluster EKS, node groups"
echo "  GovTech-Database-Admin     - RDS, snapshots, restore"
echo "  GovTech-Terraform-Operator - Estado Terraform, S3"
echo "  GovTech-Container-Deploy   - ECR, kubectl deployments"
echo "  GovTech-ALB-Operator       - Load Balancer, certificados ACM"
echo "  GovTech-Secrets-ReadOnly   - Secrets Manager (solo lectura)"
echo "  GovTech-CICD-Operator      - Pipelines CI/CD"
echo "  GovTech-Monitor-ReadOnly   - CloudWatch, GuardDuty (solo lectura)"
echo "  GovTech-Security-Auditor   - CloudTrail, Security Hub (solo lectura)"
echo ""
echo "Usuario creado:"
echo "  govtech-admin (operador principal)"
echo ""
echo "Politicas custom: 13"
echo ""
warn "Proximos pasos:"
echo "  1. Activar MFA para govtech-admin (obligatorio en entorno gobierno)"
echo "  2. Rotar access keys cada 90 dias"
echo "  3. Revisar CloudTrail mensualmente"
echo "  4. Para un nuevo miembro del equipo: crear usuario y asignar"
echo "     SOLO el grupo que necesita para su tarea especifica"
echo ""
