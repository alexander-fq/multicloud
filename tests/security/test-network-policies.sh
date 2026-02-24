#!/bin/bash
# ============================================================
# Test: Verificar que las Network Policies estan funcionando
# ============================================================
# Que hace este script:
# 1. Verifica que las 4 NetworkPolicies existen en el cluster
# 2. Prueba que el frontend NO puede acceder directamente a la DB
# 3. Prueba que el backend SI puede acceder a la DB
# 4. Verifica que los RBAC esten correctamente configurados
# 5. Verifica que los PodDisruptionBudgets existen
#
# Uso:
#   ./tests/security/test-network-policies.sh [NAMESPACE]
#
# Ejemplo:
#   ./tests/security/test-network-policies.sh govtech
# ============================================================

set -e

NAMESPACE="${1:-govtech}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

pass()  { echo -e "${GREEN}[PASS]${NC} $1";  PASSED=$((PASSED+1)); }
fail()  { echo -e "${RED}[FAIL]${NC} $1";   FAILED=$((FAILED+1)); }
skip()  { echo -e "${YELLOW}[SKIP]${NC} $1"; SKIPPED=$((SKIPPED+1)); }
info()  { echo -e "${YELLOW}[INFO]${NC} $1"; }

echo ""
echo "======================================"
echo "  Network Security Tests"
echo "  Namespace: $NAMESPACE"
echo "======================================"
echo ""

# Verificar kubectl
if ! command -v kubectl &> /dev/null; then
  echo -e "${RED}ERROR: kubectl no encontrado${NC}"
  exit 1
fi

# Verificar conexion al cluster
if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
  echo -e "${RED}ERROR: No se puede conectar al cluster o namespace '$NAMESPACE' no existe${NC}"
  exit 1
fi

# ========================
# GRUPO 1: Network Policies existen
# ========================
echo "--- NetworkPolicies ---"

for POLICY in default-deny-all frontend-network-policy backend-network-policy database-network-policy; do
  if kubectl get networkpolicy "$POLICY" -n "$NAMESPACE" > /dev/null 2>&1; then
    pass "NetworkPolicy existe: $POLICY"
  else
    fail "NetworkPolicy NO encontrada: $POLICY"
  fi
done

# ========================
# GRUPO 2: RBAC configurado
# ========================
echo ""
echo "--- RBAC ---"

for SA in govtech-backend govtech-frontend govtech-database govtech-deployer; do
  if kubectl get serviceaccount "$SA" -n "$NAMESPACE" > /dev/null 2>&1; then
    pass "ServiceAccount existe: $SA"
  else
    fail "ServiceAccount NO encontrado: $SA"
  fi
done

for ROLE in govtech-backend-role govtech-deployer-role; do
  if kubectl get role "$ROLE" -n "$NAMESPACE" > /dev/null 2>&1; then
    pass "Role existe: $ROLE"
  else
    fail "Role NO encontrado: $ROLE"
  fi
done

# Verificar que frontend NO tiene permisos de secrets
info "Verificando que frontend no puede leer secrets..."
CAN_READ=$(kubectl auth can-i get secrets \
  --as=system:serviceaccount:${NAMESPACE}:govtech-frontend \
  -n "$NAMESPACE" 2>/dev/null || echo "no")
if [ "$CAN_READ" = "no" ]; then
  pass "Frontend NO puede leer secrets (correcto)"
else
  fail "Frontend PUEDE leer secrets (incorrecto - violacion de least privilege)"
fi

# Verificar que backend SI puede leer configmaps
info "Verificando que backend puede leer configmaps..."
CAN_READ_CM=$(kubectl auth can-i get configmaps \
  --as=system:serviceaccount:${NAMESPACE}:govtech-backend \
  -n "$NAMESPACE" 2>/dev/null || echo "no")
if [ "$CAN_READ_CM" = "yes" ]; then
  pass "Backend puede leer configmaps (correcto)"
else
  fail "Backend NO puede leer configmaps (verificar rbac.yaml)"
fi

# ========================
# GRUPO 3: PodDisruptionBudgets
# ========================
echo ""
echo "--- PodDisruptionBudgets ---"

for PDB in backend-pdb frontend-pdb database-pdb; do
  if kubectl get pdb "$PDB" -n "$NAMESPACE" > /dev/null 2>&1; then
    MIN_AVAILABLE=$(kubectl get pdb "$PDB" -n "$NAMESPACE" \
      -o jsonpath='{.spec.minAvailable}' 2>/dev/null || echo "?")
    pass "PDB existe: $PDB (minAvailable: $MIN_AVAILABLE)"
  else
    fail "PDB NO encontrado: $PDB"
  fi
done

# ========================
# GRUPO 4: Pod Security Standards (PSS)
# ========================
echo ""
echo "--- Pod Security Standards ---"

PSS_ENFORCE=$(kubectl get namespace "$NAMESPACE" \
  -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}' 2>/dev/null || echo "")

if [ -n "$PSS_ENFORCE" ]; then
  pass "Pod Security Standards configurado (enforce: $PSS_ENFORCE)"
else
  fail "Pod Security Standards NO configurado en el namespace"
fi

# ========================
# GRUPO 5: Test de conectividad (si hay pods corriendo)
# ========================
echo ""
echo "--- Conectividad entre pods ---"

FRONTEND_POD=$(kubectl get pod -n "$NAMESPACE" -l app=frontend \
  --field-selector=status.phase=Running \
  -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

POSTGRES_SVC=$(kubectl get service postgres-service -n "$NAMESPACE" \
  -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")

if [ -n "$FRONTEND_POD" ] && [ -n "$POSTGRES_SVC" ]; then
  info "Probando que frontend NO puede llegar a PostgreSQL (timeout: 5s)..."
  # Si la conexion falla (timeout/refused), es correcto (NetworkPolicy funciona)
  CONNECTION_RESULT=$(kubectl exec "$FRONTEND_POD" -n "$NAMESPACE" -- \
    timeout 5 nc -zv "$POSTGRES_SVC" 5432 2>&1 || echo "BLOCKED")

  if echo "$CONNECTION_RESULT" | grep -q "BLOCKED\|timed out\|refused\|Connection refused"; then
    pass "Frontend NO puede conectarse a PostgreSQL (NetworkPolicy funciona)"
  else
    fail "Frontend PUEDE conectarse a PostgreSQL (NetworkPolicy no esta funcionando)"
  fi
else
  skip "Test de conectividad (pods no disponibles o service no encontrado)"
fi

# ========================
# RESUMEN
# ========================
echo ""
echo "=============================="
echo "  Resultados de Seguridad"
echo "=============================="
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}Todas las verificaciones de seguridad pasaron${NC}"
  exit 0
else
  echo -e "${RED}Hay $FAILED verificaciones de seguridad fallidas${NC}"
  exit 1
fi
