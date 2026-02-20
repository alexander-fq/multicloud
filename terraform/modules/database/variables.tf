variable "project_name" {
  description = "Nombre del proyecto (govtech)"
  type        = string
}

variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de subnets privadas donde vivira RDS"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group que permite acceso desde EKS a RDS (puerto 5432)"
  type        = string
}

variable "db_instance_class" {
  description = "Tipo de instancia RDS. db.t3.micro para dev, db.r6g.large para prod"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Almacenamiento inicial en GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Almacenamiento maximo (autoscaling). 0 = deshabilitado"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Nombre de la base de datos inicial"
  type        = string
  default     = "govtech"
}

variable "db_username" {
  description = "Usuario administrador de PostgreSQL"
  type        = string
  default     = "govtech_admin"
}

variable "db_password" {
  description = "Password del usuario administrador. Usar AWS Secrets Manager en produccion"
  type        = string
  sensitive   = true
}

variable "multi_az" {
  description = "Habilitar Multi-AZ para alta disponibilidad. true en prod, false en dev"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Dias de retencion de backups automaticos (1-35)"
  type        = number
  default     = 7
}
