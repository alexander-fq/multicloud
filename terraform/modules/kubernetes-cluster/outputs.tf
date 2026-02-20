output "cluster_id" {
  description = "ID del cluster EKS"
  value       = aws_eks_cluster.main.id
}

output "cluster_name" {
  description = "Nombre del cluster EKS"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "Endpoint del API server de Kubernetes"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_ca_certificate" {
  description = "Certificado CA del cluster (base64)"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_version" {
  description = "Version de Kubernetes del cluster"
  value       = aws_eks_cluster.main.version
}

output "node_group_arn" {
  description = "ARN del Node Group"
  value       = aws_eks_node_group.main.arn
}

output "cluster_role_arn" {
  description = "ARN del IAM Role del cluster"
  value       = aws_iam_role.eks_cluster.arn
}

output "node_role_arn" {
  description = "ARN del IAM Role de los nodos"
  value       = aws_iam_role.eks_nodes.arn
}

output "oidc_provider_arn" {
  description = "ARN del OIDC provider (necesario para IRSA)"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "URL del OIDC provider sin https:// (para trust policies de IRSA)"
  value       = replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")
}
