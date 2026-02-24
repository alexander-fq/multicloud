output "bucket_id" {
  description = "Nombre del bucket S3"
  value       = aws_s3_bucket.app_storage.id
}

output "bucket_arn" {
  description = "ARN del bucket S3"
  value       = aws_s3_bucket.app_storage.arn
}

output "bucket_domain_name" {
  description = "Domain name del bucket para acceso directo"
  value       = aws_s3_bucket.app_storage.bucket_domain_name
}

output "s3_access_role_arn" {
  description = "ARN del IAM role para que los pods accedan a S3 via IRSA"
  value       = aws_iam_role.s3_access.arn
}

output "s3_access_role_name" {
  description = "Nombre del IAM role para S3"
  value       = aws_iam_role.s3_access.name
}
