output "kms_key_id" {
  description = "ID de la clave KMS principal del proyecto"
  value       = aws_kms_key.govtech_main.key_id
}

output "kms_key_arn" {
  description = "ARN de la clave KMS (usar en RDS, S3, Secrets Manager)"
  value       = aws_kms_key.govtech_main.arn
}

output "guardduty_detector_id" {
  description = "ID del detector de GuardDuty"
  value       = aws_guardduty_detector.main.id
}

output "waf_web_acl_arn" {
  description = "ARN del WAF Web ACL (para asociar al ALB)"
  value       = aws_wafv2_web_acl.govtech.arn
}

output "cloudtrail_arn" {
  description = "ARN del trail de CloudTrail"
  value       = aws_cloudtrail.govtech_audit.arn
}

output "db_secret_arn" {
  description = "ARN del secret de credenciales DB en Secrets Manager"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "jwt_secret_arn" {
  description = "ARN del JWT secret en Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "cost_monitor_arn" {
  description = "ARN del monitor de anomalias de costos"
  value       = aws_ce_anomaly_monitor.govtech.arn
}
