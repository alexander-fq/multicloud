# CI/CD Pipeline - GovTech Trámites (DevSecOps)

## Pipeline Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE CI/CD PIPELINE                          │
│                                                                          │
│  Developer        GitHub           AWS                    Kubernetes     │
│  ─────────        ──────           ───                    ──────────     │
│                                                                          │
│  git push ──► GitHub Actions ──► Build ──► Scan ──► ECR ──► EKS Deploy  │
│                                                                          │
│  ┌────────┐  ┌─────────────┐  ┌────────┐  ┌──────┐  ┌────┐  ┌───────┐  │
│  │ CODE   │→ │ CI PIPELINE │→ │ BUILD  │→ │ SCAN │→ │ ECR│→ │DEPLOY │  │
│  │        │  │ lint + test │  │ Docker │  │ Trivy│  │    │  │Rolling│  │
│  └────────┘  └─────────────┘  └────────┘  └──────┘  └────┘  └───────┘  │
│                                                                          │
│  Time: ~0s     ~2-3 min          ~1 min    ~30 sec   ~10s    ~2-3 min   │
│  Total pipeline time: ~7-10 minutes                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Detailed Pipeline Stages

### Stage 1: Code Push (Developer)

```
Developer Workflow:

  1. Create feature branch
     $ git checkout -b feature/add-search-by-dni

  2. Write code and test locally
     $ npm run dev
     $ npm test

  3. Commit and push
     $ git add .
     $ git commit -m "feat: add search by DNI endpoint"
     $ git push origin feature/add-search-by-dni

  4. Create Pull Request on GitHub
     feature/add-search-by-dni → main

  This triggers the CI pipeline automatically ──►
```

### Stage 2: CI Pipeline (GitHub Actions)

```
┌──────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS - CI PIPELINE                                     │
│  Trigger: Pull Request to main                                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Job 1: CODE QUALITY                        (~1 min)       │  │
│  │                                                            │  │
│  │  Step 1: Checkout code                                     │  │
│  │    $ git checkout ${{ github.sha }}                        │  │
│  │                                                            │  │
│  │  Step 2: Setup Node.js 20                                  │  │
│  │    $ nvm use 20                                            │  │
│  │                                                            │  │
│  │  Step 3: Install dependencies                              │  │
│  │    $ npm ci                                                │  │
│  │                                                            │  │
│  │  Step 4: Lint code                                         │  │
│  │    $ npm run lint                                          │  │
│  │    Checks: code style, unused variables, errors            │  │
│  │    ❌ If fails → PR blocked, developer must fix            │  │
│  │                                                            │  │
│  │  Step 5: Run unit tests                                    │  │
│  │    $ npm test -- --coverage                                │  │
│  │    Checks: all tests pass, coverage > 80%                  │  │
│  │    ❌ If fails → PR blocked                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Job 2: SECURITY SCAN                       (~1 min)       │  │
│  │                                                            │  │
│  │  Step 1: Scan for secrets in code                          │  │
│  │    Tool: git-secrets / gitleaks                             │  │
│  │    Checks: no passwords, API keys, tokens in code          │  │
│  │    ❌ If found → PR blocked immediately                    │  │
│  │                                                            │  │
│  │  Step 2: Audit npm dependencies                            │  │
│  │    $ npm audit                                             │  │
│  │    Checks: no known vulnerabilities in libraries           │  │
│  │    ⚠️ If high/critical → PR blocked                        │  │
│  │                                                            │  │
│  │  Step 3: Scan Terraform files (if changed)                 │  │
│  │    Tool: checkov                                           │  │
│  │    Checks: no insecure configurations                      │  │
│  │    Examples:                                               │  │
│  │      ❌ S3 bucket without encryption                       │  │
│  │      ❌ Security group open to 0.0.0.0/0 on port 22       │  │
│  │      ❌ RDS without backup enabled                         │  │
│  │      ❌ EKS with public endpoint                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Job 3: BUILD & PUSH                        (~2 min)       │  │
│  │  (Only runs if Jobs 1 and 2 pass)                          │  │
│  │                                                            │  │
│  │  Step 1: Build Docker image                                │  │
│  │    $ docker build -t govtech-backend:$GIT_SHA .            │  │
│  │                                                            │  │
│  │  Step 2: Scan Docker image for vulnerabilities             │  │
│  │    Tool: Trivy                                             │  │
│  │    $ trivy image govtech-backend:$GIT_SHA                  │  │
│  │    Checks:                                                 │  │
│  │      - OS vulnerabilities (Alpine Linux packages)          │  │
│  │      - Application vulnerabilities (Node.js, npm)          │  │
│  │      - Configuration issues (running as root?)             │  │
│  │    ❌ If CRITICAL found → build fails                      │  │
│  │                                                            │  │
│  │  Step 3: Tag image                                         │  │
│  │    $ docker tag govtech-backend:$GIT_SHA \                 │  │
│  │        123456789.dkr.ecr.us-east-1.amazonaws.com/\        │  │
│  │        govtech-backend:$GIT_SHA                            │  │
│  │    $ docker tag ... :latest                                │  │
│  │                                                            │  │
│  │  Step 4: Push to ECR (AWS Container Registry)              │  │
│  │    $ docker push ... govtech-backend:$GIT_SHA              │  │
│  │    $ docker push ... govtech-backend:latest                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ CI Complete → Ready for deployment                           │
└──────────────────────────────────────────────────────────────────┘
```

### Stage 3: CD Pipeline (Deployment)

```
┌──────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS - CD PIPELINE                                     │
│  Trigger: Merge to main (after PR approved)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DEPLOY TO DEV                              (automatic)   │    │
│  │                                                          │    │
│  │  Step 1: Update K8s deployment manifest                  │    │
│  │    image: govtech-backend:$GIT_SHA                       │    │
│  │                                                          │    │
│  │  Step 2: Apply to EKS (dev namespace)                    │    │
│  │    $ kubectl apply -f kubernetes/ -n dev                 │    │
│  │                                                          │    │
│  │  Step 3: Wait for rollout                                │    │
│  │    $ kubectl rollout status deployment/backend -n dev    │    │
│  │                                                          │    │
│  │  Step 4: Run smoke tests                                 │    │
│  │    $ curl https://dev.govtech.com/api/v1/health          │    │
│  │    Expected: {"success": true}                           │    │
│  │                                                          │    │
│  │  ✅ Dev deployment complete                               │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DEPLOY TO STAGING                          (automatic)   │    │
│  │                                                          │    │
│  │  Step 1: Apply to EKS (staging namespace)                │    │
│  │    $ kubectl apply -f kubernetes/ -n staging             │    │
│  │                                                          │    │
│  │  Step 2: Run integration tests                           │    │
│  │    - Test all 6 API endpoints                            │    │
│  │    - Test database operations                            │    │
│  │    - Test hybrid connection (on-premise mock)            │    │
│  │                                                          │    │
│  │  Step 3: Run security scan on live app                   │    │
│  │    Tool: OWASP ZAP (web vulnerability scanner)           │    │
│  │    Checks: XSS, SQL injection, CSRF, etc.               │    │
│  │                                                          │    │
│  │  ✅ Staging deployment complete                           │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DEPLOY TO PRODUCTION                   (manual approval) │    │
│  │                                                          │    │
│  │  ⏸️ WAIT: Team lead must approve in GitHub                │    │
│  │                                                          │    │
│  │  Step 1: Team lead reviews staging results               │    │
│  │    - All tests passed?                                   │    │
│  │    - Security scans clean?                               │    │
│  │    - Performance acceptable?                             │    │
│  │                                                          │    │
│  │  Step 2: Approve deployment                              │    │
│  │    Click "Approve" in GitHub Actions                      │    │
│  │                                                          │    │
│  │  Step 3: Rolling update to production                    │    │
│  │    $ kubectl apply -f kubernetes/ -n production          │    │
│  │                                                          │    │
│  │    [v1.2.2] [v1.2.2] [v1.2.3-starting]   ← new pod     │    │
│  │    [v1.2.2] [v1.2.3-✅] [v1.2.3-✅]       ← healthy     │    │
│  │    [v1.2.3-✅] [v1.2.3-✅] [v1.2.3-✅]    ← done        │    │
│  │                                                          │    │
│  │  Step 4: Post-deploy verification                        │    │
│  │    - Health check passes                                 │    │
│  │    - Error rate < 1%                                     │    │
│  │    - Response time < 500ms                               │    │
│  │                                                          │    │
│  │  Step 5: Notify team                                     │    │
│  │    Slack: "✅ v1.2.3 deployed to production"              │    │
│  │                                                          │    │
│  │  ✅ Production deployment complete                        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⏪ ROLLBACK (if something goes wrong):                          │
│    $ kubectl rollout undo deployment/backend -n production      │
│    Instantly reverts to previous version                         │
└──────────────────────────────────────────────────────────────────┘
```

## DevSecOps Security Scans Summary

```
┌──────────────────────────────────────────────────────────────────┐
│  SECURITY AT EVERY STAGE                                         │
│                                                                  │
│  Stage          Tool              What It Checks                 │
│  ─────          ────              ──────────────                 │
│                                                                  │
│  CODE           git-secrets       Passwords, API keys in code    │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  DEPENDENCIES   npm audit         Known CVEs in npm packages     │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  DOCKER IMAGE   Trivy             OS + app vulnerabilities       │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  TERRAFORM      Checkov           Insecure IaC configurations    │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  LIVE APP       OWASP ZAP         XSS, SQLi, CSRF on staging    │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  RUNTIME        CloudWatch        Anomaly detection in prod      │
│                                                                  │
│  Total: 6 security checkpoints before code reaches production    │
└──────────────────────────────────────────────────────────────────┘
```

## Branching Strategy

```
main (production)
│
├── staging (pre-production)
│   │
│   ├── feature/add-search ──► PR to staging ──► auto-deploy staging
│   ├── feature/add-charts ──► PR to staging ──► auto-deploy staging
│   └── fix/validation-bug ──► PR to staging ──► auto-deploy staging
│
│   When staging is stable:
│   staging ──► PR to main ──► manual approval ──► deploy production
│
└── hotfix/critical-bug ──► PR to main (emergency, skips staging)
```

## GitHub Actions File Structure

```
.github/
└── workflows/
    ├── ci.yml              # Runs on every PR
    │   ├── lint
    │   ├── test
    │   ├── security-scan
    │   └── build-image
    │
    ├── cd-dev.yml          # Runs on merge to main
    │   └── deploy to dev namespace
    │
    ├── cd-staging.yml      # Runs after dev success
    │   ├── deploy to staging
    │   ├── integration tests
    │   └── OWASP ZAP scan
    │
    ├── cd-prod.yml         # Requires manual approval
    │   ├── deploy to production
    │   ├── smoke tests
    │   └── notify team
    │
    └── scheduled-scan.yml  # Runs weekly
        ├── trivy (re-scan images)
        ├── npm audit (check new CVEs)
        └── checkov (re-scan terraform)
```

## Rollback Strategy

```
Scenario: v1.2.3 deployed to production, users report errors

Option 1: Automatic Rollback (if health check fails)
┌──────────────────────────────────────────────────┐
│  Kubernetes detects: health check failing         │
│  Action: automatically stops rollout              │
│  Result: old pods (v1.2.2) keep running          │
│  Time: 0 seconds (never fully deployed)          │
└──────────────────────────────────────────────────┘

Option 2: Manual Rollback (if issue found after deploy)
┌──────────────────────────────────────────────────┐
│  Command: kubectl rollout undo deployment/backend│
│  Action: reverts to previous version (v1.2.2)   │
│  Time: ~30 seconds                               │
│  All user traffic goes back to working version   │
└──────────────────────────────────────────────────┘

Option 3: Database Rollback (if data was corrupted)
┌──────────────────────────────────────────────────┐
│  Action: Restore RDS from point-in-time snapshot │
│  Time: ~15-30 minutes                            │
│  Can restore to any SECOND in last 30 days       │
└──────────────────────────────────────────────────┘
```

## Notifications Flow

```
Pipeline Event                    Notification
──────────────                    ────────────

PR Created                   →   GitHub: reviewers assigned
CI Fails (lint/test)         →   GitHub: ❌ PR check failed
Security Issue Found         →   Slack: 🔴 CRITICAL vulnerability
CI Passes                    →   GitHub: ✅ All checks passed
Deploy to Dev                →   Slack: 📦 v1.2.3 deployed to DEV
Deploy to Staging            →   Slack: 📦 v1.2.3 deployed to STAGING
Staging Tests Pass           →   Slack: ✅ Ready for production
Waiting for Approval         →   Slack: ⏸️ Waiting approval for PROD
Deploy to Production         →   Slack: 🚀 v1.2.3 LIVE in production
Rollback Triggered           →   Slack: ⏪ ROLLBACK to v1.2.2
Weekly Security Scan         →   Email: 📊 Weekly security report
```

## Equivalent in OCI (Oracle Cloud)

| AWS / GitHub | OCI Equivalent | Purpose |
|--------------|---------------|---------|
| GitHub Actions | OCI DevOps Build Pipeline | CI/CD automation |
| ECR | OCIR (OCI Container Registry) | Docker image storage |
| CodeBuild | OCI Build Runner | Build execution |
| CodeDeploy | OCI Deployment Pipeline | Deployment automation |
| CloudWatch | OCI Monitoring | Runtime monitoring |
| SNS (notifications) | OCI Notifications | Alert delivery |
| S3 (artifacts) | OCI Object Storage | Build artifact storage |
| IAM Roles | OCI Dynamic Groups + Policies | Pipeline permissions |

## Key Concepts for OCI Certification

```
1. What is a Build Pipeline?
   Automates: code checkout → build → test → create artifact
   OCI: Build Pipeline with Build Stages

2. What is a Deployment Pipeline?
   Automates: take artifact → deploy to environment → verify
   OCI: Deployment Pipeline with Deployment Stages

3. What are Environments in OCI DevOps?
   Targets where you deploy: OKE cluster, Compute, Functions
   Our case: OKE cluster (Kubernetes)

4. What is an Artifact?
   The result of a build: Docker image, JAR file, ZIP
   Stored in: OCIR (container images) or Artifact Registry

5. Blue-Green vs Rolling vs Canary deployment?
   Rolling: replace pods one by one (our approach)
   Blue-Green: run two full copies, switch traffic
   Canary: send 5% traffic to new version, then gradually increase
```
