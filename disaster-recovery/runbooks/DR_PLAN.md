# Plan de Contingencia y Recuperacion ante Desastres
# GovTech Cloud Migration Platform

**Version:** 1.0
**RTO (Recovery Time Objective):** 4 horas (sistema completamente restaurado)
**RPO (Recovery Point Objective):** 24 horas (maxima perdida de datos aceptable)

---

## 1. Objetivos

| Metrica | Objetivo | Descripcion |
|---|---|---|
| RTO | 4 horas | Tiempo maximo para restaurar el servicio tras un desastre |
| RPO | 24 horas | Datos mas antiguos que podriamos perder (backups diarios a las 2am UTC) |
| Disponibilidad objetivo | 99.9% | Maximo 8.7 horas de downtime al año |

---

## 2. Escenarios de Desastre

### 2.1 Falla de Availability Zone (AZ)
**Probabilidad:** Baja | **Impacto:** Alto

AWS Multi-AZ mitiga este escenario:
- **RDS**: failover automatico a replica standby en otra AZ (1-2 minutos)
- **EKS**: los pods se redistribuyen a nodos en otras AZs automaticamente
- **ALB**: siempre distribuye entre multiples AZs

**Accion requerida:** Ninguna. El failover es automatico.

### 2.2 Falla de Region Completa (us-east-1)
**Probabilidad:** Muy baja | **Impacto:** Critico

Este escenario no tiene mitigacion automatica con la arquitectura actual (single-region). El proceso de recuperacion es manual usando los backups en S3.

**Ver Procedimiento 1: Restauracion de Region Completa**

### 2.3 Corrupcion o Eliminacion Accidental de Base de Datos
**Probabilidad:** Media | **Impacto:** Alto

RDS tiene backups automaticos diarios con retencion de 30 dias (produccion) y 3 dias (dev).

**Ver Procedimiento 2: Restauracion de Base de Datos**

### 2.4 Compromiso de Seguridad (Breach)
**Probabilidad:** Baja | **Impacto:** Muy Alto

**Ver Procedimiento 3: Respuesta a Breach**

### 2.5 Falla del Cluster EKS
**Probabilidad:** Baja | **Impacto:** Alto

El control plane de EKS es gestionado por AWS (99.95% SLA). Solo podrian fallar los nodos worker.

**Accion:** Los nodos se reemplazan automaticamente via Node Group. Si el Node Group entero falla, recrearlo con Terraform.

### 2.6 Eliminacion Accidental de Infraestructura Terraform
**Probabilidad:** Baja | **Impacto:** Alto

El estado de Terraform en S3 tiene versionado habilitado. Se puede recuperar el estado anterior.

---

## 3. Procedimientos de Recuperacion

### Procedimiento 1: Restauracion de Region Completa

**Tiempo estimado:** 2-4 horas
**Pre-requisito:** Acceso a otra region de AWS, backups en S3 replicados

```
Fase 1: Infraestructura (45-90 min)
  └── terraform apply en us-east-2 (cambiar region)

Fase 2: Base de datos (30-60 min)
  └── Restaurar desde snapshot de RDS (copiar snapshot entre regiones primero)

Fase 3: Aplicacion (15-30 min)
  └── kubectl apply en nuevo cluster

Fase 4: DNS (5-15 min)
  └── Actualizar Route53 a nuevo ALB
```

**Ejecutar:**
```bash
chmod +x disaster-recovery/scripts/restore-infrastructure.sh
./disaster-recovery/scripts/restore-infrastructure.sh --region us-east-2 --environment prod
```

### Procedimiento 2: Restauracion de Base de Datos

**Tiempo estimado:** 20-45 minutos
**Pre-requisito:** Identificar el snapshot a restaurar

```bash
# Listar snapshots disponibles
aws rds describe-db-snapshots \
  --db-instance-identifier govtech-prod-postgres \
  --query 'DBSnapshots[*].{Fecha:SnapshotCreateTime,ID:DBSnapshotIdentifier}' \
  --output table

# Ejecutar restauracion
chmod +x disaster-recovery/scripts/restore-database.sh
./disaster-recovery/scripts/restore-database.sh \
  --snapshot <SNAPSHOT_ID> \
  --environment prod
```

### Procedimiento 3: Respuesta a Breach de Seguridad

**Tiempo de reaccion inicial:** 15 minutos

```
T+0 min:  Deteccion (CloudWatch alarm o reporte)
T+5 min:  Notificacion al equipo (llamada, no solo mensaje)
T+15 min: Contencion - revocar credenciales comprometidas
T+30 min: Evaluacion de alcance
T+60 min: Decision: restaurar desde backup limpio o parchear
T+120min: Notificacion a partes afectadas si hay datos comprometidos
```

**Scripts:**
```bash
# Revocar credenciales y aislar
chmod +x disaster-recovery/scripts/security-response.sh
./disaster-recovery/scripts/security-response.sh --user <usuario-comprometido>
```

---

## 4. Matriz de Responsabilidades

| Escenario | Quien detecta | Quien responde | Quien aprueba restauracion |
|---|---|---|---|
| Falla de AZ | CloudWatch automatico | - | - |
| Falla de region | On-call / CloudWatch | Infraestructura + DevOps | Lider del proyecto |
| Corrupcion de BD | DevOps / Usuarios | Infraestructura | Lider del proyecto |
| Breach de seguridad | DevOps / Security | Todo el equipo | Lider + Notificar autoridades |

---

## 5. Pruebas del Plan (DR Drills)

Este plan debe probarse periodicamente para verificar que funciona:

| Prueba | Frecuencia | Tipo |
|---|---|---|
| Restauracion de backup de BD en entorno dev | Mensual | Automatizada |
| Failover de RDS (Multi-AZ) | Trimestral | Simulada |
| Recreacion del cluster EKS en dev | Semestral | Manual |
| Simulacro completo de desastre de region | Anual | Manual |

**Comando para probar restauracion de backup:**
```bash
./disaster-recovery/scripts/restore-database.sh --snapshot latest --environment dev --verify-only
```

---

## 6. Contactos de Emergencia

| Rol | Responsabilidad en DR | Medio de contacto |
|---|---|---|
| Lider del proyecto | Decision final de restauracion | Telefono (disponible 24/7) |
| Infraestructura | Terraform, VPC, RDS | Slack #govtech-infra |
| Deployment | Kubernetes, aplicacion | Slack #govtech-deploy |
| DevOps | CI/CD, monitoreo | Slack #govtech-devops |

**Escalacion:** si despues de 30 minutos no hay progreso, escalar al siguiente nivel.

---

## 7. Checklist de Recuperacion

Ante cualquier escenario:

- [ ] Identificar y documentar el incidente (hora, causa probable, alcance)
- [ ] Notificar al equipo y al lider del proyecto
- [ ] Determinar el escenario de desastre (1-6 de la seccion 2)
- [ ] Ejecutar el procedimiento correspondiente
- [ ] Verificar que el servicio esta restaurado (`tests/e2e/test-deployment.sh`)
- [ ] Comunicar a los usuarios si hubo tiempo de inactividad
- [ ] Documentar el post-mortem (causa raiz, acciones tomadas, prevencion futura)
- [ ] Actualizar este plan si se encontraron brechas en el procedimiento
