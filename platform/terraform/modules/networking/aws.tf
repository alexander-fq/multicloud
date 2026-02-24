# =============================================================
# MODULO: Networking - VPC, Subnets, Gateways, Security Groups
# =============================================================
# Este modulo crea toda la red base para el proyecto GovTech.
#
# ARQUITECTURA:
#
#   Internet
#      |
#   [Internet Gateway]
#      |
#   [Subnets PUBLICAS]  <- Load Balancers, NAT Gateways
#      |
#   [NAT Gateways]      <- Permite salida a Internet desde privadas
#      |
#   [Subnets PRIVADAS]  <- EKS Nodes, RDS (no accesibles desde Internet)
#
# Por que subnets privadas para EKS?
# Los pods y nodos NO deben ser accesibles directamente desde Internet.
# El trafico entra por el Load Balancer (subnet publica) -> pods (subnet privada)
# =============================================================

# -------------------------------------------------------------
# VPC (Virtual Private Cloud)
# Es la red privada de nuestro proyecto en AWS
# Equivale a un datacenter privado virtual
# -------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr        # Rango de IPs: 10.0.0.0 - 10.0.255.255 (65,536 IPs)
  enable_dns_hostnames = true                 # Permite hostnames DNS dentro de la VPC
  enable_dns_support   = true                 # Habilita resolucion DNS

  tags = {
    Name        = "${var.project_name}-vpc-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# SUBNETS PUBLICAS (una por Availability Zone)
# Tienen acceso directo a Internet via Internet Gateway
# Usadas para: Load Balancers, NAT Gateways
# -------------------------------------------------------------
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  # Los recursos en esta subnet reciben IP publica automaticamente
  map_public_ip_on_launch = true

  tags = {
    Name                     = "${var.project_name}-public-${var.availability_zones[count.index]}-${var.environment}"
    Environment              = var.environment
    Project                  = var.project_name
    ManagedBy                = "terraform"
    Type                     = "public"
    # Tag requerido por AWS Load Balancer Controller para EKS
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${var.project_name}-${var.environment}" = "shared"
  }
}

# -------------------------------------------------------------
# SUBNETS PRIVADAS (una por Availability Zone)
# Sin acceso directo a Internet (mas seguras)
# Usadas para: EKS Nodes, RDS, pods de la aplicacion
# -------------------------------------------------------------
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  # Los recursos NO reciben IP publica
  map_public_ip_on_launch = false

  tags = {
    Name                              = "${var.project_name}-private-${var.availability_zones[count.index]}-${var.environment}"
    Environment                       = var.environment
    Project                           = var.project_name
    ManagedBy                         = "terraform"
    Type                              = "private"
    # Tag requerido por AWS Load Balancer Controller para EKS (trafico interno)
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${var.project_name}-${var.environment}" = "shared"
  }
}

# -------------------------------------------------------------
# INTERNET GATEWAY
# La "puerta" que conecta la VPC con Internet
# Sin esto, nada en la VPC puede salir o entrar desde Internet
# -------------------------------------------------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# ELASTIC IPs para NAT Gateways
# IPs publicas estaticas que se asignan a los NAT Gateways
# Una por Availability Zone para alta disponibilidad
# -------------------------------------------------------------
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  # Asegurar que el Internet Gateway exista antes de crear las EIPs
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.project_name}-eip-nat-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# NAT GATEWAYS (uno por Availability Zone)
# Permite que recursos en subnets PRIVADAS salgan a Internet
# Ejemplo: un pod necesita descargar actualizaciones de npm
# Costo: ~$32/mes por NAT Gateway + datos transferidos
# Para dev puedes usar solo 1 NAT Gateway para ahorrar costos
# -------------------------------------------------------------
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id  # NAT va en subnet PUBLICA

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.project_name}-nat-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# ROUTE TABLE - Subnets Publicas
# Define como se enruta el trafico de las subnets publicas
# Todo el trafico (0.0.0.0/0) va al Internet Gateway
# -------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"                    # Todo el trafico
    gateway_id = aws_internet_gateway.main.id   # Va al Internet Gateway
  }

  tags = {
    Name        = "${var.project_name}-rt-public-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Asociar la route table publica con cada subnet publica
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# -------------------------------------------------------------
# ROUTE TABLES - Subnets Privadas (una por AZ)
# El trafico de subnets privadas sale por el NAT Gateway de su AZ
# Si el NAT de us-east-1a falla, us-east-1b y 1c siguen funcionando
# -------------------------------------------------------------
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"                        # Todo el trafico externo
    nat_gateway_id = aws_nat_gateway.main[count.index].id  # Va al NAT Gateway de su AZ
  }

  tags = {
    Name        = "${var.project_name}-rt-private-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Asociar cada route table privada con su subnet privada
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# -------------------------------------------------------------
# SECURITY GROUP - EKS Cluster
# Controla el trafico de red hacia/desde el cluster EKS
# Piensa en esto como el "firewall" del cluster
# -------------------------------------------------------------
resource "aws_security_group" "eks_cluster" {
  name        = "${var.project_name}-eks-sg-${var.environment}"
  description = "Security group para EKS cluster - controla trafico de red"
  vpc_id      = aws_vpc.main.id

  # Trafico ENTRANTE permitido
  ingress {
    description = "HTTPS desde Internet (trafico de usuarios)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP desde Internet (redireccionado a HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Comunicacion interna entre nodos EKS"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"    # Todos los protocolos
    self        = true    # Solo desde este mismo security group
  }

  # Trafico SALIENTE permitido
  egress {
    description = "Trafico saliente sin restricciones (actualizaciones, ECR, AWS APIs)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-eks-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# -------------------------------------------------------------
# SECURITY GROUP - RDS PostgreSQL
# Solo permite conexiones desde el cluster EKS (no desde Internet)
# El backend puede conectarse a la DB, pero nadie mas
# -------------------------------------------------------------
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg-${var.environment}"
  description = "Security group para RDS PostgreSQL - solo acceso desde EKS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL solo desde EKS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]  # Solo desde EKS SG
  }

  egress {
    description = "Salida permitida"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}
