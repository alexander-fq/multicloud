# ============================================================
# MODULO: DATABASE (RDS PostgreSQL)
# Colaborador A - Semana 3
#
# Que hace este archivo:
# - Crea un grupo de subnets privadas para RDS (solo accesible internamente)
# - Configura parametros de PostgreSQL 15
# - Crea instancia RDS Multi-AZ para alta disponibilidad
# - Habilita backups automaticos y encryption at rest
# - Configura Enhanced Monitoring (metricas cada 60s)
# ============================================================

# ----------------------------------------
# SUBNET GROUP
# RDS necesita saber en que subnets puede desplegarse
# Usamos subnets PRIVADAS (sin acceso desde internet)
# ----------------------------------------
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

# ----------------------------------------
# PARAMETER GROUP
# Configuracion personalizada de PostgreSQL
# Similar a un postgresql.conf pero manejado por AWS
# ----------------------------------------
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.project_name}-${var.environment}-postgres15"
  family = "postgres15"

  # Habilitar logging de queries lentas (mas de 1 segundo)
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  # Habilitar logging de conexiones
  parameter {
    name  = "log_connections"
    value = "1"
  }

  # Timezone UTC para consistencia con Kubernetes
  parameter {
    name  = "timezone"
    value = "UTC"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-postgres15"
    Environment = var.environment
  }
}

# ----------------------------------------
# RDS INSTANCE
# Motor: PostgreSQL 15
# Multi-AZ: true en produccion, false en dev (costo)
# Encrypted: siempre true (buena practica)
# ----------------------------------------
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-postgres"

  # Motor de base de datos
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  # Almacenamiento
  # gp3 es mas rapido y economico que gp2 desde 2021
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true  # Encryption at rest (OBLIGATORIO para GovTech)

  # Credenciales
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Red
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]
  publicly_accessible    = false  # NUNCA exponer RDS a internet

  # Configuracion
  parameter_group_name = aws_db_parameter_group.postgres.name

  # Alta Disponibilidad
  # Multi-AZ: RDS mantiene una replica sincrona en otra AZ
  # Si la AZ principal falla, failover automatico en ~1-2 minutos
  multi_az = var.multi_az

  # Backups automaticos
  # retention_period = dias que se guardan los backups
  # backup_window = ventana de tiempo (UTC) cuando se hace el backup
  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"    # 3am-4am UTC
  maintenance_window      = "Mon:04:00-Mon:05:00"  # Lunes 4am UTC

  # Actualizaciones automaticas de version menor (ej: 15.4 → 15.5)
  auto_minor_version_upgrade = true

  # Deletion protection: evita borrar por accidente en produccion
  deletion_protection = var.environment == "prod" ? true : false

  # En dev: skip final snapshot (no queremos snapshots al destruir)
  # En prod: crear snapshot final antes de destruir
  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment != "dev" ? "${var.project_name}-${var.environment}-final-snapshot" : null

  # Enhanced Monitoring: metricas del OS cada 60 segundos
  # Util para ver CPU, memoria, disk I/O del servidor subyacente
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights: analisis de queries (gratuito 7 dias)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-postgres"
    Environment = var.environment
  }
}

# ----------------------------------------
# IAM ROLE PARA ENHANCED MONITORING
# RDS necesita permiso para enviar metricas del OS a CloudWatch
# Es un rol especial que RDS asume internamente
# ----------------------------------------
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-monitoring"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
