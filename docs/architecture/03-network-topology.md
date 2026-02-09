# Network Topology - GovTech Trámites

## Complete Network Architecture

```
                              ┌─────────────────┐
                              │    INTERNET      │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ AWS WAF          │  Layer 1: Web Application Firewall
                              │ (optional)       │  Blocks: SQL injection, XSS, bots
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Internet Gateway │  Layer 2: Entry point to VPC
                              │ (igw-xxxxxx)     │
                              └────────┬────────┘
                                       │
═══════════════════════════════════════╪══════════════════════════════════════
                 VPC CLOUD (10.0.0.0/16)
═══════════════════════════════════════╪══════════════════════════════════════
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌───────────────────── ┐  ┌─────────────────── ──┐  ┌─────────────────────┐
│  PUBLIC SUBNET A     │  │  PUBLIC SUBNET B     │  │                     │
│  10.0.1.0/24         │  │  10.0.2.0/24         │  │                     │
│  AZ: us-east-1a      │  │  AZ: us-east-1b      │  │                     │
│                      │  │                      │  │                     │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │                     │
│  │ NAT Gateway    │  │  │  │ (NAT GW        │  │  │                     │
│  │ (nat-xxxxxx)   │  │  │  │  standby)      │  │  │                     │
│  └────────────────┘  │  │  └────────────────┘  │  │                     │
│                      │  │                      │  │                     │
│  ┌──────────────────────────────────────────┐  │  │                     │
│  │     APPLICATION LOAD BALANCER (ALB)      │  │  │                     │
│  │     Listeners:                           │  │  │                     │
│  │       - HTTPS (443) → Target Group       │  │  │                     │
│  │       - HTTP (80) → Redirect to HTTPS    │  │  │                     │
│  │     SSL Certificate: ACM (*.govtech.com) │  │  │                     │
│  └──────────────────────────────────────────┘  │  │                     │
│                      │  │                      │  │                     │
│  NACL: nacl-public   │  │  NACL: nacl-public   │  │                     │
└──────────────────────┘  └──────────────────────┘  │                     │
          │                            │            │                     │
          ▼                            ▼            │                     │
┌─────────────────── ──┐  ┌──────────────────── ─┐  │                     │
│  PRIVATE SUBNET A    │  │  PRIVATE SUBNET B    │  │                     │
│  (Application)       │  │  (Application)       │  │                     │
│  10.0.10.0/24        │  │  10.0.11.0/24        │  │                     │
│  AZ: us-east-1a      │  │  AZ: us-east-1b      │  │                     │
│                      │  │                      │  │                     │
│  ┌────────────────────────────────────────┐    │  │                     │
│  │         EKS CLUSTER (Kubernetes)       │    │  │                     │
│  │                                        │    │  │                     │
│  │   ┌──────────┐  ┌──────────┐           │    │  │                     │
│  │   │ Frontend │  │ Frontend │           │    │  │                     │
│  │   │ Pod 1    │  │ Pod 2    │           │    │  │                     │
│  │   │ :80      │  │ :80      │           │    │  │                     │
│  │   └──────────┘  └──────────┘           │    │  │                     │
│  │                                        │    │  │                     │
│  │   ┌──────────┐  ┌──────────┐           │    │  │                     │
│  │   │ Backend  │  │ Backend  │           │    │  │                     │
│  │   │ Pod 1    │  │ Pod 2    │           │    │  │                     │
│  │   │ :3000    │  │ :3000    │           │    │  │                     │
│  │   └────┬─────┘  └────┬─────┘           │    │  │                     │
│  │        │              │                │    │  │                     │
│  └────────┼──────────────┼────────────────┘    │  │                     │
│           │              │                     │  │                     │
│  NACL: nacl-private-app  │  NACL: nacl-priv-app│  │                     │
└───────────┼──────────────┘──────────────────────┘  │                     │
            │              │                         │                     │
            ▼              ▼                         │                     │
┌───────────────────  ─┐  ┌──────────────────── ─┐   │                     │
│  PRIVATE SUBNET A    │  │  PRIVATE SUBNET B    │    │                     │
│  (Database)          │  │  (Database)          │    │                     │
│  10.0.20.0/24        │  │  10.0.21.0/24        │    │                     │
│  AZ: us-east-1a      │  │  AZ: us-east-1b      │    │                     │
│                      │  │                      │    │                     │
│  ┌────────────────┐  │  │  ┌────────────────┐  │    │                     │
│  │ RDS PostgreSQL │  │  │  │ RDS PostgreSQL │  │    │                     │
│  │ PRIMARY        │──┼──┼──│ STANDBY        │  │    │                     │
│  │ :5432          │  │  │  │ :5432          │  │    │                     │
│  │ (read/write)   │sync │  │ (auto failover)│  │    │                     │
│  └────────────────┘  │  │  └────────────────┘  │    │                     │
│                      │  │                      │    │                     │
│  NACL: nacl-database │  │  NACL: nacl-database │    │                     │
└──────────────────────┘  └──────────────────────┘    │                     │
                                                      │                     │
══════════════════════════════════════════════════════╪═════════════════════│
                                                      │                     │
                                              ┌───────┴───────┐            │
                                              │ Transit       │            │
                                              │ Gateway       │────────────┘
                                              └───────┬───────┘
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    │                                   │
                                    ▼                                   ▼
                          VPC ON-PREMISE                       VPC MANAGEMENT
                          172.16.0.0/16                       192.168.0.0/16
```

## Route Tables

### RT-Public (Public Subnets)
| Destination | Target | Purpose |
|-------------|--------|---------|
| 10.0.0.0/16 | local | Traffic within VPC |
| 172.16.0.0/16 | tgw-xxxxxx | To On-Premise VPC |
| 192.168.0.0/16 | tgw-xxxxxx | To Management VPC |
| 0.0.0.0/0 | igw-xxxxxx | To Internet |

### RT-Private-App (Application Subnets)
| Destination | Target | Purpose |
|-------------|--------|---------|
| 10.0.0.0/16 | local | Traffic within VPC |
| 172.16.0.0/16 | tgw-xxxxxx | To On-Premise (identity verification) |
| 192.168.0.0/16 | tgw-xxxxxx | To Management (send metrics) |
| 0.0.0.0/0 | nat-xxxxxx | To Internet via NAT (updates only) |

### RT-Private-DB (Database Subnets)
| Destination | Target | Purpose |
|-------------|--------|---------|
| 10.0.0.0/16 | local | Traffic within VPC ONLY |
| (no other routes) | - | Database is fully isolated |

## Network ACLs (NACLs)

### NACL: nacl-public (Public Subnets)

**Inbound Rules:**
| Rule # | Protocol | Port Range | Source | Action | Purpose |
|--------|----------|------------|--------|--------|---------|
| 100 | TCP | 443 | 0.0.0.0/0 | ALLOW | HTTPS from anywhere |
| 110 | TCP | 80 | 0.0.0.0/0 | ALLOW | HTTP (redirects to HTTPS) |
| 120 | TCP | 1024-65535 | 10.0.0.0/16 | ALLOW | Return traffic from VPC |
| * | ALL | ALL | 0.0.0.0/0 | DENY | Block everything else |

**Outbound Rules:**
| Rule # | Protocol | Port Range | Destination | Action | Purpose |
|--------|----------|------------|-------------|--------|---------|
| 100 | TCP | 1024-65535 | 0.0.0.0/0 | ALLOW | Response to clients |
| 110 | TCP | 443 | 0.0.0.0/0 | ALLOW | HTTPS outbound |
| 120 | TCP | 80 | 10.0.10.0/24 | ALLOW | To app subnet |
| 130 | TCP | 3000 | 10.0.10.0/24 | ALLOW | To backend |
| * | ALL | ALL | 0.0.0.0/0 | DENY | Block everything else |

### NACL: nacl-private-app (Application Subnets)

**Inbound Rules:**
| Rule # | Protocol | Port Range | Source | Action | Purpose |
|--------|----------|------------|--------|--------|---------|
| 100 | TCP | 80 | 10.0.1.0/24 | ALLOW | From ALB (frontend) |
| 110 | TCP | 80 | 10.0.2.0/24 | ALLOW | From ALB (frontend) AZ-B |
| 120 | TCP | 3000 | 10.0.1.0/24 | ALLOW | From ALB (backend) |
| 130 | TCP | 3000 | 10.0.2.0/24 | ALLOW | From ALB (backend) AZ-B |
| 140 | TCP | 443 | 0.0.0.0/0 | ALLOW | HTTPS for updates via NAT |
| 150 | TCP | 1024-65535 | 0.0.0.0/0 | ALLOW | Return traffic |
| * | ALL | ALL | 0.0.0.0/0 | DENY | Block everything else |

**Outbound Rules:**
| Rule # | Protocol | Port Range | Destination | Action | Purpose |
|--------|----------|------------|-------------|--------|---------|
| 100 | TCP | 5432 | 10.0.20.0/24 | ALLOW | To RDS Primary |
| 110 | TCP | 5432 | 10.0.21.0/24 | ALLOW | To RDS Standby |
| 120 | TCP | 8080 | 172.16.0.0/16 | ALLOW | To On-Premise API |
| 130 | TCP | 9090 | 192.168.0.0/16 | ALLOW | To Prometheus |
| 140 | TCP | 443 | 0.0.0.0/0 | ALLOW | HTTPS outbound (updates) |
| 150 | TCP | 1024-65535 | 0.0.0.0/0 | ALLOW | Return traffic |
| * | ALL | ALL | 0.0.0.0/0 | DENY | Block everything else |

### NACL: nacl-database (Database Subnets)

**Inbound Rules:**
| Rule # | Protocol | Port Range | Source | Action | Purpose |
|--------|----------|------------|--------|--------|---------|
| 100 | TCP | 5432 | 10.0.10.0/24 | ALLOW | From Backend AZ-A |
| 110 | TCP | 5432 | 10.0.11.0/24 | ALLOW | From Backend AZ-B |
| * | ALL | ALL | 0.0.0.0/0 | DENY | Block EVERYTHING else |

**Outbound Rules:**
| Rule # | Protocol | Port Range | Destination | Action | Purpose |
|--------|----------|------------|-------------|--------|---------|
| 100 | TCP | 1024-65535 | 10.0.10.0/24 | ALLOW | Response to Backend AZ-A |
| 110 | TCP | 1024-65535 | 10.0.11.0/24 | ALLOW | Response to Backend AZ-B |
| * | ALL | ALL | 0.0.0.0/0 | DENY | Block EVERYTHING else |

## Security Groups

### SG: sg-alb (Application Load Balancer)
```
Inbound:
  ✅ TCP 443 from 0.0.0.0/0          (HTTPS from internet)
  ✅ TCP 80 from 0.0.0.0/0           (HTTP redirect to HTTPS)

Outbound:
  ✅ TCP 80 to sg-frontend            (to frontend pods)
  ✅ TCP 3000 to sg-backend           (to backend pods)
```

### SG: sg-frontend (Frontend Pods)
```
Inbound:
  ✅ TCP 80 from sg-alb               (from Load Balancer ONLY)

Outbound:
  ✅ TCP 3000 to sg-backend           (API calls to backend)
  ✅ TCP 443 to 0.0.0.0/0            (external API calls if needed)
```

### SG: sg-backend (Backend Pods)
```
Inbound:
  ✅ TCP 3000 from sg-alb             (from Load Balancer)
  ✅ TCP 3000 from sg-frontend        (from frontend pods)

Outbound:
  ✅ TCP 5432 to sg-database          (to PostgreSQL)
  ✅ TCP 8080 to 172.16.1.0/24       (to On-Premise identity API)
  ✅ TCP 443 to 0.0.0.0/0            (external APIs, updates)
  ✅ TCP 9090 to 192.168.1.0/24      (send metrics to Prometheus)
```

### SG: sg-database (RDS PostgreSQL)
```
Inbound:
  ✅ TCP 5432 from sg-backend         (from backend pods ONLY)

Outbound:
  (none needed - stateful, responses go back automatically)
```

### SG: sg-bastion (Bastion Host in Management VPC)
```
Inbound:
  ✅ TCP 22 from [ADMIN_IP]/32        (SSH from admin IP ONLY)

Outbound:
  ✅ TCP 22 to 10.0.0.0/16           (SSH to any instance in Cloud VPC)
  ✅ TCP 22 to 172.16.0.0/16         (SSH to On-Premise VPC)
```

## Security Architecture Summary

```
                    Internet
                       │
         ┌─────────────▼─────────────┐
Layer 1  │         AWS WAF           │  Blocks attacks (XSS, SQLi, bots)
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 2  │    NACL (nacl-public)     │  Subnet-level firewall (stateless)
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 3  │    SG (sg-alb)            │  Instance-level firewall (stateful)
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 4  │    NACL (nacl-private-app)│  App subnet firewall
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 5  │    SG (sg-backend)        │  Backend-level firewall
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 6  │    NACL (nacl-database)   │  DB subnet firewall (most restrictive)
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 7  │    SG (sg-database)       │  DB instance firewall
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
Layer 8  │    RDS Encryption (KMS)   │  Data encrypted at rest
         └───────────────────────────┘

Total: 8 security layers between the internet and your data
```

## IP Address Planning (CIDR)

```
VPC Cloud:       10.0.0.0/16    = 65,536 IPs
├── Public A:    10.0.1.0/24    = 254 IPs  (ALB, NAT GW)
├── Public B:    10.0.2.0/24    = 254 IPs  (ALB redundancy)
├── Private App A: 10.0.10.0/24 = 254 IPs  (EKS workers)
├── Private App B: 10.0.11.0/24 = 254 IPs  (EKS workers)
├── Private DB A:  10.0.20.0/24 = 254 IPs  (RDS Primary)
├── Private DB B:  10.0.21.0/24 = 254 IPs  (RDS Standby)
└── Reserved:    10.0.100-255   = Future use

VPC On-Premise:  172.16.0.0/16  = 65,536 IPs
├── Legacy:      172.16.1.0/24  = 254 IPs
└── Internal:    172.16.2.0/24  = 254 IPs

VPC Management:  192.168.0.0/16 = 65,536 IPs
├── Monitoring:  192.168.1.0/24 = 254 IPs
└── Admin:       192.168.2.0/24 = 254 IPs
```

**Important:** CIDR blocks must NOT overlap between VPCs
that are connected via Transit Gateway or VPC Peering.

```
10.0.0.0/16    → does NOT overlap with 172.16.0.0/16  ✅
172.16.0.0/16  → does NOT overlap with 192.168.0.0/16 ✅
10.0.0.0/16    → does NOT overlap with 192.168.0.0/16 ✅
```

## Equivalent in OCI (Oracle Cloud)

| AWS Component | OCI Equivalent | Notes |
|---------------|---------------|-------|
| VPC | VCN | Same concept |
| Subnet | Subnet | Same concept |
| Route Table | Route Table | Same concept |
| Internet Gateway | Internet Gateway | Same concept |
| NAT Gateway | NAT Gateway | Same concept |
| NACL | Security List | Stateless by default in OCI |
| Security Group | NSG (Network Security Group) | Stateful, recommended in OCI |
| WAF | OCI WAF | Same concept |
| ALB | OCI Load Balancer | Flexible or Network LB |
| ACM (SSL certs) | OCI Certificates | SSL/TLS management |

### Key OCI Difference:
In OCI, every subnet MUST have a Security List (even if empty).
NSGs are optional but recommended for granular control.

```
OCI Best Practice:
  Security List → Allow all (open)
  NSG → Define specific rules per resource (restrictive)

AWS Best Practice:
  NACL → Allow all or basic rules
  Security Group → Define specific rules per resource (restrictive)
```
