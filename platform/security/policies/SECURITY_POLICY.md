# Politica de Seguridad - GovTech Cloud Migration Platform

**Version:** 1.0
**Fecha:** 2026-02
**Clasificacion:** Confidencial - Uso Interno

---

## 1. Alcance

Esta politica aplica a toda la infraestructura cloud del proyecto GovTech Cloud Migration Platform, incluyendo:
- Infraestructura AWS (VPC, EKS, RDS, S3, ECR, IAM)
- Codigo fuente y pipelines CI/CD (GitHub Actions)
- Datos de ciudadanos procesados por la plataforma
- Personal con acceso a los sistemas

---

## 2. Principios Fundamentales

### 2.1 Minimo Privilegio (Least Privilege)
Cada usuario, servicio y proceso recibe **unicamente los permisos necesarios** para su funcion, ni mas ni menos.

**Implementacion:**
- IAM roles especificos por funcion (no usar root o AdministratorAccess)
- Politicas IAM con condiciones de tiempo y origen de IP donde aplique
- IRSA (IAM Roles for Service Accounts) para pods: sin credenciales en variables de entorno
- Revision trimestral de permisos (access reviews)

### 2.2 Defensa en Profundidad (Defense in Depth)
Multiples capas de seguridad. Si una falla, las demas contienen el impacto.

**Capas implementadas:**
1. Red: VPC, Security Groups, NACLs, recursos privados
2. Identidad: IAM con MFA, roles temporales
3. Aplicacion: autenticacion JWT, validacion de inputs
4. Datos: cifrado en transito (TLS 1.2+) y en reposo (AES-256)
5. Deteccion: CloudTrail, CloudWatch, Prometheus alertas

### 2.3 Cifrado Obligatorio
Todos los datos deben estar cifrados tanto en transito como en reposo.

| Dato | En transito | En reposo |
|---|---|---|
| Trafico web | TLS 1.2+ (ALB) | N/A |
| Comunicacion interna K8s | TLS (kubelet, API server) | N/A |
| Base de datos RDS | SSL forzado | AES-256 (storage_encrypted=true) |
| Archivos S3 | HTTPS obligatorio | AES-256 (SSE-S3) |
| Secrets K8s | etcd cifrado | AES-256 (gestionado por EKS) |
| Backups | Transferencia HTTPS | Heredan cifrado de S3 |

### 2.4 Trazabilidad Total (Auditability)
Toda accion sobre los sistemas debe ser rastreable a un usuario o servicio especifico, con timestamp.

**Implementacion:**
- CloudTrail habilitado en todas las regiones
- Logs de acceso a S3 habilitados
- VPC Flow Logs para trafico de red
- Auditd en nodos EKS (playbook Ansible)
- Logs de aplicacion en CloudWatch con retencion de 90 dias

---

## 3. Control de Acceso

### 3.1 Acceso a AWS

| Perfil | Herramienta | MFA | Nivel de acceso |
|---|---|---|---|
| Administrador de cuenta | Consola AWS + CLI | Obligatorio | AdministratorAccess (solo emergencias) |
| Colaborador Infraestructura | CLI con rol temporal | Obligatorio | GovTech-Infrastructure policies |
| Colaborador Deployment | CLI + Consola | Obligatorio | GovTech-Deployment policies |
| Colaborador DevOps | CLI + Consola | Obligatorio | GovTech-DevOps policies |
| CI/CD (GitHub Actions) | Access Key en GitHub Secrets | N/A (no interactivo) | Permisos minimos para build/deploy |
| Pods de Kubernetes | IRSA (rol temporal automatico) | N/A | Solo al recurso especifico (S3, etc.) |

**Reglas:**
- Las Access Keys de IAM se rotan cada **90 dias**
- Se usa AWS SSO (Identity Center) en lugar de usuarios IAM cuando sea posible
- Acceso a produccion requiere aprobacion de al menos 2 personas
- Sesiones CLI tienen duracion maxima de 1 hora (STS)

### 3.2 Acceso a Kubernetes

```
Nivel 1 (Desarrollo): kubectl get/describe - namespace govtech
Nivel 2 (Deployment): kubectl apply, rollout - namespace govtech
Nivel 3 (Administrador): kubectl cluster-admin - todo el cluster
```

- Kubectl se configura via `aws eks update-kubeconfig` (heredando permisos IAM)
- No hay passwords de Kubernetes: la autenticacion es via AWS IAM
- `kubectl exec` en produccion requiere aprobacion previa (audit log)

### 3.3 Acceso SSH a Nodos

- SSH habilitado **solo via bastion host**, nunca acceso directo desde internet
- Autenticacion **exclusivamente por llave SSH** (password auth deshabilitado)
- Las llaves SSH se almacenan en AWS Secrets Manager, nunca en disco no cifrado
- Acceso SSH a produccion es excepcional y se registra en el ticket correspondiente

---

## 4. Gestion de Secrets y Credenciales

### 4.1 Lo que NUNCA se debe hacer
- Commitear credenciales, tokens, passwords o llaves en git
- Usar variables de entorno en archivos `.env` commiteados
- Hardcodear IDs de cuenta, ARNs especificos en codigo publico
- Compartir Access Keys entre personas o servicios

### 4.2 Como manejar secrets correctamente

| Tipo de secret | Donde almacenar | Como acceder |
|---|---|---|
| Passwords de BD | AWS Secrets Manager | Desde el codigo via SDK, o via External Secrets en K8s |
| Tokens de CI/CD | GitHub Secrets | Inyectados automaticamente en el workflow |
| Credenciales de pods | IRSA (rol IAM) | Automatico, sin credenciales en el pod |
| Llaves SSH | AWS Secrets Manager o SSM Parameter Store | Descargados al crear el bastion |
| Certificados TLS | AWS ACM | Referenciados por ARN en el Ingress |
| Secrets de Kubernetes | kubectl create secret | Base64 en etcd cifrado |

### 4.3 Rotacion de credenciales

| Credencial | Frecuencia | Responsable |
|---|---|---|
| Access Keys IAM | 90 dias | Cada colaborador |
| DB Password | 180 dias o ante sospecha | Infraestructura |
| JWT Secret | 1 año o ante sospecha | DevOps |
| Llaves SSH | 1 año | Infraestructura |
| Certificados TLS (ACM) | Automatico (AWS) | N/A |

---

## 5. Seguridad de la Red

### 5.1 Principio de Red
Ningun recurso critico (EKS nodes, RDS) es accesible directamente desde internet.

```
Internet → ALB (publica) → Pods en subnets privadas → RDS en subnets privadas
```

### 5.2 Security Groups

| Recurso | Ingress permitido | Egress |
|---|---|---|
| ALB | 0.0.0.0/0 puertos 80, 443 | Pods en subnets privadas |
| EKS Nodes | ALB (pod traffic), cluster (API) | 0.0.0.0/0 (para descargas) |
| RDS | Solo desde SG de EKS, puerto 5432 | Ninguno |
| Bastion | IP admin especifica, puerto 22 | EKS nodes puerto 22 |

### 5.3 Trafico Bloqueado por Defecto
- Acceso publico a RDS: BLOQUEADO
- Acceso publico a buckets S3: BLOQUEADO (Block Public Access activado)
- SSH directo a nodos EKS: BLOQUEADO (solo via bastion)
- Puertos no listados en Security Groups: BLOQUEADO implicitamente

---

## 6. Seguridad de Contenedores

### 6.1 Imagenes Docker
- Usar imagenes base oficiales y minimas (`alpine`, `distroless`)
- Escaneo de vulnerabilidades obligatorio antes de push a produccion (Trivy en CI)
- Imagenes se almacenan en ECR privado, no en Docker Hub
- Tags de imagen incluyen el commit SHA (trazabilidad)
- `latest` tag no se usa en produccion (se usa el SHA especifico)

### 6.2 Pods de Kubernetes
- `runAsNonRoot: true` - los pods no corren como root
- `readOnlyRootFilesystem: true` donde sea posible
- `allowPrivilegeEscalation: false`
- Network Policies para limitar comunicacion entre pods
- Seccomp profiles habilitados (`seccompDefault: true` en kubelet)
- Sin capabilities adicionales (`drop: ["ALL"]`)

---

## 7. Respuesta a Incidentes

### 7.1 Clasificacion de Incidentes

| Severidad | Descripcion | Tiempo de respuesta | Ejemplo |
|---|---|---|---|
| P1 - Critico | Sistema de produccion caido o datos comprometidos | 15 minutos | Breach de datos, DB inaccesible |
| P2 - Alto | Degradacion significativa del servicio | 1 hora | Latencia alta, pods reiniciandose |
| P3 - Medio | Funcionalidad parcialmente afectada | 4 horas | Un endpoint lento |
| P4 - Bajo | Problema menor, no afecta usuarios | 24 horas | Warning en logs |

### 7.2 Pasos ante un Incidente de Seguridad

1. **Detectar**: CloudWatch alarm o reporte de usuario
2. **Contener**: revocar credenciales comprometidas, aislar pods afectados
3. **Evaluar**: determinar alcance y datos afectados
4. **Notificar**: al equipo y, si hay datos de ciudadanos afectados, a las autoridades correspondientes
5. **Remediar**: aplicar fix, rotar credenciales, parchear vulnerabilidad
6. **Post-mortem**: documentar causa raiz y acciones preventivas

### 7.3 Aislamiento de Emergencia

```bash
# Revocar acceso IAM de un usuario comprometido
aws iam delete-access-key --user-name <usuario> --access-key-id <key-id>
aws iam attach-user-policy --user-name <usuario> --policy-arn arn:aws:iam::aws:policy/AWSDenyAll

# Aislar un pod comprometido en Kubernetes
kubectl label pod <pod-name> -n govtech quarantine=true
kubectl taint node <node-name> quarantine=true:NoSchedule

# Revocar token de servicio
kubectl delete secret <secret-name> -n govtech
```

---

## 8. Cumplimiento Normativo

| Norma | Requisito relevante | Como lo cumplimos |
|---|---|---|
| ISO 27001 | Gestion de acceso, cifrado, logs | IAM least privilege, TLS, CloudTrail |
| GDPR (datos de ciudadanos EU) | Proteccion de datos personales, derecho al olvido | Cifrado AES-256, politica de retencion S3 |
| Ley 1581 (Colombia) | Proteccion datos personales | Cifrado, acceso restringido, logs de acceso |
| NIST SP 800-53 | Controles de seguridad para sistemas del gobierno | Auditd, MFA, segmentacion de red |

---

## 9. Revision y Mantenimiento de esta Politica

- Revision semestral o ante cambios significativos de arquitectura
- Cualquier excepcion a esta politica requiere aprobacion documentada
- Responsable: Lider de Infraestructura del proyecto

**Historial de versiones:**

| Version | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-02 | Version inicial |
