#!/bin/bash

# CI/CD Pipeline Example with Podman

set -e

# Build stage
echo "Building application..."
podman build -t myapp:${BUILD_NUMBER:-latest} .

# Test stage
echo "Running tests..."
podman run --rm \
  -v $(pwd):/workspace:Z \
  --workdir /workspace \
  myapp:${BUILD_NUMBER:-latest} \
  npm test

# Security scan
echo "Scanning for vulnerabilities..."
podman run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/workspace:Z \
  aquasec/trivy:latest \
  image myapp:${BUILD_NUMBER:-latest}

# Multi-stage build optimization
echo "Building optimized production image..."
cat > Containerfile.prod << EOF
FROM node:alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
EOF

podman build -f Containerfile.prod -t myapp:prod .

# Push to registry
if [ "$CI" = "true" ]; then
  echo "Pushing to registry..."
  podman login -u $REGISTRY_USER -p $REGISTRY_PASS $REGISTRY_URL
  podman tag myapp:prod $REGISTRY_URL/myapp:${BUILD_NUMBER:-latest}
  podman push $REGISTRY_URL/myapp:${BUILD_NUMBER:-latest}
fi

# Deployment
echo "Deploying application..."
envsubst < k8s-deployment.yaml | podman play kube -

# Health check
echo "Performing health check..."
timeout 30 bash -c 'until curl -f http://localhost:8080/health; do sleep 2; done'

echo "Pipeline completed successfully!"