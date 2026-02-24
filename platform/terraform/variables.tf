variable "aws_region" {
  description = "Region de AWS"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
  default     = "govtech_admin"
}

variable "db_password" {
  description = "Password de la base de datos"
  type        = string
  sensitive   = true
}
