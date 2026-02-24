# =============================================================
# MODULO: Security - Proteccion de la infraestructura GovTech
# =============================================================
#
# Este modulo implementa CINCO capas de seguridad:
#
# 1. KMS (Key Management Service)
#    - Claves de encriptacion centralizadas y auditadas
#    - Toda la data sensible (DB, S3, logs) encriptada con KMS
#
# 2. CloudTrail
#    - Registro de TODAS las acciones en la cuenta AWS
#    - Quien hizo que, cuando y desde donde
#    - Requerido para compliance gubernamental (FISMA, FedRAMP)
#
# 3. GuardDuty
#    - Sistema de deteccion de intrusiones (IDS) de AWS
#    - Detecta: acceso inusual, mineria de criptomonedas, C2 communication
#    - Analiza logs de VPC Flow, CloudTrail, DNS automaticamente
#
# 4. Security Hub
#    - Centro de control de seguridad unico
#    - Agrega hallazgos de GuardDuty, Macie, Inspector, IAM Access Analyzer
#    - Compara contra frameworks: CIS Benchmarks, PCI-DSS, NIST
#
# 5. WAF (Web Application Firewall)
#    - Filtro de trafico HTTP antes de llegar a la aplicacion
#    - Bloquea: SQL injection, XSS, bots, ataques de fuerza bruta
#    - Se adjunta al ALB (Application Load Balancer)
# =============================================================

# -------------------------------------------------------------
# KMS KEY - Clave de encriptacion maestra del proyecto
# Una clave KMS controla quien puede encriptar/desencriptar
# Los datos encriptados con esta clave son ilegibles sin ella
# -------------------------------------------------------------
resource "aws_kms_key" "govtech_main" {
  description             = "Clave KMS principal para GovTech - encripta DB, S3, Secrets"
  deletion_window_in_days = 30  # Periodo de gracia antes de eliminar definitivamente
  enable_key_rotation     = true  # Rotar la clave automaticamente cada año (mejor practica)

  # Politica de la clave: quien puede usarla
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # La cuenta AWS tiene control total sobre la clave
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        # CloudTrail puede usar la clave para encriptar sus logs
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        # RDS puede encriptar la base de datos con esta clave
        Sid    = "Allow RDS encryption"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-kms-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Alias legible para la clave KMS (en lugar de mostrar el ARN completo)
resource "aws_kms_alias" "govtech_main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.govtech_main.key_id
}

# -------------------------------------------------------------
# CLOUDTRAIL - Auditoria completa de acciones en AWS
#
# CloudTrail registra CADA accion realizada en la cuenta:
# - "El usuario collab-infrastructure creo un EC2 a las 14:30 desde IP X"
# - "El rol github-actions actualizo un deployment a las 16:45"
# - "Alguien intento borrar un bucket S3 y fue denegado"
#
# Los logs van al bucket S3 encriptados con KMS.
# Esenciales para forensics si hay un incidente de seguridad.
# -------------------------------------------------------------
resource "aws_cloudtrail" "govtech_audit" {
  name                          = "${var.project_name}-audit-trail-${var.environment}"
  s3_bucket_name                = var.logs_bucket
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true  # Incluye IAM, STS, etc. (eventos globales)
  is_multi_region_trail         = true  # Captura eventos en TODAS las regiones
  enable_log_file_validation    = true  # Detecta si alguien modifica los logs (integridad)

  # Encriptar logs con nuestra clave KMS
  kms_key_id = aws_kms_key.govtech_main.arn

  # Eventos de gestion: CreateBucket, RunInstances, etc.
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    # Tambien registrar accesos a datos en S3 (quien leyo que archivo)
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]  # Todos los buckets
    }
  }

  # CloudWatch Logs: para alertas en tiempo real (complementa S3)
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = {
    Name        = "${var.project_name}-audit-trail-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Purpose     = "Security audit and compliance"
  }
}

# Log group en CloudWatch para los logs de CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 365 : 90  # 1 año en prod para compliance
  kms_key_id        = aws_kms_key.govtech_main.arn

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# -------------------------------------------------------------
# AWS COST ANOMALY DETECTION
# Detecta gastos inesperados usando machine learning de AWS.
# Casos que detecta: mineria de crypto en EC2, loops de API, mal scaling.
# Critico para gobierno donde los presupuestos son fijos y controlados.
# -------------------------------------------------------------
resource "aws_ce_anomaly_monitor" "govtech" {
  name              = "${var.project_name}-cost-monitor-${var.environment}"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ce_anomaly_subscription" "govtech_alert" {
  name      = "${var.project_name}-cost-alert-${var.environment}"
  frequency = "DAILY"

  monitor_arn_list = [aws_ce_anomaly_monitor.govtech.arn]

  # Alertar solo si el gasto anomalo supera $50 (evita falsas alarmas)
  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["50"]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }

  subscriber {
    type    = "EMAIL"
    address = "devops@govtech.example.com"  # Reemplazar con email real
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# AWS SECRETS MANAGER
# Almacena credenciales de forma segura, encriptadas con KMS.
# Los pods acceden via IRSA sin credenciales en el codigo.
# Cada acceso queda registrado en CloudTrail.
# -------------------------------------------------------------
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/db-credentials"
  description             = "Credenciales PostgreSQL del backend"
  kms_key_id              = aws_kms_key.govtech_main.arn
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-db-credentials-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Valor inicial - actualizar con endpoint real de RDS despues del apply:
# aws secretsmanager put-secret-value \
#   --secret-id govtech/dev/db-credentials \
#   --secret-string '{"username":"govtech_admin","password":"REAL_PW","host":"rds-endpoint"}'
resource "aws_secretsmanager_secret_version" "db_credentials_initial" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = "govtech_admin"
    password = "CHANGE_ME_AFTER_APPLY"
    host     = "POPULATE_AFTER_RDS_CREATION"
    port     = "5432"
    dbname   = "govtech"
  })

  lifecycle {
    ignore_changes = [secret_string]  # No sobreescribir si ya se actualizo manualmente
  }
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}/${var.environment}/jwt-secret"
  description             = "JWT secret key para autenticacion de la API"
  kms_key_id              = aws_kms_key.govtech_main.arn
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-jwt-secret-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Rol IAM para que CloudTrail pueda escribir en CloudWatch
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project_name}-cloudtrail-cloudwatch-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    }]
  })
}

# -------------------------------------------------------------
# GUARDDUTY - Sistema de Deteccion de Intrusiones (IDS)
#
# GuardDuty es el sistema de seguridad inteligente de AWS.
# Analiza continuamente:
# - VPC Flow Logs: trafico de red sospechoso
# - CloudTrail: acciones API inusuales
# - DNS Logs: comunicaciones con dominios maliciosos
# - S3 Data Events: accesos anomalos a datos
#
# Ejemplos de lo que detecta:
# - "Un pod esta enviando trafico a una IP de botnets conocida"
# - "Alguien accedio a la DB desde una IP en Rusia a las 3am"
# - "Se estan extrayendo 500GB de S3 de forma inusual"
# - "Credenciales de AWS estan siendo usadas desde Tor"
# -------------------------------------------------------------
resource "aws_guardduty_detector" "main" {
  enable = true

  # Activar analisis avanzado de S3 (detectar exfiltracion de datos)
  datasources {
    s3_logs {
      enable = true
    }
    # Analisis de comportamiento de EKS
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    # Escaneo de malware en EC2/EKS
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-guardduty-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# SECURITY HUB - Panel de control de seguridad centralizado
#
# Security Hub agrega hallazgos de:
# - GuardDuty (amenazas detectadas)
# - Amazon Inspector (vulnerabilidades en EC2/containers)
# - IAM Access Analyzer (permisos excesivos)
# - Macie (datos sensibles expuestos en S3)
#
# Y los compara contra frameworks de compliance:
# - CIS AWS Foundations Benchmark (mejores practicas AWS)
# - PCI DSS (si se procesan pagos)
# - NIST SP 800-53 (requerido para agencies federales de EEUU)
# -------------------------------------------------------------
resource "aws_securityhub_account" "main" {}

# Activar el standard CIS AWS Foundations Benchmark
resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.4.0"
  depends_on    = [aws_securityhub_account.main]
}

# Activar el standard AWS Foundational Security Best Practices
resource "aws_securityhub_standards_subscription" "aws_best_practices" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/aws-foundational-security-best-practices/v/1.0.0"
  depends_on    = [aws_securityhub_account.main]
}

# Conectar GuardDuty con Security Hub para ver alertas en un solo lugar
resource "aws_securityhub_finding_aggregator" "main" {
  linking_mode = "ALL_REGIONS"  # Agregar hallazgos de todas las regiones
  depends_on   = [aws_securityhub_account.main]
}

# -------------------------------------------------------------
# WAF - Web Application Firewall
#
# El WAF es el "portero" de la aplicacion web.
# Inspecciona cada peticion HTTP ANTES de que llegue a los pods.
# Bloquea automaticamente ataques comunes.
#
# Reglas incluidas (AWS Managed Rules - gratuitas):
# - CommonRuleSet: Proteccion general contra OWASP Top 10
# - KnownBadInputs: Inputs conocidos como maliciosos
# - SQLiRuleSet: Ataques de SQL injection
# - AmazonIpReputationList: IPs conocidas como maliciosas (botnets, Tor)
# - AnonymousIpList: VPNs y proxies (opcional, puede bloquear usuarios legitimos)
# -------------------------------------------------------------
resource "aws_wafv2_web_acl" "govtech" {
  name  = "${var.project_name}-waf-${var.environment}"
  scope = "REGIONAL"  # Para ALB (CLOUDFRONT seria para distribuciones CloudFront)

  default_action {
    allow {}  # Por defecto permitir; las reglas bloquean lo malo
  }

  # REGLA 1: Lista de IPs maliciosas conocidas (Amazon Threat Intelligence)
  rule {
    name     = "AmazonIpReputationList"
    priority = 1  # Prioridad mas alta = se evalua primero

    override_action {
      none {}  # Usar la accion de la regla (bloquear)
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AmazonIpReputationList"
      sampled_requests_enabled   = true
    }
  }

  # REGLA 2: Reglas comunes OWASP Top 10 (XSS, path traversal, etc.)
  rule {
    name     = "CommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # REGLA 3: SQL Injection especificamente
  rule {
    name     = "SQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # REGLA 4: Inputs maliciosos conocidos (Log4Shell, SSRF, etc.)
  rule {
    name     = "KnownBadInputsRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # REGLA 5: Rate limiting - maximo 2000 peticiones por IP en 5 minutos
  # Protege contra ataques de fuerza bruta y DDoS basico
  rule {
    name     = "RateLimitRule"
    priority = 5

    action {
      block {}  # Bloquear IPs que exceden el limite
    }

    statement {
      rate_based_statement {
        limit              = 2000  # Max peticiones en ventana de 5 minutos
        aggregate_key_type = "IP"  # Contar por IP de origen
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Configuracion de logs del WAF (van a S3 para auditoria)
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-${var.environment}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project_name}-waf-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Nota: la asociacion del WAF con el ALB se hace despues de crear el ALB
# aws_wafv2_web_acl_association.main (referencia al ARN del ALB)
# Se comenta aqui porque el ALB lo crea el AWS Load Balancer Controller en K8s
# resource "aws_wafv2_web_acl_association" "alb" {
#   resource_arn = var.alb_arn
#   web_acl_arn  = aws_wafv2_web_acl.govtech.arn
# }

# -------------------------------------------------------------
# ALARMAS CLOUDWATCH para seguridad
# Notifican cuando hay eventos de seguridad importantes
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${var.project_name}-root-account-usage-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "ALERTA: Se uso la cuenta root de AWS. Investigar inmediatamente."
  alarm_actions       = []  # Agregar ARN de SNS topic para notificaciones

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.project_name}-unauthorized-api-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAttemptCount"
  namespace           = "CloudTrailMetrics"
  period              = "300"  # 5 minutos
  statistic           = "Sum"
  threshold           = "5"  # 5 intentos no autorizados en 5 minutos
  alarm_description   = "ALERTA: Multiples llamadas API no autorizadas detectadas."
  alarm_actions       = []

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
