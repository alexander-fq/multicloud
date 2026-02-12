# Resumen de Configuración IAM - GovTech

## Estructura Creada

```
Account: 835960996869
Region: us-east-1

IAM Resources
├── Custom Policies (9)
│   ├── GovTech-ECR-Admin
│   ├── GovTech-Terraform-State
│   ├── GovTech-RDS-Admin
│   ├── GovTech-EKS-Deploy
│   ├── GovTech-ECR-ReadOnly
│   ├── GovTech-Secrets-Read
│   ├── GovTech-CICD-Access
│   ├── GovTech-Monitoring
│   └── GovTech-PermissionBoundary
│
├── Groups (3)
│   ├── GovTech-Infrastructure
│   │   ├── Policies:
│   │   │   ├── AmazonEC2FullAccess (AWS Managed)
│   │   │   ├── AmazonVPCFullAccess (AWS Managed)
│   │   │   ├── AmazonEKSClusterPolicy (AWS Managed)
│   │   │   ├── GovTech-ECR-Admin
│   │   │   ├── GovTech-Terraform-State
│   │   │   └── GovTech-RDS-Admin
│   │   └── Members:
│   │       └── collab-infrastructure
│   │
│   ├── GovTech-Deployment
│   │   ├── Policies:
│   │   │   ├── AmazonEKSWorkerNodePolicy (AWS Managed)
│   │   │   ├── AmazonEKS_CNI_Policy (AWS Managed)
│   │   │   ├── GovTech-EKS-Deploy
│   │   │   ├── GovTech-ECR-ReadOnly
│   │   │   └── GovTech-Secrets-Read
│   │   └── Members:
│   │       └── collab-deployment
│   │
│   └── GovTech-DevOps
│       ├── Policies:
│       │   ├── CloudWatchFullAccess (AWS Managed)
│       │   ├── GovTech-CICD-Access
│       │   └── GovTech-Monitoring
│       └── Members:
│           └── collab-devops
│
└── Users (3)
    ├── collab-infrastructure
    │   ├── Group: GovTech-Infrastructure
    │   ├── Permission Boundary: GovTech-PermissionBoundary
    │   ├── Access: Programmatic + Console
    │   └── MFA: Pending setup
    │
    ├── collab-deployment
    │   ├── Group: GovTech-Deployment
    │   ├── Permission Boundary: GovTech-PermissionBoundary
    │   ├── Access: Programmatic + Console
    │   └── MFA: Pending setup
    │
    └── collab-devops
        ├── Group: GovTech-DevOps
        ├── Permission Boundary: GovTech-PermissionBoundary
        ├── Access: Programmatic + Console
        └── MFA: Pending setup
```

## Matriz de Permisos

| Servicio | collab-infrastructure | collab-deployment | collab-devops |
|----------|----------------------|-------------------|---------------|
| **IAM Users** | - | - | - |
| **IAM Roles** | Create (EKS) | - | Create (CICD) |
| **EC2** | Full | Read-only | Read-only |
| **VPC** | Full | - | - |
| **EKS** | Create/Modify | kubectl access | Read-only |
| **ECR** | Push/Pull | Pull-only | Push/Pull (CI) |
| **RDS** | Create/Modify | - | - |
| **S3** | Terraform state | - | Artifacts |
| **Secrets Manager** | - | Read (dev/stg) | Full (CICD) |
| **CloudWatch** | Logs | Logs | Full |
| **Billing** | - | - | - |

## Paso a Paso de Ejecución

### 1. Ejecutar Setup

```bash
cd aws/iam
./setup-iam.sh
```

### 2. Output Esperado

```
==========================================
  GovTech IAM Setup Script
  Configuración de Seguridad con Mínimo Privilegio
==========================================

[INFO] Verificando configuración de AWS CLI...
[SUCCESS] AWS CLI configurado correctamente
[INFO] Account ID: 835960996869

========== PASO 1: Crear Políticas Custom ==========

[INFO] Creando política: GovTech-ECR-Admin
[SUCCESS] Política GovTech-ECR-Admin creada
[INFO] Creando política: GovTech-Terraform-State
[SUCCESS] Política GovTech-Terraform-State creada
...

[SUCCESS] Políticas custom creadas

========== PASO 2: Crear Grupos IAM ==========

[INFO] Creando grupo: GovTech-Infrastructure
[SUCCESS] Grupo GovTech-Infrastructure creado
...

[SUCCESS] Grupos IAM creados

========== PASO 3: Adjuntar Políticas a Grupos ==========

[INFO] Configurando grupo GovTech-Infrastructure...
[INFO] Adjuntando política a grupo: GovTech-Infrastructure
[SUCCESS] Política adjuntada a GovTech-Infrastructure
...

[SUCCESS] Políticas adjuntadas a grupos

========== PASO 4: Crear Usuarios IAM ==========

[INFO] Creando usuario: collab-infrastructure
[SUCCESS] Usuario collab-infrastructure creado
...

[SUCCESS] Usuarios IAM creados

========== PASO 5: Asignar Usuarios a Grupos ==========

[INFO] Añadiendo collab-infrastructure al grupo GovTech-Infrastructure
[SUCCESS] Usuario collab-infrastructure añadido a GovTech-Infrastructure
...

[SUCCESS] Usuarios asignados a grupos

========== PASO 6: Aplicar Permission Boundaries ==========

[INFO] Aplicando permission boundary a collab-infrastructure
[SUCCESS] Permission boundary aplicado a collab-infrastructure
...

[SUCCESS] Permission boundaries aplicados

========== PASO 7: Crear Access Keys ==========

¿Deseas crear access keys para los usuarios? (y/n): y

[INFO] Creando access key para collab-infrastructure
[SUCCESS] Access key creado para collab-infrastructure
[INFO] Credenciales guardadas en: credentials-collab-infrastructure.json
...

[WARNING] IMPORTANTE: Guarda los archivos credentials-*.json en un lugar seguro
[WARNING] IMPORTANTE: No los compartas por canales inseguros

========== PASO 8: Crear Console Login (Opcional) ==========

¿Deseas crear console login para los usuarios? (y/n): y

[INFO] Creando console login para collab-infrastructure
[SUCCESS] Console login creado para collab-infrastructure
[WARNING] Password temporal: GovTech2026!TempPass
[INFO] El usuario debe cambiar su password en el primer login
...

==========================================
[SUCCESS] IAM Setup Completado!
==========================================

Resumen de la configuración:

Grupos creados:
  - GovTech-Infrastructure (Colaborador A)
  - GovTech-Deployment (Colaborador B)
  - GovTech-DevOps (Colaborador C)

Usuarios creados:
  - collab-infrastructure
  - collab-deployment
  - collab-devops

Políticas custom creadas: 9
Permission boundaries aplicados: Sí

Próximos pasos:
1. Distribuir credenciales de forma segura a cada colaborador
2. Configurar MFA para cada usuario (recomendado)
3. Revisar CloudTrail para auditoría
4. Ejecutar tests de permisos (ver IAM_SECURITY_POLICIES.md)

Recuerda:
- Los access keys deben rotarse cada 90 días
- Habilitar MFA para mayor seguridad
- Revisar permisos mensualmente
```

### 3. Archivos Generados

Después de ejecutar el script:

```
aws/iam/
├── credentials-collab-infrastructure.json
├── credentials-collab-deployment.json
└── credentials-collab-devops.json
```

**Formato de credentials-*.json**:
```json
{
    "AccessKey": {
        "UserName": "collab-infrastructure",
        "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "Status": "Active",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "CreateDate": "2026-02-12T08:15:00Z"
    }
}
```

### 4. Distribuir Credenciales

**Para Colaborador A (Infrastructure)**:

```
Usuario: collab-infrastructure
AWS Access Key ID: AKIA...
AWS Secret Access Key: wJalr...
Console URL: https://835960996869.signin.aws.amazon.com/console
Console Password (temporal): GovTech2026!TempPass
Region: us-east-1

Permisos:
- EC2, VPC, EKS Cluster, ECR Admin, RDS, S3 (Terraform)

Configuración:
aws configure
[pegar Access Key ID y Secret]
[region: us-east-1]
```

**Para Colaborador B (Deployment)**:

```
Usuario: collab-deployment
AWS Access Key ID: AKIA...
AWS Secret Access Key: wJalr...
Console URL: https://835960996869.signin.aws.amazon.com/console
Console Password (temporal): GovTech2026!TempPass
Region: us-east-1

Permisos:
- EKS kubectl, ECR pull-only, Secrets (dev/stg), CloudWatch logs

Configuración:
aws configure
[pegar Access Key ID y Secret]
[region: us-east-1]
```

**Para Colaborador C (DevOps)**:

```
Usuario: collab-devops
AWS Access Key ID: AKIA...
AWS Secret Access Key: wJalr...
Console URL: https://835960996869.signin.aws.amazon.com/console
Console Password (temporal): GovTech2026!TempPass
Region: us-east-1

Permisos:
- CloudWatch Full, ECR push (CI/CD), Secrets (CICD), S3 artifacts

Configuración:
aws configure
[pegar Access Key ID y Secret]
[region: us-east-1]
```

## Verificación

### Verificar Grupos

```bash
aws iam list-groups
```

Output esperado:
```json
{
    "Groups": [
        {
            "Path": "/",
            "GroupName": "GovTech-Infrastructure",
            "GroupId": "AGPAI...",
            "Arn": "arn:aws:iam::835960996869:group/GovTech-Infrastructure",
            "CreateDate": "2026-02-12T08:15:00Z"
        },
        {
            "Path": "/",
            "GroupName": "GovTech-Deployment",
            ...
        },
        {
            "Path": "/",
            "GroupName": "GovTech-DevOps",
            ...
        }
    ]
}
```

### Verificar Usuarios

```bash
aws iam list-users
```

### Verificar Políticas de un Grupo

```bash
aws iam list-attached-group-policies --group-name GovTech-Infrastructure
```

Output esperado:
```json
{
    "AttachedPolicies": [
        {
            "PolicyName": "AmazonEC2FullAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
        },
        {
            "PolicyName": "AmazonVPCFullAccess",
            "PolicyArn": "arn:aws:iam::aws:policy/AmazonVPCFullAccess"
        },
        ...
    ]
}
```

### Verificar Permission Boundary

```bash
aws iam get-user --user-name collab-infrastructure
```

Debe mostrar:
```json
{
    "User": {
        "UserName": "collab-infrastructure",
        "PermissionsBoundary": {
            "PermissionsBoundaryType": "Policy",
            "PermissionsBoundaryArn": "arn:aws:iam::835960996869:policy/GovTech-PermissionBoundary"
        },
        ...
    }
}
```

## Tests de Seguridad

### Test 1: collab-infrastructure puede crear ECR repo

```bash
aws ecr create-repository --repository-name test-govtech-repo
```

Debe funcionar ✓

### Test 2: collab-infrastructure NO puede crear usuarios

```bash
aws iam create-user --user-name hacker
```

Debe fallar con AccessDenied ✓

### Test 3: collab-deployment puede listar EKS

```bash
aws eks list-clusters
```

Debe funcionar ✓

### Test 4: collab-deployment NO puede push a ECR

```bash
aws ecr put-image --repository-name test-repo --image-manifest ...
```

Debe fallar con AccessDenied ✓

### Test 5: collab-devops puede crear alarmas

```bash
aws cloudwatch put-metric-alarm --alarm-name test-alarm ...
```

Debe funcionar ✓

### Test 6: Ningún colaborador puede trabajar fuera de us-east-1

```bash
aws ec2 describe-instances --region us-west-2
```

Debe fallar con AccessDenied (boundary policy) ✓

## Limpieza

Para eliminar TODA la configuración:

```bash
cd aws/iam
./cleanup-iam.sh

# Confirmar escribiendo: DELETE
```

Esto eliminará:
- 3 usuarios
- 3 grupos
- 9 políticas custom
- Access keys
- Archivos credentials-*.json locales

## Próximos Pasos

1. [✓] Ejecutar setup-iam.sh
2. [ ] Distribuir credenciales a colaboradores
3. [ ] Habilitar MFA para cada usuario
4. [ ] Configurar CloudTrail (si no está ya)
5. [ ] Ejecutar tests de permisos
6. [ ] Documentar passwords temporales de forma segura
7. [ ] Calendario de rotación de keys (90 días)

## Recursos

- [README.md](README.md) - Documentación completa
- [setup-iam.sh](setup-iam.sh) - Script de configuración
- [cleanup-iam.sh](cleanup-iam.sh) - Script de limpieza
- [../../docs/IAM_SECURITY_POLICIES.md](../../docs/IAM_SECURITY_POLICIES.md) - Documento de diseño

---

**Creado**: 2026-02-12
**Versión**: 1.0.0
**Estado**: Listo para ejecutar
