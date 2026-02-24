output "vpc_id" {
  description = "ID de la VPC creada"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block de la VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs de las subnets publicas (para Load Balancers y NAT Gateways)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs de las subnets privadas (para EKS nodes y RDS)"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID del Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs de los NAT Gateways (uno por AZ)"
  value       = aws_nat_gateway.main[*].id
}

output "eks_security_group_id" {
  description = "ID del Security Group para EKS"
  value       = aws_security_group.eks_cluster.id
}

output "rds_security_group_id" {
  description = "ID del Security Group para RDS"
  value       = aws_security_group.rds.id
}
