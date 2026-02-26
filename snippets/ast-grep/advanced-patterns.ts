// ast-grep Advanced Patterns and Techniques

// ==============================================
// Complex Pattern Matching
// ==============================================

// Nested function calls with constraints
const nestedFunctionCalls = `
id: nested-api-calls
language: TypeScript
rule:
  pattern: await fetch($URL)
  inside:
    pattern: async function $FUNC($$$ARGS) { $$$BODY }
    inside:
      kind: class_body
constraints:
  URL:
    regex: '^["\`]https?://'
message: API call in class method
`;

// React Hook dependencies analysis
const hookDependencies = `
id: exhaustive-deps
language: TypeScript
rule:
  pattern: useEffect($CALLBACK, [$$$DEPS])
  inside:
    kind: function_declaration
    has:
      pattern: const [$STATE, $SETTER] = useState($INITIAL)
message: Verify useEffect dependencies include all state variables
`;

// Generic type parameter matching
const genericTypeParams = `
id: generic-constraint
language: TypeScript
rule:
  pattern: function $FUNC<$TYPE extends $CONSTRAINT>($$$ARGS): $RETURN { $$$BODY }
constraints:
  TYPE:
    regex: '^[A-Z]'
  CONSTRAINT:
    regex: '^(string|number|boolean|object)'
message: Generic function with primitive constraint
`;

// ==============================================
// Multi-Node Transformations
// ==============================================

// Convert barrel imports to individual imports
const barrelImportTransform = `
id: barrel-to-individual
language: TypeScript
rule:
  pattern: import {$$$IMPORTS} from '$MODULE'
rewriters:
- id: individual-import
  rule:
    pattern: $IMPORT
    kind: identifier
  transform:
    MODULE_PATH:
      convert:
        source: $IMPORT
        toCase: kebab-case
  fix: import $IMPORT from '$MODULE/$MODULE_PATH'
transform:
  NEW_IMPORTS:
    rewrite:
      rewriters: [individual-import]
      source: $$$IMPORTS
      joinBy: "\\n"
fix: $NEW_IMPORTS
`;

// Class to functional component conversion
const classToFunctional = `
id: class-to-functional
language: TypeScript
rule:
  pattern: |
    class $COMPONENT extends React.Component<$PROPS> {
      render() {
        return $JSX;
      }
    }
transform:
  FUNCTIONAL_COMPONENT:
    replace:
      source: $JSX
      replace: 'this\\.'
      by: ''
fix: |
  const $COMPONENT: React.FC<$PROPS> = (props) => {
    return $FUNCTIONAL_COMPONENT;
  };
`;

// ==============================================
// Performance-Critical Patterns
// ==============================================

// Detect expensive operations in render
const expensiveRender = `
id: expensive-render-operation
language: TypeScript
rule:
  any:
    - pattern: $ARRAY.sort($$$)
    - pattern: $ARRAY.filter($$$).map($$$)
    - pattern: JSON.parse($$$)
    - pattern: new Date($$$)
  inside:
    pattern: |
      function $COMPONENT($$$PROPS) {
        $$$STATEMENTS
        return $JSX;
      }
message: Expensive operation in render function, consider memoization
fix: useMemo(() => $MATCH, [/* dependencies */])
`;

// Identify missing React.memo opportunities
const memoOpportunities = `
id: memo-opportunity
language: TypeScript
rule:
  pattern: |
    const $COMPONENT: React.FC<$PROPS> = ($PARAMS) => {
      $$$BODY
    };
  not:
    precedes:
      pattern: React.memo($COMPONENT)
  inside:
    kind: program
    has:
      pattern: export { $COMPONENT }
message: Component may benefit from React.memo
fix: |
  const $COMPONENT: React.FC<$PROPS> = React.memo(($PARAMS) => {
    $$$BODY
  });
`;

// ==============================================
// Security Pattern Detection
// ==============================================

// SQL injection vulnerability detection
const sqlInjection = `
id: sql-injection-risk
language: JavaScript
rule:
  any:
    - pattern: query(\`SELECT * FROM $TABLE WHERE id = \${$ID}\`)
    - pattern: db.exec($SQL + $USER_INPUT)
    - pattern: connection.query($QUERY + $DYNAMIC)
constraints:
  USER_INPUT:
    regex: '(req\\.|params\\.|body\\.)'
  DYNAMIC:
    regex: '(req\\.|params\\.|body\\.)'
message: Potential SQL injection vulnerability
severity: error
note: |
  Dynamic SQL construction with user input can lead to SQL injection.
  Use parameterized queries or prepared statements instead.
`;

// XSS vulnerability in React
const xssVulnerability = `
id: react-xss-risk
language: TypeScript
rule:
  pattern: <div dangerouslySetInnerHTML={{__html: $CONTENT}} />
constraints:
  CONTENT:
    regex: '(props\\.|state\\.|.*\\.innerHTML)'
message: Potential XSS vulnerability
severity: error
fix: <div>{$CONTENT}</div>
`;

// Insecure random number generation
const weakRandom = `
id: weak-random
language: JavaScript
rule:
  pattern: Math.random()
  inside:
    any:
      - has:
          regex: '(password|token|secret|key|salt)'
      - pattern: function generate$TYPE($$$) { $$$BODY }
        constraints:
          TYPE:
            regex: '(Password|Token|Secret|Key|Salt)'
message: Use cryptographically secure random number generation
fix: crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)
`;

// ==============================================
// Error Handling Patterns
// ==============================================

// Missing error handling in async functions
const missingErrorHandling = `
id: missing-error-handling
language: TypeScript
rule:
  pattern: |
    async function $FUNC($$$ARGS) {
      $$$STATEMENTS
      await $PROMISE;
      $$$MORE_STATEMENTS
    }
  not:
    has:
      any:
        - pattern: try { $$$BODY } catch ($ERR) { $$$CATCH }
        - pattern: $PROMISE.catch($HANDLER)
        - pattern: await $PROMISE.catch($HANDLER)
message: Async function missing error handling
fix: |
  async function $FUNC($$$ARGS) {
    try {
      $$$STATEMENTS
      await $PROMISE;
      $$$MORE_STATEMENTS
    } catch (error) {
      // Handle error appropriately
      console.error('Error in $FUNC:', error);
      throw error;
    }
  }
`;

// Swallowed errors
const swallowedErrors = `
id: swallowed-errors
language: JavaScript
rule:
  pattern: |
    try {
      $$$BODY
    } catch ($ERR) {
      // Empty catch block or only logging
    }
  any:
    - not:
        has:
          pattern: throw $_
    - not:
        has:
          pattern: return $_
message: Error is being swallowed without proper handling
severity: warning
`;

// ==============================================
// Code Quality Patterns
// ==============================================

// Detect magic numbers
const magicNumbers = `
id: magic-numbers
language: TypeScript
rule:
  pattern: $VAR $OP $NUMBER
constraints:
  NUMBER:
    regex: '^[0-9]{2,}$'  # Numbers with 2+ digits
  OP:
    regex: '^(===|!==|>|<|>=|<=|\\+|\\-|\\*|\\/)$'
  VAR:
    regex: '^(?!.*\\.length).*$'  # Exclude .length comparisons
message: Consider extracting magic number to named constant
fix: |
  const MEANINGFUL_NAME = $NUMBER;
  $VAR $OP MEANINGFUL_NAME
`;

// Inconsistent naming conventions
const namingConventions = `
id: inconsistent-naming
language: TypeScript
rule:
  any:
    - pattern: const $VAR = $VALUE
      constraints:
        VAR:
          regex: '^[A-Z]'  # Constants should be UPPER_CASE
    - pattern: function $FUNC($$$) { $$$BODY }
      constraints:
        FUNC:
          regex: '^[A-Z]'  # Functions should be camelCase
    - pattern: class $CLASS { $$$BODY }
      constraints:
        CLASS:
          regex: '^[a-z]'  # Classes should be PascalCase
message: Inconsistent naming convention
`;

// ==============================================
// Migration Patterns
// ==============================================

// CommonJS to ES Modules
const cjsToEsm = `
id: cjs-to-esm
language: JavaScript
rule:
  any:
    - pattern: const $VAR = require('$MODULE')
    - pattern: module.exports = $EXPORT
    - pattern: exports.$PROP = $VALUE
fix: |
  import $VAR from '$MODULE'  # for require
  export default $EXPORT      # for module.exports
  export const $PROP = $VALUE # for exports.prop
`;

// Legacy React class components
const legacyReactClass = `
id: legacy-react-class
language: TypeScript
rule:
  pattern: |
    class $COMPONENT extends React.Component {
      constructor(props) {
        super(props);
        this.state = { $$$STATE };
      }
      
      render() {
        return $JSX;
      }
    }
transform:
  STATE_HOOKS:
    rewrite:
      rewriters: [state-to-hooks]
      source: $$$STATE
      joinBy: "\\n  "
fix: |
  const $COMPONENT: React.FC = () => {
    $STATE_HOOKS
    
    return $JSX;
  };
rewriters:
- id: state-to-hooks
  rule:
    pattern: $KEY: $VALUE
  fix: const [$KEY, set$KEY] = useState($VALUE);
`;

// ==============================================
// Testing Patterns
// ==============================================

// Incomplete test coverage
const incompleteTests = `
id: incomplete-test-coverage
language: TypeScript
rule:
  pattern: |
    describe('$COMPONENT', () => {
      it('$TEST_NAME', () => {
        $$$TEST_BODY
      });
    });
  not:
    has:
      any:
        - pattern: it('handles error cases', () => { $$$BODY })
        - pattern: it('handles edge cases', () => { $$$BODY })
        - pattern: expect(() => $CALL).toThrow()
message: Consider adding error case and edge case tests
`;

// Brittle selectors in tests
const brittleSelectors = `
id: brittle-test-selectors
language: TypeScript
rule:
  pattern: $QUERY('$SELECTOR')
constraints:
  QUERY:
    regex: '^(querySelector|getByText|getByRole)'
  SELECTOR:
    regex: '^\\.'  # Class selectors are brittle
message: Use data-testid or semantic selectors instead of class names
fix: $QUERY('[data-testid="$SELECTOR"]')
`;

export {
  nestedFunctionCalls,
  hookDependencies,
  genericTypeParams,
  barrelImportTransform,
  classToFunctional,
  expensiveRender,
  memoOpportunities,
  sqlInjection,
  xssVulnerability,
  weakRandom,
  missingErrorHandling,
  swallowedErrors,
  magicNumbers,
  namingConventions,
  cjsToEsm,
  legacyReactClass,
  incompleteTests,
  brittleSelectors
};