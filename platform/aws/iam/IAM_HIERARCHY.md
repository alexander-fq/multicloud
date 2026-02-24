# IAM - Jerarquia de Acceso GovTech

## Aclaracion tecnica

AWS IAM no tiene jerarquia nativa entre grupos. Todos los grupos existen al mismo nivel tecnico dentro de la cuenta. La jerarquia que se describe aqui es **funcional y de riesgo**: define quien debe tener acceso a que, por cuanto tiempo, y que proceso de aprobacion requiere.

## Estructura jerarquica

```
                    [ govtech-admin ]
                    Usuario operador principal
                    Puede pertenecer a cualquier grupo
                            |
        ┌───────────────────┼───────────────────┐
        |                   |                   |
   NIVEL 1             NIVEL 2             NIVEL 3
   Critico            Operacional          Solo lectura
        |                   |                   |
Network-Admin       Container-Deploy    Secrets-ReadOnly
EKS-Admin           ALB-Operator        Monitor-ReadOnly
Database-Admin      CICD-Operator       Security-Auditor
Terraform-Operator
```

## Nivel 1 - Critico

**Grupos:** GovTech-Network-Admin, GovTech-EKS-Admin, GovTech-Database-Admin, GovTech-Terraform-Operator

**Por que es critico:**
Un actor malicioso con acceso a cualquiera de estos grupos puede:
- Eliminar la VPC y dejar toda la infraestructura sin red
- Borrar el cluster EKS y todos sus workloads
- Eliminar o corromper la base de datos de produccion
- Ejecutar `terraform destroy` y eliminar todo en minutos

**Reglas de acceso recomendadas para equipos:**
- Acceso temporal solamente (maximo 8 horas por sesion)
- Requiere aprobacion de al menos un segundo responsable
- MFA obligatorio (preferiblemente hardware: YubiKey)
- Toda accion queda registrada en CloudTrail con alerta inmediata
- Revision semanal de quien tiene acceso activo

## Nivel 2 - Operacional

**Grupos:** GovTech-Container-Deploy, GovTech-ALB-Operator, GovTech-CICD-Operator

**Por que es operacional:**
Un actor malicioso con acceso puede:
- Desplegar una imagen Docker maliciosa en produccion
- Modificar las reglas del ALB para redirigir trafico
- Alterar los pipelines de CI/CD para ejecutar codigo arbitrario

No puede destruir infraestructura directamente, pero puede comprometer la aplicacion y los datos.

**Reglas de acceso recomendadas para equipos:**
- Acceso permanente para quienes trabajan en deploys diarios
- MFA obligatorio
- Revision mensual de accesos activos

## Nivel 3 - Solo lectura

**Grupos:** GovTech-Secrets-ReadOnly, GovTech-Monitor-ReadOnly, GovTech-Security-Auditor

**Por que es el menos riesgoso:**
Un actor malicioso con acceso solo puede:
- Leer credenciales almacenadas en Secrets Manager
- Ver metricas, logs y alertas de CloudWatch
- Leer reportes de seguridad de CloudTrail y GuardDuty

No puede modificar ni eliminar nada. El mayor riesgo es la exfiltracion de informacion.

**Reglas de acceso recomendadas para equipos:**
- Acceso permanente para roles de monitoreo y auditoria
- MFA recomendado
- Revision trimestral de accesos activos

## Como se aplica en la practica

### Operador unico (situacion actual)
El usuario `govtech-admin` pertenece a los 10 grupos simultaneamente porque es el unico operador. En la practica es el equivalente a tener AdministratorAccess dividido por dominio.

### Equipo pequeno (2-5 personas)
```
Persona A (infraestructura):  Nivel 1 completo + Monitor-ReadOnly
Persona B (deployment):       Container-Deploy + ALB-Operator + CICD-Operator
Persona C (operaciones):      Monitor-ReadOnly + Security-Auditor
```

### Equipo mediano (5-15 personas)
```
Arquitecto cloud:     Nivel 1 (temporal, solo para cambios aprobados)
DevOps engineer:      Container-Deploy + CICD-Operator
SRE / On-call:        Monitor-ReadOnly + Secrets-ReadOnly
DBA:                  Database-Admin (temporal para mantenimiento)
Security analyst:     Security-Auditor
```

### Equipo grande / gobierno (15+ personas)
En este caso se recomienda complementar con:
- **AWS IAM Identity Center (SSO):** acceso federado con duracion definida
- **Just-in-Time Access:** los usuarios solicitan acceso a un grupo por N horas y expira automaticamente
- **Separation of Duties:** quien aprueba un deploy no puede ejecutarlo
- **Break-glass account:** cuenta de emergencia con acceso total, sellada y auditada

## Relacion con CloudTrail

Cada accion de cada usuario en cada grupo genera un evento en CloudTrail. La jerarquia permite configurar alertas diferenciadas:

| Nivel | Alerta configurada |
|-------|-------------------|
| Nivel 1 | Alerta INMEDIATA en CloudWatch + notificacion por email |
| Nivel 2 | Registro en CloudTrail + alerta si patron inusual (GuardDuty) |
| Nivel 3 | Solo registro en CloudTrail |
