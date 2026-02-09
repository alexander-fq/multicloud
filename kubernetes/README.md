# Kubernetes Manifests

**95% Cloud-Agnostic Kubernetes Configuration**

This directory contains Kubernetes manifests that work across all managed Kubernetes services.

## Structure (To Be Created)

```
kubernetes/
├── namespace.yaml          # Namespace definition
├── configmap.yaml         # Application configuration
├── secrets.yaml           # Secrets template (DO NOT commit actual secrets)
├── backend/
│   ├── deployment.yaml    # Backend deployment
│   ├── service.yaml       # Backend service
│   └── hpa.yaml          # Horizontal Pod Autoscaler
├── frontend/
│   ├── deployment.yaml    # Frontend deployment
│   ├── service.yaml       # Frontend service
│   └── hpa.yaml          # Horizontal Pod Autoscaler
├── database/
│   ├── statefulset.yaml   # PostgreSQL StatefulSet (optional)
│   ├── service.yaml       # Database service
│   └── pvc.yaml          # Persistent Volume Claim
└── ingress/
    ├── ingress-aws.yaml   # AWS ALB Ingress
    ├── ingress-gcp.yaml   # GCP Load Balancer
    └── ingress-nginx.yaml # Generic NGINX Ingress
```

## Compatibility

- ✅ AWS EKS
- ✅ GCP GKE
- ✅ Azure AKS
- ✅ Oracle OKE
- ✅ Local Kubernetes (minikube, kind)

## Portability: 95%

Only `ingress.yaml` needs minor adjustments per cloud provider.
