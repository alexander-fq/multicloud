# Kubernetes - GovTech Manifiestos

Manifiestos de Kubernetes para desplegar la aplicacion GovTech en EKS.

## Estructura

```
kubernetes/
├── namespace.yaml           # Namespace 'govtech'
├── configmap.yaml           # Variables de entorno no sensibles
├── secrets.yaml.template    # Template para Secrets (NO commitear con valores reales)
├── pvc.yaml                 # PersistentVolumeClaim para PostgreSQL
├── deploy.sh                # Script de despliegue en orden correcto
├── backend/
│   ├── deployment.yaml      # Deployment del backend Node.js
│   ├── service.yaml         # Service ClusterIP para el backend
│   └── hpa.yaml             # Horizontal Pod Autoscaler
├── frontend/
│   ├── deployment.yaml      # Deployment del frontend React/Nginx
│   ├── service.yaml         # Service ClusterIP para el frontend
│   └── hpa.yaml             # Horizontal Pod Autoscaler
├── database/
│   ├── statefulset.yaml     # StatefulSet de PostgreSQL
│   └── service.yaml         # Headless Service + ClusterIP
└── ingress/
    ├── ingress-aws.yaml     # Ingress para AWS ALB (produccion)
    └── ingress-nginx.yaml   # Ingress para NGINX (pruebas locales)
```

## Pre-requisitos

- `kubectl` instalado y configurado
- AWS CLI configurado
- Acceso al cluster EKS
- AWS Load Balancer Controller instalado en el cluster (para ingress-aws.yaml)

## Despliegue Rapido

```bash
# Conectar al cluster
aws eks update-kubeconfig --name govtech-dev --region us-east-1

# Crear el Secret con credenciales (ANTES de ejecutar deploy.sh)
kubectl create secret generic govtech-secrets \
  --from-literal=DB_PASSWORD=<password> \
  --from-literal=DB_USER=govtech_admin \
  --from-literal=DB_NAME=govtech \
  --from-literal=JWT_SECRET=<jwt-secret> \
  -n govtech

# Ejecutar el script de despliegue
chmod +x kubernetes/deploy.sh
./kubernetes/deploy.sh dev
```

## Orden de Aplicacion Manual

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/pvc.yaml
kubectl apply -f kubernetes/database/
kubectl wait --for=condition=ready pod -l app=postgres -n govtech --timeout=300s
kubectl apply -f kubernetes/backend/
kubectl rollout status deployment/backend -n govtech
kubectl apply -f kubernetes/frontend/
kubectl rollout status deployment/frontend -n govtech
kubectl apply -f kubernetes/ingress/ingress-aws.yaml
```

## Comandos Utiles

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

# Ver estado del HPA
kubectl get hpa -n govtech

# Rollback al deployment anterior
kubectl rollout undo deployment/backend -n govtech
kubectl rollout undo deployment/frontend -n govtech

# Ver URL del ingress
kubectl get ingress govtech-ingress -n govtech
```

## Troubleshooting

**Pod en Pending**: sin recursos suficientes o PVC no bound
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
kubectl get pods -n kube-system | grep aws-load-balancer
```

**Backend no conecta a PostgreSQL**: verificar service y secret
```bash
kubectl get service postgres-service -n govtech
kubectl get secret govtech-secrets -n govtech
```

**HPA no escala**: Metrics Server no instalado
```bash
kubectl get apiservice v1beta1.metrics.k8s.io
kubectl top pods -n govtech
```
