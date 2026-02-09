# Architecture Overview - GovTech Trámites

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS REGION (us-east-1)                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     VPC - GovTech (10.0.0.0/16)                   │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │           AVAILABILITY ZONE A (us-east-1a)                  │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  PUBLIC SUBNET (10.0.1.0/24)                          │  │  │  │
│  │  │  │                                                       │  │  │  │
│  │  │  │  ┌──────────────┐    ┌──────────────────────────┐    │  │  │  │
│  │  │  │  │   Internet   │    │   Application Load       │    │  │  │  │
│  │  │  │  │   Gateway    │───►│   Balancer (ALB)         │    │  │  │  │
│  │  │  │  └──────────────┘    │   - HTTPS (443)          │    │  │  │  │
│  │  │  │         ▲            │   - HTTP (80) → redirect │    │  │  │  │
│  │  │  │         │            └───────────┬──────────────┘    │  │  │  │
│  │  │  └─────────┼────────────────────────┼───────────────────┘  │  │  │
│  │  │            │                        │                      │  │  │
│  │  │  ┌─────────┼────────────────────────┼───────────────────┐  │  │  │
│  │  │  │  PRIVATE SUBNET - APP (10.0.10.0/24)                 │  │  │  │
│  │  │  │         │                        │                   │  │  │  │
│  │  │  │         │         ┌──────────────▼──────────────┐    │  │  │  │
│  │  │  │  ┌──────┴──────┐  │      EKS CLUSTER            │    │  │  │  │
│  │  │  │  │ NAT Gateway │  │  ┌────────┐  ┌────────┐     │    │  │  │  │
│  │  │  │  │ (salida a   │  │  │Frontend│  │Frontend│     │    │  │  │  │
│  │  │  │  │  internet)  │  │  │ Pod 1  │  │ Pod 2  │     │    │  │  │  │
│  │  │  │  └─────────────┘  │  └────────┘  └────────┘     │    │  │  │  │
│  │  │  │                   │  ┌────────┐  ┌────────┐     │    │  │  │  │
│  │  │  │                   │  │Backend │  │Backend │     │    │  │  │  │
│  │  │  │                   │  │ Pod 1  │  │ Pod 2  │     │    │  │  │  │
│  │  │  │                   │  └───┬────┘  └───┬────┘     │    │  │  │  │
│  │  │  │                   └──────┼───────────┼──────────┘    │  │  │  │
│  │  │  └──────────────────────────┼───────────┼───────────────┘  │  │  │
│  │  │                             │           │                  │  │  │
│  │  │  ┌──────────────────────────┼───────────┼───────────────┐  │  │  │
│  │  │  │  PRIVATE SUBNET - DB (10.0.20.0/24)                  │  │  │  │
│  │  │  │                          │           │               │  │  │  │
│  │  │  │              ┌───────────▼───────────▼────────┐      │  │  │  │
│  │  │  │              │    RDS PostgreSQL 14            │      │  │  │  │
│  │  │  │              │    - Multi-AZ (Primary)        │      │  │  │  │
│  │  │  │              │    - Encrypted at rest          │      │  │  │  │
│  │  │  │              │    - Automated backups          │      │  │  │  │
│  │  │  │              │    - Port 5432                  │      │  │  │  │
│  │  │  │              └────────────────────────────────┘      │  │  │  │
│  │  │  └──────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │           AVAILABILITY ZONE B (us-east-1b)                  │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌───────────────────┐  ┌───────────────────────────────┐  │  │  │
│  │  │  │ PUBLIC SUBNET     │  │ PRIVATE SUBNET - APP          │  │  │  │
│  │  │  │ (10.0.2.0/24)     │  │ (10.0.11.0/24)                │  │  │  │
│  │  │  │                   │  │                               │  │  │  │
│  │  │  │ (ALB node)        │  │ (EKS worker nodes - replica)  │  │  │  │
│  │  │  └───────────────────┘  └───────────────────────────────┘  │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │  │
│  │  │  │ PRIVATE SUBNET - DB (10.0.21.0/24)                   │  │  │  │
│  │  │  │                                                      │  │  │  │
│  │  │  │  ┌────────────────────────────────────────────┐      │  │  │  │
│  │  │  │  │  RDS PostgreSQL (Standby - Auto failover)  │      │  │  │  │
│  │  │  │  └────────────────────────────────────────────┘      │  │  │  │
│  │  │  └──────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  S3 Bucket           │  │  CloudWatch      │  │  IAM             │  │
│  │  - Static files      │  │  - Monitoring    │  │  - Roles         │  │
│  │  - Backups           │  │  - Logs          │  │  - Policies      │  │
│  │  - DR snapshots      │  │  - Alerts        │  │  - Users/Groups  │  │
│  └──────────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

            ▲
            │ HTTPS (443)
            │
    ┌───────┴───────┐
    │   INTERNET    │
    │  (Citizens)   │
    └───────────────┘
```

## Component Summary

### Networking Layer
| Component | Purpose | CIDR / Config |
|-----------|---------|---------------|
| VPC | Isolated virtual network | 10.0.0.0/16 (65,536 IPs) |
| Public Subnet AZ-A | Load Balancer, Internet Gateway | 10.0.1.0/24 |
| Public Subnet AZ-B | Load Balancer redundancy | 10.0.2.0/24 |
| Private Subnet App AZ-A | EKS worker nodes (primary) | 10.0.10.0/24 |
| Private Subnet App AZ-B | EKS worker nodes (replica) | 10.0.11.0/24 |
| Private Subnet DB AZ-A | RDS Primary instance | 10.0.20.0/24 |
| Private Subnet DB AZ-B | RDS Standby instance | 10.0.21.0/24 |
| Internet Gateway | Public internet access | Attached to VPC |
| NAT Gateway | Outbound internet for private subnets | In public subnet |

### Application Layer
| Component | Purpose | Config |
|-----------|---------|--------|
| ALB | Distribute HTTPS traffic | Port 443, SSL/TLS cert |
| EKS Cluster | Kubernetes orchestration | 2+ worker nodes |
| Frontend Pods | React SPA serving | 2 replicas minimum |
| Backend Pods | Node.js API | 2 replicas minimum |

### Data Layer
| Component | Purpose | Config |
|-----------|---------|--------|
| RDS PostgreSQL 14 | Primary database | Multi-AZ, encrypted |
| S3 Bucket | Static assets, backups | Versioning enabled |

### Security & Monitoring
| Component | Purpose |
|-----------|---------|
| IAM | Identity and access management |
| Security Groups | Network-level firewall rules |
| CloudWatch | Monitoring, logging, alerting |
| AWS WAF | Web Application Firewall (optional) |

### Equivalent in OCI (Oracle Cloud)
| AWS Service | OCI Equivalent |
|-------------|----------------|
| VPC | VCN (Virtual Cloud Network) |
| Subnet | Subnet |
| Internet Gateway | Internet Gateway |
| NAT Gateway | NAT Gateway |
| Security Group | Network Security Group (NSG) |
| ALB | Load Balancer |
| EKS | OKE (Oracle Kubernetes Engine) |
| RDS | OCI Database Service |
| S3 | Object Storage |
| CloudWatch | OCI Monitoring + Logging |
| IAM | OCI IAM with Identity Domains |
| WAF | OCI WAF |

## Traffic Flow

```
Citizen Browser
    │
    ▼ (HTTPS request)
Internet Gateway
    │
    ▼
Application Load Balancer (SSL termination)
    │
    ├──► Frontend Pod (serves React SPA)
    │       │
    │       ▼ (API call from browser)
    │    Backend Pod (Node.js API)
    │       │
    │       ▼ (SQL query)
    │    RDS PostgreSQL
    │
    └──► Response flows back to citizen
```

## Security Layers

```
Layer 1: WAF           → Blocks malicious requests (SQL injection, XSS)
Layer 2: Security Group → Only port 443 open to public
Layer 3: Private Subnet → Backend not directly accessible from internet
Layer 4: Security Group → Backend only accepts traffic from ALB
Layer 5: Private Subnet → Database completely isolated
Layer 6: Security Group → Database only accepts traffic from Backend
Layer 7: Encryption     → Data encrypted at rest and in transit
Layer 8: IAM            → Role-based access control
```

## High Availability Design

```
Availability Zone A          Availability Zone B
┌──────────────────┐        ┌──────────────────┐
│  ALB Node        │        │  ALB Node        │
│  EKS Workers     │        │  EKS Workers     │
│  RDS Primary     │───────►│  RDS Standby     │
└──────────────────┘  sync  └──────────────────┘

If AZ-A fails → Traffic automatically routes to AZ-B
                 RDS Standby becomes Primary (auto failover)
```

## Why Two Availability Zones?

An Availability Zone is a physical data center. If one catches fire
or loses power, the other keeps your application running.

- **RTO (Recovery Time Objective):** < 5 minutes (automatic failover)
- **RPO (Recovery Point Objective):** 0 seconds (synchronous replication)
