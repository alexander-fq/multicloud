#!/bin/bash
# ============================================================
# Test End-to-End: Verificar despliegue completo
# Colaborador C - Semana 4
#
# Uso:
#   ./tests/e2e/test-deployment.sh [BASE_URL]
#
# Ejemplos:
#   ./tests/e2e/test-deployment.sh                          # Obtiene URL del ingress automaticamente
#   ./tests/e2e/test-deployment.sh http://localhost:3000    # Backend local
#   ./tests/e2e/test-deployment.sh https://govtech.example.com
# ============================================================

set -e

# ========================
# VARIABLES
# ========================
NAMESPACE="govtech"
TIMEOUT=10  # segundos por request

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# ========================
# FUNCIONES UTILES
# ========================
pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

skip() {
  echo -e "${YELLOW}[SKIP]${NC} $1"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
}

info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Hace un GET y verifica el status code
check_endpoint() {
  local NAME="$1"
  local URL="$2"
  local EXPECTED_STATUS="${3:-200}"
  local EXPECTED_BODY="$4"  # Opcional: verificar que el body contiene este string

  local RESPONSE
  local STATUS

  RESPONSE=$(curl -s -o /tmp/e2e_response.txt -w "%{http_code}" \
    --max-time $TIMEOUT \
    --connect-timeout 5 \
    "$URL" 2>/dev/null || echo "000")

  STATUS="$RESPONSE"

  if [ "$STATUS" = "$EXPECTED_STATUS" ]; then
    if [ -n "$EXPECTED_BODY" ]; then
      if grep -q "$EXPECTED_BODY" /tmp/e2e_response.txt 2>/dev/null; then
        pass "$NAME (status: $STATUS, body contiene: '$EXPECTED_BODY')"
      else
        fail "$NAME (status: $STATUS pero body no contiene '$EXPECTED_BODY')"
        echo "  Body recibido: $(cat /tmp/e2e_response.txt 2>/dev/null | head -c 200)"
      fi
    else
      pass "$NAME (status: $STATUS)"
    fi
  else
    fail "$NAME (esperado: $EXPECTED_STATUS, obtenido: $STATUS)"
    if [ "$STATUS" = "000" ]; then
      echo "  Error: No se pudo conectar a $URL"
    fi
  fi
}

# ========================
# OBTENER URL BASE
# ========================
if [ -n "$1" ]; then
  BASE_URL="${1%/}"  # Quitar / al final si existe
  info "Usando URL especificada: $BASE_URL"
else
  info "Obteniendo URL del Ingress de Kubernetes..."
  if command -v kubectl &> /dev/null; then
    ALB_URL=$(kubectl get ingress govtech-ingress -n "$NAMESPACE" \
      -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

    if [ -n "$ALB_URL" ]; then
      BASE_URL="http://$ALB_URL"
      info "URL del ALB: $BASE_URL"
    else
      echo ""
      echo -e "${YELLOW}No se encontro la URL del Ingress.${NC}"
      echo "Opciones:"
      echo "  1. Pasar la URL como argumento: ./tests/e2e/test-deployment.sh http://localhost:3000"
      echo "  2. Verificar que el Ingress tiene ADDRESS: kubectl get ingress -n govtech"
      exit 1
    fi
  else
    echo ""
    echo -e "${RED}kubectl no encontrado y no se especifico BASE_URL.${NC}"
    echo "Uso: ./tests/e2e/test-deployment.sh <BASE_URL>"
    exit 1
  fi
fi

echo ""
echo "=============================="
echo "  GovTech E2E Tests"
echo "  Base URL: $BASE_URL"
echo "=============================="
echo ""

# ========================
# GRUPO 1: HEALTH CHECKS
# ========================
echo "--- Health Checks ---"

check_endpoint \
  "Backend health principal" \
  "$BASE_URL/api/health" \
  "200" \
  "status"

check_endpoint \
  "Health de base de datos" \
  "$BASE_URL/api/health/database" \
  "200" \
  "database"

check_endpoint \
  "Health del proveedor cloud" \
  "$BASE_URL/api/health/cloud" \
  "200"

# ========================
# GRUPO 2: API DE MIGRACION
# ========================
echo ""
echo "--- API de Migracion ---"

check_endpoint \
  "Lista de proveedores cloud" \
  "$BASE_URL/api/migration/providers" \
  "200"

check_endpoint \
  "Endpoint de transform" \
  "$BASE_URL/api/demo/transform" \
  "405"  # POST only - GET deberia dar 405

# ========================
# GRUPO 3: FRONTEND
# ========================
echo ""
echo "--- Frontend (React) ---"

check_endpoint \
  "Frontend - pagina principal" \
  "$BASE_URL/" \
  "200" \
  "GovTech"

check_endpoint \
  "Frontend - archivos estaticos (JS)" \
  "$BASE_URL/assets" \
  "200"

# SPA routing: rutas del frontend deben devolver el index.html
check_endpoint \
  "SPA routing - /health" \
  "$BASE_URL/health" \
  "200" \
  "GovTech"

check_endpoint \
  "SPA routing - /demo" \
  "$BASE_URL/demo" \
  "200" \
  "GovTech"

# ========================
# GRUPO 4: SEGURIDAD
# ========================
echo ""
echo "--- Seguridad ---"

# El backend NO debe exponer variables de entorno
check_endpoint \
  "No exponer /env (seguridad)" \
  "$BASE_URL/api/env" \
  "404"

# HTTPS redirect (solo si se usa dominio con HTTPS)
if [[ "$BASE_URL" == https://* ]]; then
  HTTP_URL="${BASE_URL/https:/http:}"
  REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$HTTP_URL/" 2>/dev/null || echo "000")
  if [ "$REDIRECT" = "301" ] || [ "$REDIRECT" = "302" ] || [ "$REDIRECT" = "308" ]; then
    pass "HTTP redirige a HTTPS (status: $REDIRECT)"
  else
    skip "HTTP → HTTPS redirect (status: $REDIRECT, puede ser normal sin HTTPS configurado)"
  fi
else
  skip "HTTPS redirect (URL no usa HTTPS)"
fi

# ========================
# GRUPO 5: KUBERNETES (si kubectl disponible)
# ========================
echo ""
echo "--- Estado de Kubernetes ---"

if command -v kubectl &> /dev/null; then
  # Verificar que todos los pods esten Running
  NOT_RUNNING=$(kubectl get pods -n "$NAMESPACE" \
    --field-selector='status.phase!=Running' \
    --no-headers 2>/dev/null | grep -v "Completed" | wc -l)

  if [ "$NOT_RUNNING" -eq 0 ]; then
    pass "Todos los pods en estado Running"
  else
    fail "Hay $NOT_RUNNING pods que no estan Running"
    kubectl get pods -n "$NAMESPACE" --field-selector='status.phase!=Running' 2>/dev/null
  fi

  # Verificar replicas del HPA
  BACKEND_REPLICAS=$(kubectl get deployment backend -n "$NAMESPACE" \
    -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

  if [ "${BACKEND_REPLICAS:-0}" -ge 2 ]; then
    pass "Backend tiene $BACKEND_REPLICAS replicas listas (minimo: 2)"
  else
    fail "Backend tiene solo ${BACKEND_REPLICAS:-0} replicas (minimo esperado: 2)"
  fi

  # Verificar que el StatefulSet de postgres tiene 1 replica
  POSTGRES_REPLICAS=$(kubectl get statefulset postgres -n "$NAMESPACE" \
    -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

  if [ "${POSTGRES_REPLICAS:-0}" -ge 1 ]; then
    pass "PostgreSQL StatefulSet tiene $POSTGRES_REPLICAS replica lista"
  else
    fail "PostgreSQL StatefulSet no tiene replicas listas"
  fi
else
  skip "Tests de Kubernetes (kubectl no disponible)"
fi

# ========================
# RESUMEN FINAL
# ========================
echo ""
echo "=============================="
echo "  Resultados"
echo "=============================="
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
if [ "$TESTS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}Todos los tests pasaron ($TESTS_PASSED/$TOTAL)${NC}"
  exit 0
else
  echo -e "${RED}Hay $TESTS_FAILED tests fallidos${NC}"
  exit 1
fi
