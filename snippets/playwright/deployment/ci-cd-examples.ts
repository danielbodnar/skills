// GitHub Actions Workflow for Playwright Tests
// .github/workflows/playwright.yml

export const githubActionsWorkflow = `
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
        browser: [chromium, firefox, webkit]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install --frozen-lockfile
    
    - name: Install Playwright Browsers
      run: bunx playwright install --with-deps ${{ matrix.browser }}
    
    - name: Run Playwright tests
      run: bunx playwright test --project=${{ matrix.browser }}
      env:
        CI: true
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report-${{ matrix.browser }}-node${{ matrix.node-version }}
        path: playwright-report/
        retention-days: 30
    
    - name: Upload test traces
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-traces-${{ matrix.browser }}-node${{ matrix.node-version }}
        path: test-results/
        retention-days: 30

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - name: Deploy to production
      run: echo "Deploying to production..."
`;

// Docker configuration for Playwright
export const dockerConfiguration = `
# Dockerfile for Playwright tests
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy test files
COPY . .

# Run tests
CMD ["bun", "run", "test"]
`;

// Docker Compose for test environment
export const dockerCompose = `
version: '3.8'

services:
  playwright:
    build: .
    depends_on:
      - app
      - database
    environment:
      - BASE_URL=http://app:3000
      - DATABASE_URL=postgres://user:password@database:5432/testdb
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
    networks:
      - test-network

  app:
    image: node:18-alpine
    working_dir: /app
    command: npm start
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgres://user:password@database:5432/testdb
    depends_on:
      - database
    networks:
      - test-network

  database:
    image: postgres:14
    environment:
      - POSTGRES_DB=testdb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
`;

// Kubernetes deployment for test execution
export const kubernetesDeployment = `
apiVersion: batch/v1
kind: Job
metadata:
  name: playwright-tests
spec:
  template:
    spec:
      containers:
      - name: playwright
        image: playwright-tests:latest
        env:
        - name: BASE_URL
          value: "https://staging.example.com"
        - name: PARALLEL_WORKERS
          value: "4"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: test-results
          mountPath: /app/test-results
      volumes:
      - name: test-results
        persistentVolumeClaim:
          claimName: test-results-pvc
      restartPolicy: Never
`;

// Azure DevOps Pipeline
export const azureDevOpsPipeline = `
trigger:
  branches:
    include:
    - main
    - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - name: nodeVersion
    value: '18.x'

stages:
- stage: Test
  displayName: 'Run Playwright Tests'
  jobs:
  - job: PlaywrightTests
    displayName: 'Playwright Tests'
    strategy:
      matrix:
        chromium:
          browserName: 'chromium'
        firefox:
          browserName: 'firefox'
        webkit:
          browserName: 'webkit'
    steps:
    - task: NodeTool@0
      displayName: 'Install Node.js'
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
        bun install --frozen-lockfile
      displayName: 'Install Bun and dependencies'
    
    - script: |
        export PATH="$HOME/.bun/bin:$PATH"
        bunx playwright install --with-deps $(browserName)
      displayName: 'Install Playwright browsers'
    
    - script: |
        export PATH="$HOME/.bun/bin:$PATH"
        bunx playwright test --project=$(browserName)
      displayName: 'Run Playwright tests'
      env:
        CI: true
    
    - task: PublishTestResults@2
      displayName: 'Publish test results'
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results/junit.xml'
        mergeTestResults: true
        testRunTitle: 'Playwright Tests - $(browserName)'
    
    - task: PublishHtmlReport@1
      displayName: 'Publish HTML report'
      inputs:
        reportDir: 'playwright-report'
        tabName: 'Playwright Report - $(browserName)'
`;

// Jenkins Pipeline
export const jenkinsPipeline = `
pipeline {
    agent any
    
    environment {
        BUN_INSTALL = '/var/lib/jenkins/.bun'
        PATH = "$BUN_INSTALL/bin:$PATH"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    sh 'curl -fsSL https://bun.sh/install | bash'
                    sh 'bun install --frozen-lockfile'
                }
            }
        }
        
        stage('Install Browsers') {
            steps {
                sh 'bunx playwright install --with-deps'
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Chromium') {
                    steps {
                        sh 'bunx playwright test --project=chromium'
                    }
                }
                stage('Firefox') {
                    steps {
                        sh 'bunx playwright test --project=firefox'
                    }
                }
                stage('WebKit') {
                    steps {
                        sh 'bunx playwright test --project=webkit'
                    }
                }
            }
        }
        
        stage('Archive Results') {
            steps {
                archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
                
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Report'
                ])
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Playwright Tests Failed - \${BUILD_NUMBER}",
                body: "The Playwright tests have failed. Please check the build logs.",
                to: "team@example.com"
            )
        }
    }
}
`;

// GitLab CI/CD Pipeline
export const gitlabCiPipeline = `
stages:
  - install
  - test
  - deploy

variables:
  NODE_VERSION: "18"
  PLAYWRIGHT_VERSION: "1.40.0"

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - ~/.cache/ms-playwright/

install:
  stage: install
  image: node:\${NODE_VERSION}
  before_script:
    - curl -fsSL https://bun.sh/install | bash
    - export PATH="$HOME/.bun/bin:$PATH"
  script:
    - bun install --frozen-lockfile
    - bunx playwright install --with-deps
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

test:
  stage: test
  image: mcr.microsoft.com/playwright:v\${PLAYWRIGHT_VERSION}-focal
  parallel:
    matrix:
      - BROWSER: [chromium, firefox, webkit]
  before_script:
    - curl -fsSL https://bun.sh/install | bash
    - export PATH="$HOME/.bun/bin:$PATH"
  script:
    - bunx playwright test --project=\${BROWSER}
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 1 week
    reports:
      junit: test-results/junit.xml

deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
  only:
    - main
  needs:
    - test
`;

// AWS CodeBuild configuration
export const awsCodeBuild = `
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing Bun..."
      - curl -fsSL https://bun.sh/install | bash
      - export PATH="$HOME/.bun/bin:$PATH"
      - echo "Installing dependencies..."
      - bun install --frozen-lockfile
      - echo "Installing Playwright browsers..."
      - bunx playwright install --with-deps

  pre_build:
    commands:
      - echo "Setting up test environment..."
      - export BASE_URL=https://staging.example.com
      - export CI=true

  build:
    commands:
      - echo "Running Playwright tests..."
      - export PATH="$HOME/.bun/bin:$PATH"
      - bunx playwright test --reporter=junit
      - bunx playwright test --reporter=html

  post_build:
    commands:
      - echo "Uploading test results..."
      - aws s3 cp playwright-report/ s3://test-results-bucket/reports/ --recursive
      - aws s3 cp test-results/ s3://test-results-bucket/traces/ --recursive

artifacts:
  files:
    - '**/*'
  base-directory: 'playwright-report'
  name: playwright-report

reports:
  junit:
    files:
      - 'test-results/junit.xml'
    file-format: 'JUNITXML'
`;

// Terraform configuration for AWS test infrastructure
export const terraformConfig = `
provider "aws" {
  region = "us-west-2"
}

resource "aws_ecs_cluster" "playwright_cluster" {
  name = "playwright-tests"
}

resource "aws_ecs_task_definition" "playwright_task" {
  family                   = "playwright-tests"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "2048"
  memory                   = "4096"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "playwright"
      image = "playwright-tests:latest"
      environment = [
        {
          name  = "BASE_URL"
          value = "https://staging.example.com"
        },
        {
          name  = "PARALLEL_WORKERS"
          value = "4"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group  = aws_cloudwatch_log_group.playwright_logs.name
          awslogs-region = "us-west-2"
        }
      }
    }
  ])
}

resource "aws_cloudwatch_log_group" "playwright_logs" {
  name              = "/ecs/playwright-tests"
  retention_in_days = 7
}

resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
`;

// Monitoring and alerting configuration
export const monitoringConfig = `
// Grafana dashboard configuration for Playwright metrics
export const grafanaDashboard = {
  "dashboard": {
    "title": "Playwright Test Metrics",
    "panels": [
      {
        "title": "Test Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(playwright_test_passed_total[5m])) / sum(rate(playwright_test_total[5m])) * 100"
          }
        ]
      },
      {
        "title": "Test Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(playwright_test_duration_seconds_bucket[5m])) by (le))"
          }
        ]
      },
      {
        "title": "Browser Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "playwright_page_load_time_seconds"
          }
        ]
      }
    ]
  }
};

// Prometheus metrics collection
export const prometheusMetrics = \`
# Playwright test metrics
playwright_test_total counter
playwright_test_passed_total counter
playwright_test_failed_total counter
playwright_test_duration_seconds histogram
playwright_page_load_time_seconds gauge
playwright_api_response_time_seconds histogram
\`;

// Slack notifications for test results
export const slackNotification = {
  "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "channel": "#test-results",
  "message_template": {
    "text": "Playwright Test Results",
    "attachments": [
      {
        "color": "{{#if success}}good{{else}}danger{{/if}}",
        "fields": [
          {
            "title": "Status",
            "value": "{{#if success}}✅ Passed{{else}}❌ Failed{{/if}}",
            "short": true
          },
          {
            "title": "Tests Run",
            "value": "{{tests_run}}",
            "short": true
          },
          {
            "title": "Duration",
            "value": "{{duration}}",
            "short": true
          },
          {
            "title": "Browser",
            "value": "{{browser}}",
            "short": true
          }
        ]
      }
    ]
  }
};
`;

// Environment-specific configurations
export const environmentConfigs = {
  development: {
    baseURL: 'http://localhost:3000',
    workers: 1,
    retries: 0,
    timeout: 10000,
    headless: false,
    trace: 'on',
    screenshot: 'on',
    video: 'on'
  },
  
  staging: {
    baseURL: 'https://staging.example.com',
    workers: 2,
    retries: 1,
    timeout: 30000,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  production: {
    baseURL: 'https://production.example.com',
    workers: 4,
    retries: 2,
    timeout: 60000,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};

// Test data management
export const testDataManagement = `
// Database setup for tests
export const setupTestDatabase = async () => {
  const db = await connectToDatabase();
  
  // Clear existing test data
  await db.query('DELETE FROM users WHERE email LIKE "%test%"');
  await db.query('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%test%")');
  
  // Seed test data
  await db.query(\`
    INSERT INTO users (email, password, role) VALUES
    ('test1@example.com', 'hashedpassword', 'user'),
    ('test2@example.com', 'hashedpassword', 'admin'),
    ('test3@example.com', 'hashedpassword', 'user')
  \`);
  
  await db.close();
};

// Cleanup after tests
export const cleanupTestDatabase = async () => {
  const db = await connectToDatabase();
  
  await db.query('DELETE FROM users WHERE email LIKE "%test%"');
  await db.query('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%test%")');
  
  await db.close();
};
`;