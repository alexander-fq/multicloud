#!/bin/bash
# ============================================================
# Test: Validar sintaxis y configuracion de Terraform
# ============================================================
# Que hace este script:
# 1. terraform fmt -check  : verifica formato del codigo
# 2. terraform validate    : verifica sintaxis de cada ambiente
# 3. tfsec                 : escaneo de seguridad estatico (opcional)
#
# Uso:
#   ./tests/infrastructure/validate-terraform.sh
#
# Pre-requisitos:
#   - Terraform >= 1.5.0 instalado
#   - AWS credentials configuradas (para terraform init)
# ============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() { echo -e "${GREEN}[PASS]${NC} $1"; PASSED=$((PASSED+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; FAILED=$((FAILED+1)); }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../../terraform"

echo ""
echo "=============================="
echo "  Terraform Validation Tests"
echo "=============================="
echo ""

# ========================
# TEST 1: Formato del codigo
# ========================
info "Verificando formato de codigo (terraform fmt)..."
if terraform fmt -check -recursive "$TERRAFORM_DIR" > /dev/null 2>&1; then
  pass "Formato de codigo correcto"
else
  fail "Codigo mal formateado. Ejecutar: terraform fmt -recursive terraform/"
  terraform fmt -check -recursive "$TERRAFORM_DIR" 2>&1 | head -20
fi

# ========================
# TEST 2: Validar cada ambiente
# ========================
for ENV in dev staging prod; do
  ENV_DIR="$TERRAFORM_DIR/environments/$ENV"
  info "Validando ambiente: $ENV..."

  if [ ! -d "$ENV_DIR" ]; then
    fail "Directorio no encontrado: $ENV_DIR"
    continue
  fi

  # terraform init descarga providers (necesario para validate)
  if terraform -chdir="$ENV_DIR" init -backend=false -no-color > /dev/null 2>&1; then
    if terraform -chdir="$ENV_DIR" validate -no-color > /dev/null 2>&1; then
      pass "terraform validate: environments/$ENV"
    else
      fail "terraform validate fallo en environments/$ENV"
      terraform -chdir="$ENV_DIR" validate -no-color 2>&1
    fi
  else
    fail "terraform init fallo en environments/$ENV (verificar providers)"
  fi
done

# ========================
# TEST 3: Verificar modulos
# ========================
info "Verificando modulos Terraform..."
for MODULE in networking kubernetes-cluster database storage security; do
  MODULE_DIR="$TERRAFORM_DIR/modules/$MODULE"
  if [ -f "$MODULE_DIR/aws.tf" ] || [ -f "$MODULE_DIR/main.tf" ]; then
    pass "Modulo existe: $MODULE"
  else
    fail "Modulo no encontrado: $MODULE"
  fi
done

# ========================
# TEST 4: Archivos sensibles no commiteados
# ========================
info "Verificando que no hay archivos sensibles..."
SENSITIVE_FILES=$(find "$TERRAFORM_DIR" -name "*.tfvars" ! -name "*.example" 2>/dev/null)
if [ -z "$SENSITIVE_FILES" ]; then
  pass "No hay archivos .tfvars con valores reales commiteados"
else
  fail "Se encontraron archivos .tfvars con posibles valores reales:"
  echo "$SENSITIVE_FILES"
fi

# ========================
# TEST 5: tfsec (si esta instalado)
# ========================
if command -v tfsec &> /dev/null; then
  info "Ejecutando tfsec (analisis de seguridad estatico)..."
  if tfsec "$TERRAFORM_DIR" --no-color --minimum-severity HIGH > /tmp/tfsec-output.txt 2>&1; then
    pass "tfsec: sin problemas HIGH o CRITICAL"
  else
    fail "tfsec encontro problemas de seguridad:"
    cat /tmp/tfsec-output.txt | head -50
  fi
else
  echo -e "${YELLOW}[SKIP]${NC} tfsec no instalado (instalar: brew install tfsec)"
fi

# ========================
# RESUMEN
# ========================
echo ""
echo "=============================="
echo "  Resultados"
echo "=============================="
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}Todos los tests de infraestructura pasaron${NC}"
  exit 0
else
  echo -e "${RED}Hay $FAILED tests fallidos${NC}"
  exit 1
fi
