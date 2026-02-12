#!/bin/bash

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"123456789012"}
BACKEND_REPO="govtech-backend"
FRONTEND_REPO="govtech-frontend"

# ECR registry URL
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Authenticating with Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

echo "Building Docker images..."
docker build -t $BACKEND_REPO:latest ../../app/backend
docker build -t $FRONTEND_REPO:latest ../../app/frontend

echo "Tagging images for ECR..."
docker tag $BACKEND_REPO:latest $ECR_REGISTRY/$BACKEND_REPO:latest
docker tag $FRONTEND_REPO:latest $ECR_REGISTRY/$FRONTEND_REPO:latest

echo "Pushing images to ECR..."
docker push $ECR_REGISTRY/$BACKEND_REPO:latest
docker push $ECR_REGISTRY/$FRONTEND_REPO:latest

echo "Push completed successfully!"
