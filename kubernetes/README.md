# Kubernetes - GovTech Manifiestos

Manifiestos de Kubernetes para desplegar la aplicacion GovTech en EKS con seguridad de nivel gubernamental.

## Estructura

```
kubernetes/
├── namespace.yaml           # Namespace 'govtech' con Pod Security Standards
├── configmap.yaml           # Variables de entorno no sensibles
├── secrets.yaml.template    # Template para Secrets (NO commitear con valores reales)
├── pvc.yaml                 # PersistentVolumeClaim para PostgreSQL
├── rbac.yaml                # ServiceAccounts, Roles y RoleBindings (least privilege)
├── network-policies.yaml    # NetworkPolicies zero-trust (deny-all + allow explicito)
├── pdb.yaml                 # PodDisruptionBudgets (disponibilidad en mantenimiento)
├── deploy.sh                # Script de despliegue en orden correcto
├── backend/
│   ├── deployment.yaml      # Deployment del backend Node.js
│   ├── service.yaml         # Service ClusterIP para el backend
│   └── hpa.yaml             # Horizontal Pod Autoscaler (2-10 pods)
├── frontend/
│   ├── deployment.yaml      # Deployment del frontend React/Nginx
│   ├── service.yaml         # Service ClusterIP para el frontend
│   └── hpa.yaml             # Horizontal Pod Autoscaler (2-8 pods)
├── database/
│   ├── statefulset.yaml     # StatefulSet de PostgreSQL
│   └── service.yaml         # Headless Service + ClusterIP
└── ingress/
    ├── ingress-aws.yaml     # Ingress para AWS ALB con SSL (produccion)
    └── ingress-nginx.yaml   # Ingress para NGINX (pruebas locales)
```

## Arquitectura de seguridad

```
Internet
    |
  [WAF]  ← Bloquea SQL injection, XSS, bots, rate limit
    |
  [ALB]  ← HTTPS obligatorio, certificado ACM
    |
  [Ingress] ← Routing: /api → backend, /* → frontend
    |
  [NetworkPolicies] ← Zero-trust: cada pod solo habla con quien necesita
    |
  ┌─────────────────────────────┐
  │  Namespace: govtech          │
  │  Pod Security: baseline      │
  │                              │
  │  frontend → backend → DB     │
  │  (solo esta ruta permitida)  │
  └─────────────────────────────┘
```

## Modelo de seguridad Zero-Trust

| Comunicacion | Permitida | Justificacion |
|---|---|---|
| Internet → frontend | Si (via ALB) | Punto de entrada unico |
| Internet → backend directo | No | Solo via ALB/Ingress |
| frontend → backend | Si | Necesario para /api/* |
| frontend → database | **No** | Frontend no necesita DB |
| backend → database | Si | Queries SQL necesarias |
| database → cualquier pod | **No** | DB solo recibe, no inicia |
| Cualquier pod → internet | Solo HTTPS:443 (backend) | Para AWS APIs via NAT |

## Pre-requisitos

- `kubectl` instalado y configurado
- AWS CLI configurado con permisos EKS
- Acceso al cluster EKS (`aws eks update-kubeconfig`)
- AWS Load Balancer Controller instalado en el cluster

## Despliegue Rapido

```bash
# 1. Conectar al cluster
aws eks update-kubeconfig --name govtech-dev --region us-east-1

# 2. Crear el Secret con credenciales (ANTES de ejecutar deploy.sh)
# En produccion: usar AWS Secrets Manager. En dev: crear manualmente.
kubectl create secret generic govtech-secrets \
  --from-literal=DB_PASSWORD=<password> \
  --from-literal=DB_USER=govtech_admin \
  --from-literal=DB_NAME=govtech \
  --from-literal=JWT_SECRET=<jwt-secret-min-32-chars> \
  -n govtech

# 3. Ejecutar el script de despliegue
chmod +x kubernetes/deploy.sh
./kubernetes/deploy.sh dev
```

## Orden de Aplicacion Manual

```bash
# Base (namespace + RBAC primero, antes que los pods)
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/rbac.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/pdb.yaml

# Almacenamiento y DB
kubectl apply -f kubernetes/pvc.yaml
kubectl apply -f kubernetes/database/
kubectl wait --for=condition=ready pod -l app=postgres -n govtech --timeout=300s

# Aplicacion
kubectl apply -f kubernetes/backend/
kubectl rollout status deployment/backend -n govtech
kubectl apply -f kubernetes/frontend/
kubectl rollout status deployment/frontend -n govtech

# Seguridad de red (aplicar ANTES del ingress)
kubectl apply -f kubernetes/network-policies.yaml

# Exposicion al exterior
kubectl apply -f kubernetes/ingress/ingress-aws.yaml
```

## Comandos de Verificacion de Seguridad

```bash
# Ver NetworkPolicies activas
kubectl get networkpolicies -n govtech

# Ver RBAC
kubectl get serviceaccounts,roles,rolebindings -n govtech

# Ver PodDisruptionBudgets
kubectl get pdb -n govtech

# Verificar que frontend no puede acceder a DB (debe fallar)
kubectl exec -it deploy/frontend -n govtech -- nc -zv postgres-service 5432

# Verificar Pod Security Standards del namespace
kubectl get namespace govtech -o yaml | grep pod-security

# Test completo de seguridad
./tests/security/test-network-policies.sh govtech
```

## Comandos Utiles de Operacion

```bash
# Ver todos los recursos
kubectl get all -n govtech

# Ver logs en tiempo real
kubectl logs -f deploy/backend -n govtech
kubectl logs -f deploy/frontend -n govtech

# Ejecutar shell en un pod
kubectl exec -it deploy/backend -n govtech -- sh

# Ver uso de recursos
kubectl top pods -n govtech

# Ver estado del HPA (auto-scaling)
kubectl get hpa -n govtech

# Rollback al deployment anterior
kubectl rollout undo deployment/backend -n govtech
kubectl rollout undo deployment/frontend -n govtech

# Ver URL del ingress (ALB)
kubectl get ingress govtech-ingress -n govtech
```

## Troubleshooting

**Pod en Pending**: sin recursos o PVC no bound
```bash
kubectl describe pod <pod> -n govtech
```

**Pod en CrashLoopBackOff**: error en la aplicacion
```bash
kubectl logs <pod> -n govtech --previous
```

**Ingress sin ADDRESS**: el ALB Controller no pudo crear el ALB
```bash
kubectl describe ingress govtech-ingress -n govtech
kubectl logs -n kube-system deploy/aws-load-balancer-controller
```

**Pod rechazado por Pod Security Standards**: el pod no cumple las politicas
```bash
kubectl describe pod <pod> -n govtech  # Ver la razon del rechazo
# Revisar que el pod no corra como root ni monte hostPath
```

**NetworkPolicy bloqueando trafico legitimo**: revisar las reglas
```bash
kubectl describe networkpolicy <policy> -n govtech
# Agregar regla allow si el trafico es legitimo
```
