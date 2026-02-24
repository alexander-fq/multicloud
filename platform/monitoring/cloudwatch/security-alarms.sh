#!/bin/bash
# ============================================================
# Script: Configurar Alarmas de Seguridad en CloudWatch
# GovTech Cloud
#
# Que hace:
# 1. Habilita CloudTrail (auditoria de todas las llamadas a API de AWS)
# 2. Crea filtros de metricas para eventos de seguridad
# 3. Crea alarmas de CloudWatch que disparan ante eventos criticos
# 4. Configura SNS para notificaciones (email/Slack)
#
# Eventos monitoreados:
# - Root account usage (nunca debe usarse)
# - Cambios en politicas IAM
# - Logins fallidos en la consola
# - Cambios en Security Groups
# - Cambios en VPC / Networking
# - Acceso no autorizado a S3
# - Deshabilitacion de CloudTrail
#
# Uso:
#   export SNS_EMAIL=tu-email@ejemplo.com
#   chmod +x monitoring/cloudwatch/security-alarms.sh
#   ./monitoring/cloudwatch/security-alarms.sh
# ============================================================

set -e

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LOG_GROUP_NAME="/govtech/cloudtrail/logs"
TRAIL_NAME="govtech-security-trail"
SNS_TOPIC_NAME="govtech-security-alerts"
SNS_EMAIL="${SNS_EMAIL:-admin@govtech.example.com}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
log_info "=== Configurando Monitoreo de Seguridad ==="
log_info "Cuenta: $ACCOUNT_ID | Region: $REGION"
echo ""

# ========================
# PASO 1: CREAR SNS TOPIC PARA NOTIFICACIONES
# SNS = Simple Notification Service
# Envia notificaciones a email, SMS, Slack (via Lambda), etc.
# ========================
log_info "--- Paso 1: Crear SNS Topic para alertas ---"

SNS_ARN=$(aws sns create-topic \
  --name "$SNS_TOPIC_NAME" \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text)

log_info "SNS Topic: $SNS_ARN"

# Suscribir email al topic
aws sns subscribe \
  --topic-arn "$SNS_ARN" \
  --protocol email \
  --notification-endpoint "$SNS_EMAIL" \
  --region "$REGION" > /dev/null

log_warn "Se envio email de confirmacion a $SNS_EMAIL - confirmar para recibir alertas"

# ========================
# PASO 2: CREAR CLOUDTRAIL
# CloudTrail registra CADA llamada a la API de AWS:
# quien, cuando, desde donde, que accion realizo
# Es el log de auditoria mas importante en AWS
# ========================
log_info "--- Paso 2: Configurar CloudTrail ---"

S3_BUCKET_TRAIL="govtech-cloudtrail-${ACCOUNT_ID}"

# Crear bucket para los logs de CloudTrail
aws s3 mb "s3://$S3_BUCKET_TRAIL" --region "$REGION" 2>/dev/null || log_info "Bucket ya existe"

# Bucket policy: CloudTrail necesita permiso para escribir en el bucket
aws s3api put-bucket-policy \
  --bucket "$S3_BUCKET_TRAIL" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"AWSCloudTrailAclCheck\",
        \"Effect\": \"Allow\",
        \"Principal\": { \"Service\": \"cloudtrail.amazonaws.com\" },
        \"Action\": \"s3:GetBucketAcl\",
        \"Resource\": \"arn:aws:s3:::$S3_BUCKET_TRAIL\"
      },
      {
        \"Sid\": \"AWSCloudTrailWrite\",
        \"Effect\": \"Allow\",
        \"Principal\": { \"Service\": \"cloudtrail.amazonaws.com\" },
        \"Action\": \"s3:PutObject\",
        \"Resource\": \"arn:aws:s3:::$S3_BUCKET_TRAIL/AWSLogs/$ACCOUNT_ID/*\",
        \"Condition\": {
          \"StringEquals\": { \"s3:x-amz-acl\": \"bucket-owner-full-control\" }
        }
      }
    ]
  }"

# Crear CloudWatch Log Group para los logs de CloudTrail
aws logs create-log-group \
  --log-group-name "$LOG_GROUP_NAME" \
  --region "$REGION" 2>/dev/null || log_info "Log group ya existe"

aws logs put-retention-policy \
  --log-group-name "$LOG_GROUP_NAME" \
  --retention-in-days 365 \
  --region "$REGION"

# Crear IAM role para que CloudTrail pueda escribir en CloudWatch Logs
ROLE_NAME="govtech-cloudtrail-role"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "cloudtrail.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || log_info "Role ya existe"

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "cloudtrail-cloudwatch-policy" \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Action\": [\"logs:CreateLogStream\", \"logs:PutLogEvents\"],
      \"Resource\": \"arn:aws:logs:$REGION:$ACCOUNT_ID:log-group:$LOG_GROUP_NAME:*\"
    }]
  }"

LOG_GROUP_ARN="arn:aws:logs:$REGION:$ACCOUNT_ID:log-group:$LOG_GROUP_NAME"
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

# Crear el trail
aws cloudtrail create-trail \
  --name "$TRAIL_NAME" \
  --s3-bucket-name "$S3_BUCKET_TRAIL" \
  --cloud-watch-logs-log-group-arn "$LOG_GROUP_ARN" \
  --cloud-watch-logs-role-arn "$ROLE_ARN" \
  --include-global-service-events \
  --is-multi-region-trail \
  --enable-log-file-validation \
  --region "$REGION" 2>/dev/null || log_info "Trail ya existe, actualizando..."

# Activar el trail
aws cloudtrail start-logging --name "$TRAIL_NAME" --region "$REGION"
log_info "CloudTrail '$TRAIL_NAME' activo - logs en S3 y CloudWatch"

# ========================
# PASO 3: CREAR FILTROS DE METRICAS Y ALARMAS
# Los filtros buscan patrones en los logs de CloudTrail
# y crean metricas. Las alarmas se disparan cuando la metrica
# supera un umbral (en este caso: > 0 eventos = alarma)
# ========================
log_info "--- Paso 3: Crear alarmas de seguridad ---"

create_security_alarm() {
  local NAME="$1"
  local DESCRIPTION="$2"
  local FILTER_PATTERN="$3"
  local METRIC_NAME="${NAME}-count"

  # Crear filtro de metrica
  aws logs put-metric-filter \
    --log-group-name "$LOG_GROUP_NAME" \
    --filter-name "$NAME" \
    --filter-pattern "$FILTER_PATTERN" \
    --metric-transformations \
      "metricName=$METRIC_NAME,metricNamespace=GovTech/Security,metricValue=1,defaultValue=0" \
    --region "$REGION"

  # Crear alarma
  aws cloudwatch put-metric-alarm \
    --alarm-name "SECURITY-$NAME" \
    --alarm-description "$DESCRIPTION" \
    --metric-name "$METRIC_NAME" \
    --namespace "GovTech/Security" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions "$SNS_ARN" \
    --ok-actions "$SNS_ARN" \
    --region "$REGION"

  echo "  OK: Alarma '$NAME'"
}

# ALARMA 1: Uso de cuenta root
# La cuenta root NUNCA debe usarse en operaciones normales
create_security_alarm \
  "root-account-usage" \
  "CRITICO: Se uso la cuenta root de AWS" \
  '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'

# ALARMA 2: Login fallido en consola
# Multiples fallos pueden indicar ataque de fuerza bruta
create_security_alarm \
  "console-login-failures" \
  "ALTO: Login fallido en consola de AWS" \
  '{ ($.eventName = ConsoleLogin) && ($.errorMessage = "Failed authentication") }'

# ALARMA 3: Cambios en politicas IAM
# Cualquier modificacion de permisos debe ser revisada
create_security_alarm \
  "iam-policy-changes" \
  "ALTO: Se modifico una politica IAM" \
  '{($.eventName=DeleteGroupPolicy)||($.eventName=DeleteRolePolicy)||($.eventName=DeleteUserPolicy)||($.eventName=PutGroupPolicy)||($.eventName=PutRolePolicy)||($.eventName=PutUserPolicy)||($.eventName=CreatePolicy)||($.eventName=DeletePolicy)||($.eventName=CreatePolicyVersion)||($.eventName=DeletePolicyVersion)||($.eventName=SetDefaultPolicyVersion)||($.eventName=AttachRolePolicy)||($.eventName=DetachRolePolicy)||($.eventName=AttachUserPolicy)||($.eventName=DetachUserPolicy)}'

# ALARMA 4: Cambios en Security Groups
# Abrir puertos no planeados es un vector de ataque comun
create_security_alarm \
  "security-group-changes" \
  "ALTO: Se modifico un Security Group" \
  '{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }'

# ALARMA 5: Deshabilitacion de CloudTrail
# Si alguien deshabilita CloudTrail, esta intentando ocultar sus acciones
create_security_alarm \
  "cloudtrail-disabled" \
  "CRITICO: CloudTrail fue deshabilitado" \
  '{ ($.eventName = StopLogging) || ($.eventName = DeleteTrail) || ($.eventName = UpdateTrail) }'

# ALARMA 6: Cambios en VPC
# Cambios en la red pueden exponer recursos privados
create_security_alarm \
  "vpc-changes" \
  "MEDIO: Se modifico la configuracion de VPC" \
  '{ ($.eventName = CreateVpc) || ($.eventName = DeleteVpc) || ($.eventName = ModifyVpcAttribute) || ($.eventName = AcceptVpcPeeringConnection) || ($.eventName = CreateVpcPeeringConnection) || ($.eventName = DeleteVpcPeeringConnection) }'

# ALARMA 7: Acceso denegado a recursos (AccessDenied)
# Muchos AccessDenied pueden indicar un ataque o configuracion incorrecta
create_security_alarm \
  "unauthorized-api-calls" \
  "MEDIO: Multiples llamadas a API denegadas" \
  '{ ($.errorCode = "*UnauthorizedAccess*") || ($.errorCode = "AccessDenied*") }'

# ALARMA 8: Cambios en S3 Block Public Access
# Deshabilitar Block Public Access expone datos al publico
create_security_alarm \
  "s3-public-access-enabled" \
  "CRITICO: Se habilito acceso publico a S3" \
  '{ ($.eventName = PutBucketAcl) || ($.eventName = PutBucketPolicy) || ($.eventName = PutBucketCors) || ($.eventName = DeleteBucketPolicy) }'

# ========================
# RESUMEN
# ========================
echo ""
log_info "=== Monitoreo de Seguridad Configurado ==="
echo ""
echo "CloudTrail: $TRAIL_NAME (multi-region)"
echo "Logs en S3: s3://$S3_BUCKET_TRAIL"
echo "Logs en CloudWatch: $LOG_GROUP_NAME"
echo "Alertas a: $SNS_EMAIL"
echo ""
echo "Alarmas creadas:"
aws cloudwatch describe-alarms \
  --alarm-name-prefix "SECURITY-" \
  --query 'MetricAlarms[*].{Nombre:AlarmName, Estado:StateValue}' \
  --output table \
  --region "$REGION"
echo ""
log_warn "IMPORTANTE: Confirmar la suscripcion de email en $SNS_EMAIL"
log_warn "Sin confirmar, las notificaciones no se envian"
