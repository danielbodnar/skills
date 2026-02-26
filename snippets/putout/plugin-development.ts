// Putout Plugin Development Examples

// 1. Basic Plugin Structure
const basicPlugin = {
  report: () => 'Remove unused variable',
  
  fix: (path) => {
    path.remove();
  },
  
  traverse: ({push}) => ({
    VariableDeclarator(path) {
      const {node} = path;
      if (isUnused(node)) {
        push(path);
      }
    }
  })
};

// 2. Advanced Plugin with Options
const advancedPlugin = {
  report: () => 'Convert CommonJS to ESM',
  
  fix: (path) => {
    const {node} = path;
    if (isRequire(node)) {
      replaceRequireWithImport(path);
    } else if (isExports(node)) {
      replaceExportsWithExport(path);
    }
  },
  
  traverse: ({push, options}) => ({
    CallExpression(path) {
      const {node} = path;
      if (isRequire(node) && !options.skipRequire) {
        push(path);
      }
    },
    
    AssignmentExpression(path) {
      const {node} = path;
      if (isExports(node) && !options.skipExports) {
        push(path);
      }
    }
  })
};

// 3. Plugin with Multiple Rules
const multiRulePlugin = {
  rules: {
    'remove-unused-variables': {
      report: () => 'Remove unused variable',
      fix: (path) => path.remove(),
      traverse: ({push}) => ({
        VariableDeclarator(path) {
          if (isUnused(path.node)) {
            push(path);
          }
        }
      })
    },
    
    'remove-debugger': {
      report: () => 'Remove debugger statement',
      fix: (path) => path.remove(),
      traverse: ({push}) => ({
        DebuggerStatement(path) {
          push(path);
        }
      })
    }
  }
};

// 4. Plugin with AST Manipulation
const astManipulationPlugin = {
  report: () => 'Simplify logical expression',
  
  fix: (path) => {
    const {node} = path;
    
    if (isTrueAndExpression(node)) {
      path.replaceWith(node.right);
    } else if (isFalseOrExpression(node)) {
      path.replaceWith(node.right);
    }
  },
  
  traverse: ({push}) => ({
    LogicalExpression(path) {
      const {node} = path;
      
      if (isTrueAndExpression(node) || isFalseOrExpression(node)) {
        push(path);
      }
    }
  })
};

// 5. Plugin with Template Matching
const templatePlugin = {
  report: () => 'Use template literal',
  
  replace: () => ({
    '"__a" + __b': '`${__a}${__b}`',
    '__a + "__b"': '`${__a}${__b}`'
  })
};

// 6. Plugin with Visitor Pattern
const visitorPlugin = {
  report: () => 'Convert function to arrow function',
  
  visitor: {
    FunctionExpression(path) {
      if (canConvertToArrow(path.node)) {
        convertToArrowFunction(path);
      }
    }
  }
};

// 7. Plugin with Custom Traversal
const customTraversalPlugin = {
  report: () => 'Remove empty blocks',
  
  traverse: ({push, pathStore}) => {
    return {
      BlockStatement(path) {
        if (isEmpty(path.node)) {
          push(path);
        }
      },
      
      Program: {
        exit(path) {
          // Custom logic after traversing all nodes
          pathStore.markAsChanged();
        }
      }
    };
  },
  
  fix: (path) => {
    if (path.parent.type === 'IfStatement') {
      path.remove();
    }
  }
};

// 8. Plugin with Conditional Logic
const conditionalPlugin = {
  report: () => 'Remove unreachable code',
  
  fix: (path) => {
    const unreachableNodes = getUnreachableNodes(path);
    unreachableNodes.forEach(node => node.remove());
  },
  
  traverse: ({push}) => ({
    IfStatement(path) {
      const {node} = path;
      
      if (isAlwaysTrue(node.test)) {
        push(path);
      } else if (isAlwaysFalse(node.test)) {
        push(path);
      }
    }
  })
};

// 9. Plugin Testing Helper
const testPlugin = (plugin, source, expected) => {
  const {transform} = require('putout');
  
  const result = transform(source, {
    plugins: [plugin]
  });
  
  return result.code === expected;
};

// 10. Plugin with Options Validation
const optionsPlugin = {
  report: () => 'Custom transformation',
  
  validate: (options) => {
    if (!options.rules) {
      throw new Error('Options must include rules');
    }
    
    if (!Array.isArray(options.rules)) {
      throw new Error('Rules must be an array');
    }
    
    return true;
  },
  
  traverse: ({push, options}) => ({
    Program(path) {
      if (options.rules.includes('remove-unused')) {
        // Apply transformation
        push(path);
      }
    }
  })
};

// 11. Plugin with Metadata
const metadataPlugin = {
  meta: {
    name: 'custom-plugin',
    version: '1.0.0',
    description: 'Custom transformation plugin',
    author: 'Developer Name',
    fixable: true,
    category: 'code-quality'
  },
  
  report: () => 'Apply custom transformation',
  
  fix: (path) => {
    // Transformation logic
  },
  
  traverse: ({push}) => ({
    // Visitor methods
  })
};

// 12. Plugin Factory Pattern
const createPlugin = (options = {}) => {
  return {
    report: () => options.message || 'Default message',
    
    fix: (path) => {
      if (options.aggressive) {
        path.remove();
      } else {
        path.skip();
      }
    },
    
    traverse: ({push}) => ({
      [options.nodeType || 'Identifier'](path) {
        if (options.condition ? options.condition(path) : true) {
          push(path);
        }
      }
    })
  };
};

// 13. Plugin with Error Handling
const errorHandlingPlugin = {
  report: () => 'Safe transformation',
  
  fix: (path) => {
    try {
      performTransformation(path);
    } catch (error) {
      console.warn(`Transformation failed: ${error.message}`);
      return false;
    }
    
    return true;
  },
  
  traverse: ({push}) => ({
    CallExpression(path) {
      try {
        if (shouldTransform(path)) {
          push(path);
        }
      } catch (error) {
        // Log error but continue processing
        console.warn(`Error processing node: ${error.message}`);
      }
    }
  })
};

// Helper functions
function isUnused(node) {
  // Check if variable is unused
  return false;
}

function isRequire(node) {
  return node.callee && node.callee.name === 'require';
}

function isExports(node) {
  return node.left && node.left.type === 'MemberExpression' && 
         node.left.object.name === 'module' && 
         node.left.property.name === 'exports';
}

function isTrueAndExpression(node) {
  return node.operator === '&&' && node.left.value === true;
}

function isFalseOrExpression(node) {
  return node.operator === '||' && node.left.value === false;
}

function isEmpty(node) {
  return node.body.length === 0;
}

function canConvertToArrow(node) {
  return !node.generator && !node.async;
}

function convertToArrowFunction(path) {
  // Convert function to arrow function
}

function isAlwaysTrue(node) {
  return node.type === 'Literal' && node.value === true;
}

function isAlwaysFalse(node) {
  return node.type === 'Literal' && node.value === false;
}

function getUnreachableNodes(path) {
  return [];
}

function replaceRequireWithImport(path) {
  // Replace require with import
}

function replaceExportsWithExport(path) {
  // Replace exports with export
}

function performTransformation(path) {
  // Perform transformation
}

function shouldTransform(path) {
  return true;
}

export {
  basicPlugin,
  advancedPlugin,
  multiRulePlugin,
  astManipulationPlugin,
  templatePlugin,
  visitorPlugin,
  customTraversalPlugin,
  conditionalPlugin,
  testPlugin,
  optionsPlugin,
  metadataPlugin,
  createPlugin,
  errorHandlingPlugin
};