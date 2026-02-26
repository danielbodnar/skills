// Codemod Basic Usage Examples

// ==============================================
// CLI Commands
// ==============================================

// Run a workflow
// npx codemod@next workflow run -w workflow.yaml

// Run with parameters
// npx codemod@next workflow run -w workflow.yaml --param version=1.2.3

// Initialize new project
// npx codemod@next init my-codemod

// Publish to registry
// npx codemod@next publish my-codemod

// Run JavaScript/TypeScript transformations
// npx codemod@next jssg --pattern '$PATTERN' --rewrite '$FIX' src/

// ==============================================
// Workflow Examples
// ==============================================

// Basic workflow structure
const basicWorkflow = `
version: 1
state:
  files: !array
    items: !string
nodes:
  - id: transform
    name: "Transform files"
    type: automatic
    steps:
      - run: |
          npx codemod@next jssg \\
            --pattern 'console.log($MSG)' \\
            --rewrite 'logger.log($MSG)' \\
            src/
`;

// Matrix workflow for multiple repositories
const matrixWorkflow = `
version: 1
state:
  repositories: !array
    items: !string
nodes:
  - id: process
    name: "Process repository"
    type: automatic
    matrix:
      repository: !state repositories
    steps:
      - run: |
          echo "Processing \${repository}"
          cd \$(basename \${repository})
          npx codemod@next jssg \\
            --pattern 'var $VAR = $VALUE' \\
            --rewrite 'const $VAR = $VALUE' \\
            src/
`;

// Manual approval workflow
const approvalWorkflow = `
version: 1
state:
  changes_approved: !boolean
  review_notes: !string
nodes:
  - id: prepare
    name: "Prepare changes"
    type: automatic
    steps:
      - run: |
          echo "Generating preview..."
          npx codemod@next jssg \\
            --pattern 'function $NAME($ARGS) { $BODY }' \\
            --rewrite 'const $NAME = ($ARGS) => { $BODY }' \\
            --dry-run \\
            src/
  
  - id: approve
    name: "Manual approval required"
    type: manual
    depends_on: [prepare]
    steps:
      - run: echo "Please review and approve changes"
  
  - id: apply
    name: "Apply changes"
    type: automatic
    depends_on: [approve]
    condition: !state changes_approved
    steps:
      - run: |
          npx codemod@next jssg \\
            --pattern 'function $NAME($ARGS) { $BODY }' \\
            --rewrite 'const $NAME = ($ARGS) => { $BODY }' \\
            src/
`;

// ==============================================
// State Management Examples
// ==============================================

// Simple state schema
const simpleState = `
state:
  project_name: !string
  version: !string
  enabled: !boolean
`;

// Complex state with arrays and objects
const complexState = `
state:
  projects: !array
    items: !object
      properties:
        name: !string
        path: !string
        dependencies: !array
          items: !string
  config: !object
    properties:
      mode: !string
      options: !object
        additionalProperties: true
`;

// ==============================================
// Dependency Management
// ==============================================

// Sequential dependencies
const sequentialDeps = `
nodes:
  - id: setup
    name: "Setup environment"
    type: automatic
    steps:
      - run: npm install
  
  - id: test
    name: "Run tests"
    type: automatic
    depends_on: [setup]
    steps:
      - run: npm test
  
  - id: transform
    name: "Apply transformation"
    type: automatic
    depends_on: [test]
    steps:
      - run: npx codemod@next jssg --pattern '$P' --rewrite '$R' src/
`;

// Parallel dependencies
const parallelDeps = `
nodes:
  - id: lint
    name: "Lint code"
    type: automatic
    steps:
      - run: npm run lint
  
  - id: test
    name: "Run tests"
    type: automatic
    steps:
      - run: npm test
  
  - id: transform
    name: "Apply transformation"
    type: automatic
    depends_on: [lint, test]  # Waits for both to complete
    steps:
      - run: npx codemod@next jssg --pattern '$P' --rewrite '$R' src/
`;

// ==============================================
// Error Handling Patterns
// ==============================================

// Error handling with fallback
const errorHandling = `
nodes:
  - id: transform
    name: "Apply transformation with fallback"
    type: automatic
    steps:
      - run: |
          if ! npx codemod@next jssg --pattern '$PATTERN' --rewrite '$FIX' src/; then
            echo "Primary transformation failed, trying fallback"
            npx codemod@next jssg --pattern '$ALT_PATTERN' --rewrite '$ALT_FIX' src/
          fi
`;

// Validation and rollback
const validationRollback = `
nodes:
  - id: backup
    name: "Create backup"
    type: automatic
    steps:
      - run: |
          git stash push -m "Before codemod transformation"
  
  - id: transform
    name: "Apply transformation"
    type: automatic
    depends_on: [backup]
    steps:
      - run: |
          npx codemod@next jssg --pattern '$PATTERN' --rewrite '$FIX' src/
  
  - id: validate
    name: "Validate changes"
    type: automatic
    depends_on: [transform]
    steps:
      - run: |
          if ! npm test; then
            echo "Tests failed, rolling back"
            git stash pop
            exit 1
          fi
`;

// ==============================================
// Integration Patterns
// ==============================================

// Git integration
const gitIntegration = `
nodes:
  - id: transform
    name: "Transform and commit"
    type: automatic
    steps:
      - run: |
          # Apply transformation
          npx codemod@next jssg \\
            --pattern 'console.log($MSG)' \\
            --rewrite 'logger.log($MSG)' \\
            src/
          
          # Commit changes
          git add .
          git commit -m "refactor: replace console.log with logger"
          git push origin feature/logger-migration
`;

// CI/CD integration
const cicdIntegration = `
nodes:
  - id: check-ci
    name: "Check CI status"
    type: automatic
    steps:
      - run: |
          # Wait for CI to pass before transforming
          gh pr checks --wait
  
  - id: transform
    name: "Apply transformation"
    type: automatic
    depends_on: [check-ci]
    steps:
      - run: |
          npx codemod@next jssg --pattern '$PATTERN' --rewrite '$FIX' src/
  
  - id: update-pr
    name: "Update pull request"
    type: automatic
    depends_on: [transform]
    steps:
      - run: |
          git add .
          git commit -m "refactor: apply codemod transformation"
          git push
`;

// ==============================================
// Advanced Workflow Patterns
// ==============================================

// Conditional execution
const conditionalExecution = `
nodes:
  - id: check-conditions
    name: "Check if transformation needed"
    type: automatic
    steps:
      - run: |
          if grep -r "console.log" src/; then
            echo "Found console.log statements"
            export TRANSFORM_NEEDED=true
          else
            echo "No console.log statements found"
            export TRANSFORM_NEEDED=false
          fi
  
  - id: transform
    name: "Apply transformation"
    type: automatic
    depends_on: [check-conditions]
    condition: !env TRANSFORM_NEEDED
    steps:
      - run: |
          npx codemod@next jssg \\
            --pattern 'console.log($MSG)' \\
            --rewrite 'logger.log($MSG)' \\
            src/
`;

// Loop with matrix
const loopMatrix = `
state:
  patterns: !array
    items: !object
      properties:
        from: !string
        to: !string
nodes:
  - id: transform-pattern
    name: "Apply pattern transformation"
    type: automatic
    matrix:
      pattern: !state patterns
    steps:
      - run: |
          npx codemod@next jssg \\
            --pattern '\${pattern.from}' \\
            --rewrite '\${pattern.to}' \\
            src/
`;

// ==============================================
// Performance Optimization
// ==============================================

// Parallel file processing
const parallelProcessing = `
state:
  file_groups: !array
    items: !array
      items: !string
nodes:
  - id: process-group
    name: "Process file group"
    type: automatic
    matrix:
      group: !state file_groups
    steps:
      - run: |
          for file in \${group[@]}; do
            npx codemod@next jssg \\
              --pattern '$PATTERN' \\
              --rewrite '$FIX' \\
              "\$file" &
          done
          wait  # Wait for all background processes
`;

// Incremental processing
const incrementalProcessing = `
state:
  processed_files: !array
    items: !string
  remaining_files: !array
    items: !string
nodes:
  - id: process-batch
    name: "Process file batch"
    type: automatic
    steps:
      - run: |
          # Process next 10 files
          for file in \${remaining_files[@]:0:10}; do
            npx codemod@next jssg \\
              --pattern '$PATTERN' \\
              --rewrite '$FIX' \\
              "\$file"
            echo "\$file" >> processed_files.txt
          done
`;

export {
  basicWorkflow,
  matrixWorkflow,
  approvalWorkflow,
  simpleState,
  complexState,
  sequentialDeps,
  parallelDeps,
  errorHandling,
  validationRollback,
  gitIntegration,
  cicdIntegration,
  conditionalExecution,
  loopMatrix,
  parallelProcessing,
  incrementalProcessing
};