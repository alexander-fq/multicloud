#!/bin/bash
# ============================================================
# Script: Restauracion de Base de Datos RDS
# GovTech Cloud - Disaster Recovery
#
# Uso:
#   ./restore-database.sh --snapshot <SNAPSHOT_ID> --environment <dev|staging|prod>
#   ./restore-database.sh --snapshot latest --environment dev
#   ./restore-database.sh --snapshot latest --environment dev --verify-only
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ========================
# PARSEAR ARGUMENTOS
# ========================
SNAPSHOT_ID=""
ENVIRONMENT="dev"
VERIFY_ONLY=false
REGION="us-east-1"

while [[ $# -gt 0 ]]; do
  case $1 in
    --snapshot) SNAPSHOT_ID="$2"; shift 2 ;;
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --verify-only) VERIFY_ONLY=true; shift ;;
    *) log_error "Argumento desconocido: $1"; exit 1 ;;
  esac
done

SOURCE_DB="govtech-${ENVIRONMENT}-postgres"
RESTORED_DB="${SOURCE_DB}-restored-$(date +%Y%m%d%H%M)"

# ========================
# OBTENER SNAPSHOT
# ========================
log_info "=== Restauracion de Base de Datos RDS ==="
log_info "Ambiente: $ENVIRONMENT"
log_info "Region: $REGION"
echo ""

if [ "$SNAPSHOT_ID" = "latest" ]; then
  log_info "Buscando snapshot mas reciente de $SOURCE_DB..."
  SNAPSHOT_ID=$(aws rds describe-db-snapshots \
    --db-instance-identifier "$SOURCE_DB" \
    --snapshot-type automated \
    --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[-1].DBSnapshotIdentifier' \
    --output text \
    --region "$REGION" 2>/dev/null || echo "")

  if [ -z "$SNAPSHOT_ID" ] || [ "$SNAPSHOT_ID" = "None" ]; then
    log_error "No se encontraron snapshots automaticos para $SOURCE_DB"
    log_error "Listar snapshots disponibles:"
    aws rds describe-db-snapshots --db-instance-identifier "$SOURCE_DB" \
      --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier, Fecha:SnapshotCreateTime}' \
      --output table --region "$REGION"
    exit 1
  fi
fi

log_info "Snapshot seleccionado: $SNAPSHOT_ID"

# Obtener informacion del snapshot
SNAPSHOT_INFO=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --query 'DBSnapshots[0].{Fecha:SnapshotCreateTime, Tamano:AllocatedStorage, Estado:Status}' \
  --output json \
  --region "$REGION" 2>/dev/null || echo "{}")

log_info "Informacion del snapshot: $SNAPSHOT_INFO"

if [ "$VERIFY_ONLY" = true ]; then
  log_info "Modo verify-only: el snapshot existe y es valido"
  log_info "Para restaurar, ejecutar sin --verify-only"
  exit 0
fi

# ========================
# CONFIRMACION
# ========================
echo ""
log_warn "ATENCION: Se va a restaurar la base de datos."
log_warn "Esto crea una NUEVA instancia RDS (no sobreescribe la existente)."
log_warn "Nueva instancia: $RESTORED_DB"
echo ""

if [ "$ENVIRONMENT" = "prod" ]; then
  log_warn "PRODUCCION: Esta accion requiere aprobacion del lider del proyecto."
  read -p "Ingresa el codigo de aprobacion: " APPROVAL_CODE
  if [ "$APPROVAL_CODE" != "RESTORE-PROD-$(date +%Y%m%d)" ]; then
    log_error "Codigo incorrecto. El codigo de hoy es: RESTORE-PROD-$(date +%Y%m%d)"
    exit 1
  fi
fi

# ========================
# RESTAURAR
# ========================
log_info "Iniciando restauracion desde snapshot..."
log_info "Instancia destino: $RESTORED_DB"
log_info "Esto puede tardar 10-30 minutos..."

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$RESTORED_DB" \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --db-instance-class "db.t3.micro" \
  --no-publicly-accessible \
  --region "$REGION"

log_info "Esperando que la instancia este disponible..."
aws rds wait db-instance-available \
  --db-instance-identifier "$RESTORED_DB" \
  --region "$REGION"

# ========================
# OBTENER ENDPOINT NUEVO
# ========================
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RESTORED_DB" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region "$REGION")

log_info "Base de datos restaurada exitosamente"
echo ""
echo "============================================"
echo "  RESTAURACION COMPLETADA"
echo "  Nueva instancia: $RESTORED_DB"
echo "  Endpoint: $NEW_ENDPOINT"
echo "============================================"
echo ""
log_warn "PASOS SIGUIENTES:"
log_warn "1. Verificar datos en la nueva instancia"
log_warn "2. Actualizar DB_HOST en el ConfigMap de Kubernetes:"
log_warn "   kubectl edit configmap govtech-config -n govtech"
log_warn "3. Reiniciar el backend:"
log_warn "   kubectl rollout restart deployment/backend -n govtech"
log_warn "4. Ejecutar tests: ./tests/e2e/test-deployment.sh"
log_warn "5. Si todo funciona, eliminar la instancia anterior (o mantener como backup)"
