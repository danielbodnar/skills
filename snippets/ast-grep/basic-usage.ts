// ast-grep Basic Usage Examples

// ==============================================
// CLI Pattern Matching
// ==============================================

// Find all console.log statements
// ast-grep --pattern 'console.log($$$)' src/

// Find specific function calls
// ast-grep --pattern 'fetch($URL)' --lang ts src/

// Find variable declarations
// ast-grep --pattern 'const $VAR = $VALUE' src/

// ==============================================
// CLI Code Transformation
// ==============================================

// Replace console.log with logger
// ast-grep --pattern 'console.log($MSG)' --rewrite 'logger.log($MSG)' src/

// Modernize function syntax
// ast-grep --pattern 'function $NAME($ARGS) { $$$BODY }' --rewrite 'const $NAME = ($ARGS) => { $$$BODY }' src/

// Add optional chaining
// ast-grep --pattern '$OBJ && $OBJ.$PROP' --rewrite '$OBJ?.$PROP' src/

// ==============================================
// Interactive Mode
// ==============================================

// Review changes before applying
// ast-grep --pattern '$PATTERN' --rewrite '$FIX' --interactive src/

// Dry run to preview changes
// ast-grep --pattern '$PATTERN' --rewrite '$FIX' --dry-run src/

// ==============================================
// Meta Variable Examples
// ==============================================

// Single meta variables (must be uppercase)
const examples = {
  // $VAR matches single identifier
  pattern1: 'const $VAR = 123',
  
  // $$$ARGS matches multiple arguments
  pattern2: 'console.log($$$ARGS)',
  
  // $_ anonymous variable (doesn't capture)
  pattern3: 'if ($_ === null) $BODY',
  
  // Named meta variables for clarity
  pattern4: 'function $FUNCTION_NAME($$$PARAMETERS) { $$$BODY }'
};

// ==============================================
// Language-Specific Examples
// ==============================================

// JavaScript/TypeScript
// ast-grep --pattern 'import { $$$IMPORTS } from "$MODULE"' --lang ts

// Python
// ast-grep --pattern 'def $FUNC($$$ARGS): $$$BODY' --lang python

// Rust
// ast-grep --pattern 'fn $FUNC($$$ARGS) -> $RETURN { $$$BODY }' --lang rust

// Go
// ast-grep --pattern 'func $FUNC($$$ARGS) $RETURN { $$$BODY }' --lang go

// ==============================================
// Complex Pattern Examples
// ==============================================

// Find React hooks with specific patterns
// ast-grep --pattern 'const [$STATE, $SETTER] = useState($INITIAL)' --lang tsx

// Find async/await patterns
// ast-grep --pattern 'async function $FUNC($$$ARGS) { $$$BODY }' --lang ts

// Find class methods
// ast-grep --pattern 'class $CLASS { $METHOD($$$ARGS) { $$$BODY } }' --lang ts

// ==============================================
// File Filtering
// ==============================================

// Search only specific file types
// ast-grep --pattern '$PATTERN' 'src/**/*.ts' 'src/**/*.tsx'

// Exclude test files
// ast-grep --pattern '$PATTERN' src/ --ignore 'src/**/*.test.ts'

// Search in specific directories
// ast-grep --pattern '$PATTERN' src/components/ src/utils/

// ==============================================
// Output Formatting
// ==============================================

// JSON output for tooling
// ast-grep --pattern '$PATTERN' --json src/

// Compact output
// ast-grep --pattern '$PATTERN' --compact src/

// Show context lines
// ast-grep --pattern '$PATTERN' --context 3 src/

// ==============================================
// Error Handling Examples
// ==============================================

// Handle invalid patterns gracefully
function validatePattern(pattern: string): boolean {
  try {
    // Test pattern in playground first
    return pattern.includes('$') && /^[A-Z_][A-Z0-9_]*$/.test(
      pattern.match(/\$([A-Z_][A-Z0-9_]*)/)?.[1] || ''
    );
  } catch {
    return false;
  }
}

// Common pattern mistakes to avoid
const invalidPatterns = [
  'console.log($msg)',     // lowercase meta variable
  'function $func() {}',   // lowercase meta variable
  '$1VAR',                 // starts with number
  'const $var-name',       // contains hyphen
];

const validPatterns = [
  'console.log($MSG)',     // uppercase meta variable
  'function $FUNC() {}',   // uppercase meta variable
  '$VAR_1',                // underscore and number
  'const $VAR_NAME',       // underscore separation
];

// ==============================================
// Performance Tips
// ==============================================

// Use specific patterns to reduce false positives
const specificPatterns = [
  // Instead of: console.log($$$)
  'console.log($MSG)',     // More specific
  
  // Instead of: $FUNC($$$)
  'useState($INITIAL)',    // Target specific functions
  
  // Instead of: $VAR = $VALUE
  'const $VAR = $VALUE',   // Specify declaration type
];

// Use kind-based matching for performance
// ast-grep --pattern '$_' --kind function_declaration src/
// ast-grep --pattern '$_' --kind variable_declarator src/

export {
  examples,
  validatePattern,
  invalidPatterns,
  validPatterns,
  specificPatterns
};