# ============================================================
# MODULO: STORAGE (S3)
# Colaborador A - Semana 3
#
# Que hace este archivo:
# - Crea bucket S3 para archivos de la aplicacion (uploads, reportes, etc.)
# - Habilita versionado para recuperacion de archivos borrados
# - Configura lifecycle rules para mover archivos viejos a almacenamiento mas barato
# - Bloquea todo acceso publico (archivos solo accesibles via IAM)
# - Crea IAM role para que los pods de Kubernetes accedan al bucket via IRSA
# ============================================================

# ----------------------------------------
# BUCKET PRINCIPAL DE APLICACION
# Para guardar: uploads de usuarios, reportes PDF, exports de datos
# ----------------------------------------
resource "aws_s3_bucket" "app_storage" {
  bucket = "${var.project_name}-${var.environment}-app-storage-${var.aws_account_id}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-storage"
    Environment = var.environment
    Purpose     = "application-storage"
  }
}

# ----------------------------------------
# BLOQUEAR ACCESO PUBLICO
# CRITICO: ningun archivo debe ser publico por defecto
# Evita filtraciones de datos accidentales
# ----------------------------------------
resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ----------------------------------------
# VERSIONADO
# Guarda todas las versiones de cada archivo
# Si alguien borra un archivo por error, podemos recuperarlo
# ----------------------------------------
resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ----------------------------------------
# ENCRYPTION AT REST
# Todos los archivos se guardan encriptados con AES-256
# Transparente para la aplicacion, AWS lo maneja automaticamente
# ----------------------------------------
resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true  # Reduce costos de KMS
  }
}

# ----------------------------------------
# LIFECYCLE RULES
# Mueve archivos automaticamente a clases de storage mas baratas
# con el tiempo. S3 tiene diferentes "tiers" de precio:
#   - Standard: acceso frecuente, mas caro
#   - Standard-IA: acceso poco frecuente, 40% mas barato
#   - Glacier: archivado, 70% mas barato pero lento para acceder
# ----------------------------------------
resource "aws_s3_bucket_lifecycle_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  # Regla 1: Archivos normales
  rule {
    id     = "move-to-ia-then-glacier"
    status = "Enabled"

    filter {
      prefix = ""  # Aplica a todos los archivos
    }

    # Despues de 30 dias: mover a Infrequent Access (mas barato)
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Despues de 90 dias: archivar en Glacier (muy barato, acceso lento)
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Despues de 365 dias: borrar automaticamente (ajustar segun politica de retencion)
    expiration {
      days = 365
    }

    # Borrar versiones antiguas despues de 30 dias
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  # Regla 2: Archivos temporales (uploads incompletos)
  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"

    filter {
      prefix = ""
    }

    # Uploads multipart que no se completaron en 7 dias se borran
    # Evita cobros por uploads abandonados
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ----------------------------------------
# CORS CONFIGURATION
# Permite que el frontend (React) suba archivos directamente a S3
# sin pasar por el backend (mas eficiente para archivos grandes)
# ----------------------------------------
resource "aws_s3_bucket_cors_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ----------------------------------------
# IAM ROLE PARA PODS (IRSA)
# IRSA = IAM Roles for Service Accounts
#
# Como funciona:
# 1. Kubernetes tiene un "service account" para el backend
# 2. Este IAM role tiene una condicion especial que permite
#    que ese service account asuma el rol
# 3. Los pods del backend asumen el rol automaticamente
# 4. Sin necesidad de credenciales en variables de entorno
# ----------------------------------------
resource "aws_iam_role" "s3_access" {
  name = "${var.project_name}-${var.environment}-s3-access"

  # Trust policy: quien puede asumir este rol
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn  # El OIDC provider del cluster EKS
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          # Solo el service account 'backend' en el namespace 'govtech' puede asumir este rol
          "${var.oidc_provider_url}:sub" = "system:serviceaccount:govtech:backend"
          "${var.oidc_provider_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-s3-access"
    Environment = var.environment
  }
}

# Politica de permisos: que puede hacer el backend con S3
resource "aws_iam_role_policy" "s3_access" {
  name = "s3-access-policy"
  role = aws_iam_role.s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      }
    ]
  })
}
