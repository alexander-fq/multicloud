# Hybrid Cloud Architecture - GovTech Trámites

## Overview

This diagram shows how the cloud infrastructure (AWS) connects with
government on-premise servers to form a hybrid cloud architecture.

In our hackathon, we SIMULATE the on-premise environment using a second
VPC in AWS connected via VPC Peering.

## Hybrid Cloud Diagram

```
                        ┌──────────────────────────────────────┐
                        │            INTERNET                   │
                        └────────────────┬─────────────────────┘
                                         │
                                         │ HTTPS (443)
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                          AWS REGION (us-east-1)                                │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │                    TRANSIT GATEWAY (Hub Central)                          │  │
│  │          Connects all VPCs and on-premise networks                       │  │
│  │                                                                          │  │
│  └─────────┬────────────────────────────┬───────────────────┬───────────────┘  │
│            │                            │                   │                  │
│            ▼                            ▼                   ▼                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐   │
│  │                     │  │                     │  │                      │   │
│  │  VPC: CLOUD         │  │  VPC: ON-PREMISE    │  │  VPC: MANAGEMENT     │   │
│  │  (Production)       │  │  (Simulated Govt)   │  │  (Monitoring/Admin)  │   │
│  │  10.0.0.0/16        │  │  172.16.0.0/16      │  │  192.168.0.0/16     │   │
│  │                     │  │                     │  │                      │   │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────────┘   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed VPC Architecture

### VPC 1: CLOUD (Production) - 10.0.0.0/16
**Purpose:** Hosts the new GovTech application

```
VPC CLOUD (10.0.0.0/16)
│
├── Public Subnet (10.0.1.0/24) ── AZ-A
│   ├── Internet Gateway
│   ├── Application Load Balancer
│   └── NAT Gateway
│
├── Public Subnet (10.0.2.0/24) ── AZ-B
│   └── ALB (redundancy)
│
├── Private Subnet - App (10.0.10.0/24) ── AZ-A
│   └── EKS Worker Nodes
│       ├── Frontend Pods (React)
│       └── Backend Pods (Node.js)
│
├── Private Subnet - App (10.0.11.0/24) ── AZ-B
│   └── EKS Worker Nodes (replicas)
│
├── Private Subnet - DB (10.0.20.0/24) ── AZ-A
│   └── RDS PostgreSQL (Primary)
│
└── Private Subnet - DB (10.0.21.0/24) ── AZ-B
    └── RDS PostgreSQL (Standby)
```

### VPC 2: ON-PREMISE (Simulated Government) - 172.16.0.0/16
**Purpose:** Simulates the government's existing on-premise infrastructure

```
VPC ON-PREMISE (172.16.0.0/16)
│
├── Private Subnet - Legacy Systems (172.16.1.0/24) ── AZ-A
│   ├── EC2: Identity Service (simulates citizen ID system)
│   │   └── Simple API that validates DNI numbers
│   │
│   ├── EC2: Active Directory Simulation
│   │   └── Represents government employee authentication
│   │
│   └── EC2: Legacy Database Server
│       └── Represents old government database systems
│
└── Private Subnet - Internal Services (172.16.2.0/24) ── AZ-A
    ├── EC2: Internal Email Server (simulation)
    └── EC2: Document Management (simulation)
```

**Important:** In a real scenario, this VPC would be the government's
actual data center connected via VPN or Direct Connect.
We simulate it in AWS to demonstrate the hybrid architecture.

### VPC 3: MANAGEMENT (Monitoring/Admin) - 192.168.0.0/16
**Purpose:** Centralized monitoring and administration

```
VPC MANAGEMENT (192.168.0.0/16)
│
├── Private Subnet - Monitoring (192.168.1.0/24) ── AZ-A
│   ├── Prometheus Server (metrics collection)
│   ├── Grafana Dashboards (visualization)
│   └── AlertManager (alerting)
│
└── Private Subnet - Admin (192.168.2.0/24) ── AZ-A
    ├── Bastion Host (secure SSH access)
    └── Jenkins / GitHub Actions Runner (optional)
```

## Connection Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        TRANSIT GATEWAY                                │
│                                                                      │
│  Route Table:                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  10.0.0.0/16   → VPC Cloud (Production)                       │  │
│  │  172.16.0.0/16 → VPC On-Premise (Simulated Government)        │  │
│  │  192.168.0.0/16 → VPC Management (Monitoring)                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Security Rules:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Cloud → On-Premise: ALLOW (API calls to identity service)    │  │
│  │  On-Premise → Cloud: DENY (on-premise cannot initiate)        │  │
│  │  Management → Cloud: ALLOW (monitoring, SSH)                  │  │
│  │  Management → On-Premise: ALLOW (monitoring)                  │  │
│  │  Cloud → Management: ALLOW (send metrics/logs)                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Citizen Creates a Tramite

```
Step 1: Citizen opens browser
        │
        ▼
Step 2: Request hits ALB (VPC Cloud - Public Subnet)
        │
        ▼
Step 3: ALB routes to Frontend Pod (VPC Cloud - Private Subnet)
        │
        ▼
Step 4: Frontend sends API call to Backend Pod
        │
        ▼
Step 5: Backend needs to VERIFY citizen's DNI
        │
        ├── Step 5a: Backend queries Identity Service
        │            (VPC Cloud → Transit Gateway → VPC On-Premise)
        │            172.16.1.10:8080/api/verify-dni/12345678
        │            │
        │            ▼
        │            Identity Service responds: "Valid - Juan Pérez"
        │            (VPC On-Premise → Transit Gateway → VPC Cloud)
        │
        ▼
Step 6: Backend creates tramite in RDS PostgreSQL
        │
        ▼
Step 7: Backend sends metrics to Prometheus
        (VPC Cloud → Transit Gateway → VPC Management)
        │
        ▼
Step 8: Response flows back to citizen:
        "Trámite TRAM-20260208-00001 created successfully"
```

## Real World vs Hackathon Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│                    REAL WORLD SCENARIO                            │
│                                                                  │
│  Government Data Center          AWS                             │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ Physical servers │           │ VPC Cloud        │            │
│  │ Legacy systems   │◄── VPN ──►│ EKS, RDS, ALB   │            │
│  │ Own network      │  or Direct│                  │            │
│  │ Own firewalls    │  Connect  │                  │            │
│  └──────────────────┘           └──────────────────┘            │
│                                                                  │
│  Connection: VPN Site-to-Site or AWS Direct Connect              │
│  Latency: 5-20ms (VPN) or 1-5ms (Direct Connect)               │
│  Cost: VPN ~$50/mo | Direct Connect ~$200-2000/mo              │
│  Setup time: VPN ~1 day | Direct Connect ~2-4 weeks            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    HACKATHON SIMULATION                           │
│                                                                  │
│  VPC "On-Premise"               VPC "Cloud"                     │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ EC2 instances    │           │ EKS, RDS, ALB   │            │
│  │ Simulated legacy │◄─ VPC ───►│ Real application │            │
│  │ Simple APIs      │  Peering  │                  │            │
│  │                  │ or Transit│                  │            │
│  └──────────────────┘  Gateway  └──────────────────┘            │
│                                                                  │
│  Connection: VPC Peering or Transit Gateway                      │
│  Latency: <1ms (same region)                                    │
│  Cost: Free (VPC Peering) or ~$36/mo (Transit Gateway)          │
│  Setup time: Minutes (Terraform)                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Security Between Environments

### Network Level
```
On-Premise → Cloud:
  ❌ BLOCKED by default (on-premise cannot reach cloud directly)
  ✅ ONLY specific ports allowed:
     - Port 443 (HTTPS) to specific internal endpoints

Cloud → On-Premise:
  ✅ ALLOWED but restricted:
     - Port 8080 (Identity API) from Backend pods ONLY
     - Port 389 (LDAP) from Backend pods ONLY (Active Directory)
  ❌ Everything else: BLOCKED

Management → Both:
  ✅ Port 9090 (Prometheus scraping)
  ✅ Port 22 (SSH from Bastion only)
  ❌ Everything else: BLOCKED
```

### Encryption
```
VPN/Peering Traffic:
  ✅ All traffic encrypted with AES-256
  ✅ TLS 1.3 for API calls between VPCs
  ✅ IPsec for VPN tunnels

Data at Rest:
  ✅ RDS: AES-256 encryption (AWS KMS)
  ✅ S3: Server-side encryption
  ✅ EBS: Encrypted volumes
```

## AWS Services Used (Hybrid)

| Service | Purpose | Cost Estimate |
|---------|---------|---------------|
| Transit Gateway | Hub for VPC connections | ~$36/month |
| VPC Peering | Alternative (free) connection | Free |
| EC2 (t3.micro) | Simulate on-premise servers | ~$8/month each |
| VPN Gateway | Real VPN endpoint (documented) | ~$36/month |

## Equivalent in OCI (Oracle Cloud)

| AWS | OCI | Purpose |
|-----|-----|---------|
| Transit Gateway | DRG (Dynamic Routing Gateway) | Hub for network connections |
| VPC Peering | Local VCN Peering | Connect two VCNs |
| Site-to-Site VPN | IPSec VPN Connection | Encrypted tunnel to on-premise |
| Direct Connect | FastConnect | Dedicated physical connection |
| VPN Gateway | VPN Connect | VPN endpoint in cloud |

## Key Takeaways

1. **Hybrid cloud** = old systems (on-premise) + new systems (cloud) working together
2. **VPN** = encrypted tunnel through internet (cheap, easy)
3. **Direct Connect** = physical dedicated cable (fast, expensive)
4. **Transit Gateway** = central hub connecting multiple networks
5. **For the hackathon** = we simulate on-premise with a 2nd VPC
6. **Security** = strict rules about which VPC can talk to which
7. **The app doesn't know the difference** = backend calls an API, doesn't care where it lives
