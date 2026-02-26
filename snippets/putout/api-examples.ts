// Putout API Examples

// 1. Basic Transform API
import {transform} from 'putout';

const basicTransform = (code: string) => {
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  });
  
  return result.code;
};

// 2. Transform with Plugins
const transformWithPlugins = (code: string) => {
  const result = transform(code, {
    plugins: [
      'remove-unused-variables',
      'remove-debugger',
      'convert-commonjs-to-esm'
    ]
  });
  
  return {
    code: result.code,
    places: result.places
  };
};

// 3. Transform with Options
const transformWithOptions = (code: string, options: any) => {
  const result = transform(code, {
    fix: true,
    rules: {
      'remove-unused-variables': ['on', {
        aggressive: options.aggressive
      }]
    }
  });
  
  return result;
};

// 4. Batch Transform
const batchTransform = (files: string[]) => {
  const results = files.map(file => {
    const fs = require('fs');
    const source = fs.readFileSync(file, 'utf8');
    
    return transform(source, {
      fix: true,
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    });
  });
  
  return results;
};

// 5. Async Transform
const asyncTransform = async (code: string) => {
  return new Promise((resolve) => {
    const result = transform(code, {
      rules: {
        'remove-unused-variables': 'on'
      }
    });
    
    resolve(result);
  });
};

// 6. Transform with Error Handling
const safeTransform = (code: string) => {
  try {
    const result = transform(code, {
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    });
    
    return {
      success: true,
      code: result.code,
      places: result.places
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: code
    };
  }
};

// 7. Custom Rule Application
const customRuleTransform = (code: string) => {
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on',
      'convert-commonjs-to-esm': 'on',
      'simplify-logical-expressions': 'on'
    }
  });
  
  return result;
};

// 8. Environment-specific Transform
const environmentTransform = (code: string, env: string) => {
  const envRules = {
    development: {
      'remove-console': 'off',
      'remove-debugger': 'off'
    },
    production: {
      'remove-console': 'on',
      'remove-debugger': 'on'
    }
  };
  
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      ...envRules[env]
    }
  });
  
  return result;
};

// 9. File Pattern Transform
const filePatternTransform = (code: string, fileName: string) => {
  const isTestFile = fileName.includes('.test.') || fileName.includes('.spec.');
  
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on',
      'remove-only': isTestFile ? 'on' : 'off',
      'remove-skip': isTestFile ? 'on' : 'off'
    }
  });
  
  return result;
};

// 10. Plugin-specific Transform
const pluginTransform = (code: string, pluginName: string) => {
  const result = transform(code, {
    plugins: [pluginName]
  });
  
  return result;
};

// 11. Complex Transform with Multiple Options
const complexTransform = (code: string, options: any) => {
  const result = transform(code, {
    fix: options.fix || false,
    rules: {
      'remove-unused-variables': options.removeUnused ? 'on' : 'off',
      'remove-debugger': options.removeDebugger ? 'on' : 'off',
      'convert-commonjs-to-esm': options.convertESM ? 'on' : 'off'
    },
    plugins: options.plugins || [],
    match: options.match || {}
  });
  
  return result;
};

// 12. Stream Transform
const streamTransform = (inputStream: NodeJS.ReadableStream, outputStream: NodeJS.WritableStream) => {
  let buffer = '';
  
  inputStream.on('data', (chunk) => {
    buffer += chunk.toString();
  });
  
  inputStream.on('end', () => {
    const result = transform(buffer, {
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    });
    
    outputStream.write(result.code);
    outputStream.end();
  });
};

// 13. Conditional Transform
const conditionalTransform = (code: string, condition: (code: string) => boolean) => {
  if (condition(code)) {
    return transform(code, {
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    });
  }
  
  return { code, places: [] };
};

// 14. Incremental Transform
const incrementalTransform = (code: string, previousResult?: any) => {
  const baseRules = {
    'remove-unused-variables': 'on'
  };
  
  if (previousResult && previousResult.places.length > 0) {
    // Add more aggressive rules if previous transform found issues
    baseRules['remove-debugger'] = 'on';
    baseRules['remove-console'] = 'on';
  }
  
  const result = transform(code, {
    rules: baseRules
  });
  
  return result;
};

// 15. Validation Transform
const validationTransform = (code: string) => {
  // First, check if code is valid
  try {
    const result = transform(code, {
      rules: {}
    });
    
    // If no errors, apply transformations
    return transform(code, {
      rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on'
      }
    });
  } catch (error) {
    return {
      code,
      places: [],
      error: error.message
    };
  }
};

// 16. Performance Transform
const performanceTransform = (code: string) => {
  const start = Date.now();
  
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  });
  
  const end = Date.now();
  
  return {
    ...result,
    performance: {
      duration: end - start,
      linesPerSecond: code.split('\n').length / ((end - start) / 1000)
    }
  };
};

// 17. Diff Transform
const diffTransform = (code: string) => {
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  });
  
  const diff = {
    original: code,
    transformed: result.code,
    changes: result.places.map(place => ({
      rule: place.rule,
      message: place.message,
      position: place.position
    }))
  };
  
  return diff;
};

// 18. Cache Transform
const cacheTransform = (() => {
  const cache = new Map();
  
  return (code: string, options: any) => {
    const key = JSON.stringify({code, options});
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = transform(code, options);
    cache.set(key, result);
    
    return result;
  };
})();

// 19. Parallel Transform
const parallelTransform = async (files: string[]) => {
  const {Worker} = require('worker_threads');
  
  const workers = files.map(file => {
    return new Promise((resolve) => {
      const worker = new Worker(`
        const {transform} = require('putout');
        const fs = require('fs');
        
        const code = fs.readFileSync('${file}', 'utf8');
        const result = transform(code, {
          rules: {
            'remove-unused-variables': 'on',
            'remove-debugger': 'on'
          }
        });
        
        parentPort.postMessage({file: '${file}', result});
      `, {eval: true});
      
      worker.on('message', resolve);
    });
  });
  
  return Promise.all(workers);
};

// 20. Interactive Transform
const interactiveTransform = (code: string, callback: (places: any[]) => string[]) => {
  const result = transform(code, {
    rules: {
      'remove-unused-variables': 'on',
      'remove-debugger': 'on'
    }
  });
  
  if (result.places.length > 0) {
    const selectedRules = callback(result.places);
    
    // Apply only selected rules
    const filteredRules = {};
    selectedRules.forEach(rule => {
      filteredRules[rule] = 'on';
    });
    
    return transform(code, {
      rules: filteredRules
    });
  }
  
  return result;
};

export {
  basicTransform,
  transformWithPlugins,
  transformWithOptions,
  batchTransform,
  asyncTransform,
  safeTransform,
  customRuleTransform,
  environmentTransform,
  filePatternTransform,
  pluginTransform,
  complexTransform,
  streamTransform,
  conditionalTransform,
  incrementalTransform,
  validationTransform,
  performanceTransform,
  diffTransform,
  cacheTransform,
  parallelTransform,
  interactiveTransform
};