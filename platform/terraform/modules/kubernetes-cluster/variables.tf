variable "cluster_name" {
  description = "Nombre del cluster EKS"
  type        = string
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "Region de AWS"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID de la VPC donde crear el cluster"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de las subnets privadas para los nodos EKS"
  type        = list(string)
}

variable "node_instance_type" {
  description = "Tipo de instancia EC2 para los nodos"
  type        = string
  default     = "t3.medium"
}

variable "node_min_size" {
  description = "Minimo de nodos en el grupo"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximo de nodos en el grupo"
  type        = number
  default     = 6
}

variable "node_desired_size" {
  description = "Numero deseado de nodos"
  type        = number
  default     = 2
}

variable "project_name" {
  description = "Nombre del proyecto para tags"
  type        = string
  default     = "govtech"
}
