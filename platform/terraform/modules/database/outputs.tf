output "db_instance_id" {
  description = "ID de la instancia RDS"
  value       = aws_db_instance.main.id
}

output "db_instance_endpoint" {
  description = "Endpoint de conexion a RDS (host:port)"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_instance_address" {
  description = "Solo el hostname del endpoint"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "db_port" {
  description = "Puerto PostgreSQL"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Nombre de la base de datos"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Usuario administrador"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_subnet_group_name" {
  description = "Nombre del subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_arn" {
  description = "ARN de la instancia RDS"
  value       = aws_db_instance.main.arn
}
