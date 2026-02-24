variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string
}

variable "account_id" {
  description = "ID de la cuenta AWS"
  type        = string
}

variable "aws_region" {
  description = "Region de AWS"
  type        = string
}

variable "logs_bucket" {
  description = "ID del bucket S3 para guardar logs de CloudTrail y WAF"
  type        = string
}
