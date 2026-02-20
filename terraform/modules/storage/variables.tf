variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}

variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
}

variable "aws_account_id" {
  description = "ID de la cuenta AWS (para nombres unicos de bucket)"
  type        = string
}

variable "cors_allowed_origins" {
  description = "Origenes permitidos para CORS (URLs del frontend)"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "oidc_provider_arn" {
  description = "ARN del OIDC provider del cluster EKS (para IRSA)"
  type        = string
}

variable "oidc_provider_url" {
  description = "URL del OIDC provider sin https:// (para condicion de trust policy)"
  type        = string
}
