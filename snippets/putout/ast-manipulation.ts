// AST Manipulation Examples with Putout

// 1. Basic AST Node Types
const astNodeTypes = {
  // Literals
  literal: {
    type: 'Literal',
    value: 'hello',
    raw: '"hello"'
  },
  
  // Identifiers
  identifier: {
    type: 'Identifier',
    name: 'variableName'
  },
  
  // Member expressions
  memberExpression: {
    type: 'MemberExpression',
    object: {type: 'Identifier', name: 'obj'},
    property: {type: 'Identifier', name: 'prop'},
    computed: false
  },
  
  // Binary expressions
  binaryExpression: {
    type: 'BinaryExpression',
    operator: '+',
    left: {type: 'Identifier', name: 'a'},
    right: {type: 'Identifier', name: 'b'}
  }
};

// 2. AST Traversal Patterns
const traversalPatterns = {
  // Visit all identifiers
  visitIdentifiers: ({push}) => ({
    Identifier(path) {
      const {node} = path;
      console.log(`Found identifier: ${node.name}`);
      push(path);
    }
  }),
  
  // Visit function declarations
  visitFunctions: ({push}) => ({
    FunctionDeclaration(path) {
      const {node} = path;
      console.log(`Found function: ${node.id.name}`);
      push(path);
    }
  }),
  
  // Visit variable declarations
  visitVariables: ({push}) => ({
    VariableDeclarator(path) {
      const {node} = path;
      if (node.id.type === 'Identifier') {
        console.log(`Found variable: ${node.id.name}`);
        push(path);
      }
    }
  })
};

// 3. AST Transformation Examples
const transformations = {
  // Remove unused variables
  removeUnusedVariables: {
    report: () => 'Remove unused variable',
    
    fix: (path) => {
      path.remove();
    },
    
    traverse: ({push}) => ({
      VariableDeclarator(path) {
        const {node, scope} = path;
        
        if (node.id.type === 'Identifier') {
          const binding = scope.getBinding(node.id.name);
          
          if (binding && !binding.referenced) {
            push(path);
          }
        }
      }
    })
  },
  
  // Convert function to arrow function
  convertToArrowFunction: {
    report: () => 'Convert to arrow function',
    
    fix: (path) => {
      const {node} = path;
      
      const arrowFunction = {
        type: 'ArrowFunctionExpression',
        params: node.params,
        body: node.body,
        async: node.async,
        generator: false
      };
      
      path.replaceWith(arrowFunction);
    },
    
    traverse: ({push}) => ({
      FunctionExpression(path) {
        const {node} = path;
        
        if (!node.generator && !hasThisBinding(path)) {
          push(path);
        }
      }
    })
  },
  
  // Simplify logical expressions
  simplifyLogicalExpressions: {
    report: () => 'Simplify logical expression',
    
    fix: (path) => {
      const {node} = path;
      
      if (node.operator === '&&' && isLiteralTrue(node.left)) {
        path.replaceWith(node.right);
      } else if (node.operator === '||' && isLiteralFalse(node.left)) {
        path.replaceWith(node.right);
      }
    },
    
    traverse: ({push}) => ({
      LogicalExpression(path) {
        const {node} = path;
        
        if (canSimplify(node)) {
          push(path);
        }
      }
    })
  }
};

// 4. AST Node Creation Helpers
const createNodes = {
  // Create identifier
  createIdentifier: (name) => ({
    type: 'Identifier',
    name
  }),
  
  // Create literal
  createLiteral: (value) => ({
    type: 'Literal',
    value,
    raw: typeof value === 'string' ? `"${value}"` : String(value)
  }),
  
  // Create member expression
  createMemberExpression: (object, property, computed = false) => ({
    type: 'MemberExpression',
    object,
    property,
    computed
  }),
  
  // Create call expression
  createCallExpression: (callee, args) => ({
    type: 'CallExpression',
    callee,
    arguments: args
  }),
  
  // Create assignment expression
  createAssignmentExpression: (left, right, operator = '=') => ({
    type: 'AssignmentExpression',
    operator,
    left,
    right
  })
};

// 5. AST Pattern Matching
const patternMatching = {
  // Match console.log calls
  matchConsoleLog: (node) => {
    return node.type === 'CallExpression' &&
           node.callee.type === 'MemberExpression' &&
           node.callee.object.name === 'console' &&
           node.callee.property.name === 'log';
  },
  
  // Match require calls
  matchRequire: (node) => {
    return node.type === 'CallExpression' &&
           node.callee.type === 'Identifier' &&
           node.callee.name === 'require' &&
           node.arguments.length === 1;
  },
  
  // Match arrow functions
  matchArrowFunction: (node) => {
    return node.type === 'ArrowFunctionExpression';
  },
  
  // Match object destructuring
  matchObjectDestructuring: (node) => {
    return node.type === 'ObjectPattern';
  }
};

// 6. Complex AST Manipulation
const complexManipulation = {
  // Convert CommonJS to ESM
  convertCommonJSToESM: {
    report: () => 'Convert CommonJS to ESM',
    
    fix: (path) => {
      const {node} = path;
      
      if (isRequireCall(node)) {
        const importDeclaration = createImportDeclaration(node);
        path.replaceWith(importDeclaration);
      } else if (isExportsAssignment(node)) {
        const exportDeclaration = createExportDeclaration(node);
        path.replaceWith(exportDeclaration);
      }
    },
    
    traverse: ({push}) => ({
      CallExpression(path) {
        if (isRequireCall(path.node)) {
          push(path);
        }
      },
      
      AssignmentExpression(path) {
        if (isExportsAssignment(path.node)) {
          push(path);
        }
      }
    })
  },
  
  // Inline single-use variables
  inlineSingleUseVariables: {
    report: () => 'Inline single-use variable',
    
    fix: (path) => {
      const {node, scope} = path;
      const binding = scope.getBinding(node.id.name);
      
      if (binding && binding.references === 1) {
        const reference = binding.referencePaths[0];
        reference.replaceWith(node.init);
        path.remove();
      }
    },
    
    traverse: ({push}) => ({
      VariableDeclarator(path) {
        const {node, scope} = path;
        
        if (node.id.type === 'Identifier' && node.init) {
          const binding = scope.getBinding(node.id.name);
          
          if (binding && binding.references === 1) {
            push(path);
          }
        }
      }
    })
  }
};

// 7. AST Utility Functions
const astUtils = {
  // Check if node is a literal
  isLiteral: (node) => node.type === 'Literal',
  
  // Check if node is an identifier
  isIdentifier: (node) => node.type === 'Identifier',
  
  // Check if node is a function
  isFunction: (node) => {
    return node.type === 'FunctionDeclaration' ||
           node.type === 'FunctionExpression' ||
           node.type === 'ArrowFunctionExpression';
  },
  
  // Get function name
  getFunctionName: (node) => {
    if (node.type === 'FunctionDeclaration') {
      return node.id ? node.id.name : null;
    }
    return null;
  },
  
  // Check if node has side effects
  hasSideEffects: (node) => {
    if (node.type === 'CallExpression') {
      return true;
    }
    
    if (node.type === 'AssignmentExpression') {
      return true;
    }
    
    return false;
  }
};

// 8. Scope Analysis
const scopeAnalysis = {
  // Find unused variables in scope
  findUnusedVariables: (scope) => {
    const unused = [];
    
    for (const [name, binding] of Object.entries(scope.bindings)) {
      if (!binding.referenced) {
        unused.push(name);
      }
    }
    
    return unused;
  },
  
  // Find variable references
  findReferences: (scope, variableName) => {
    const binding = scope.getBinding(variableName);
    return binding ? binding.referencePaths : [];
  },
  
  // Check if variable is used
  isVariableUsed: (scope, variableName) => {
    const binding = scope.getBinding(variableName);
    return binding && binding.referenced;
  }
};

// 9. AST Validation
const astValidation = {
  // Validate AST structure
  validateAST: (ast) => {
    try {
      // Basic structure validation
      if (!ast || typeof ast !== 'object') {
        return false;
      }
      
      if (!ast.type || !ast.body) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('AST validation error:', error);
      return false;
    }
  },
  
  // Check if transformation is safe
  isSafeTransformation: (path) => {
    try {
      // Check if parent exists
      if (!path.parent) {
        return false;
      }
      
      // Check if node can be safely removed
      if (path.isReferencedIdentifier()) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
};

// 10. Error Handling in AST Operations
const errorHandling = {
  // Safe node replacement
  safeReplaceWith: (path, newNode) => {
    try {
      path.replaceWith(newNode);
      return true;
    } catch (error) {
      console.error('Failed to replace node:', error);
      return false;
    }
  },
  
  // Safe node removal
  safeRemove: (path) => {
    try {
      if (path.isReferencedIdentifier()) {
        return false;
      }
      
      path.remove();
      return true;
    } catch (error) {
      console.error('Failed to remove node:', error);
      return false;
    }
  }
};

// Helper functions
function hasThisBinding(path) {
  // Check if function uses 'this'
  return false;
}

function isLiteralTrue(node) {
  return node.type === 'Literal' && node.value === true;
}

function isLiteralFalse(node) {
  return node.type === 'Literal' && node.value === false;
}

function canSimplify(node) {
  return (node.operator === '&&' && isLiteralTrue(node.left)) ||
         (node.operator === '||' && isLiteralFalse(node.left));
}

function isRequireCall(node) {
  return node.type === 'CallExpression' &&
         node.callee.type === 'Identifier' &&
         node.callee.name === 'require';
}

function isExportsAssignment(node) {
  return node.type === 'AssignmentExpression' &&
         node.left.type === 'MemberExpression' &&
         node.left.object.name === 'module' &&
         node.left.property.name === 'exports';
}

function createImportDeclaration(requireNode) {
  // Create import declaration from require
  return {
    type: 'ImportDeclaration',
    specifiers: [],
    source: requireNode.arguments[0]
  };
}

function createExportDeclaration(exportsNode) {
  // Create export declaration from exports
  return {
    type: 'ExportDefaultDeclaration',
    declaration: exportsNode.right
  };
}

export {
  astNodeTypes,
  traversalPatterns,
  transformations,
  createNodes,
  patternMatching,
  complexManipulation,
  astUtils,
  scopeAnalysis,
  astValidation,
  errorHandling
};