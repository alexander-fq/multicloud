# =============================================================
# MODULO: Kubernetes Cluster - EKS
# =============================================================
# EKS = Elastic Kubernetes Service
# AWS gestiona el Control Plane (API server, etcd, scheduler)
# Nosotros gestionamos los Worker Nodes (donde corren los pods)
#
# COMPONENTES:
# - EKS Cluster (control plane gestionado por AWS)
# - Node Group (EC2 instances que son los workers)
# - IAM Roles (permisos para cluster y nodos)
# - OIDC Provider (para que pods tengan permisos IAM individuales)
# =============================================================

# -------------------------------------------------------------
# IAM ROLE - EKS Cluster
# El cluster necesita permisos para gestionar recursos AWS
# (crear Load Balancers, leer ECR, etc.)
# -------------------------------------------------------------
resource "aws_iam_role" "eks_cluster" {
  name = "${var.project_name}-eks-cluster-role-${var.environment}"

  # Permite que el servicio EKS asuma este rol
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-eks-cluster-role-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Politica gestionada por AWS para EKS Cluster
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# -------------------------------------------------------------
# IAM ROLE - EKS Worker Nodes
# Los nodos EC2 necesitan permisos para:
# - Registrarse en el cluster
# - Descargar imagenes de ECR
# - Interactuar con servicios AWS
# -------------------------------------------------------------
resource "aws_iam_role" "eks_nodes" {
  name = "${var.project_name}-eks-nodes-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-eks-nodes-role-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Politicas necesarias para los nodos Worker
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  # VPC CNI: permite a Kubernetes gestionar IPs de los pods
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  # Permite a los nodos descargar imagenes de ECR
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

# -------------------------------------------------------------
# EKS CLUSTER
# El Control Plane gestionado por AWS
# Kubernetes version 1.28 (LTS)
# -------------------------------------------------------------
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  version  = "1.28"
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = true   # API server accesible desde dentro de la VPC
    endpoint_public_access  = true   # API server accesible desde Internet (para kubectl)
    public_access_cidrs     = ["0.0.0.0/0"]  # Restringir en prod a tu IP
  }

  # Logs del control plane enviados a CloudWatch
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# OIDC PROVIDER
# Permite que pods individuales tengan permisos IAM especificos
# Sin esto todos los pods comparten los permisos del nodo (inseguro)
# Con esto: pod de backend puede acceder a S3, pero pod de frontend no
# -------------------------------------------------------------
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name        = "${var.cluster_name}-oidc"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# NODE GROUP
# Los EC2 instances que son los Worker Nodes del cluster
# Managed Node Group: AWS gestiona el ciclo de vida de los nodos
# -------------------------------------------------------------
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-nodes-${var.environment}"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = var.subnet_ids  # Nodos en subnets PRIVADAS

  # Tipo de instancia: t3.medium = 2 vCPUs, 4GB RAM
  # Suficiente para dev/staging, usar t3.large para prod
  instance_types = [var.node_instance_type]

  # Auto Scaling del Node Group
  scaling_config {
    min_size     = var.node_min_size     # Minimo de nodos siempre activos
    max_size     = var.node_max_size     # Maximo para escalar en picos
    desired_size = var.node_desired_size # Nodos al iniciar
  }

  # Actualizar nodos sin downtime
  update_config {
    max_unavailable = 1  # Maximo 1 nodo fuera de servicio al actualizar
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ecr_read_only,
  ]

  tags = {
    Name        = "${var.project_name}-nodes-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}
