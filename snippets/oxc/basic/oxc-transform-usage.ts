// Basic oxc-transform usage examples

import { transform, isolatedDeclaration } from 'oxc-transform';

/**
 * Basic TypeScript transformation
 */
export const basicTransform = () => {
  const sourceCode = `
    interface User {
      id: string;
      name: string;
    }
    
    class UserService {
      getUser(id: string): User {
        return { id, name: 'John Doe' };
      }
    }
  `;

  const result = transform('user.ts', sourceCode, {
    typescript: {
      onlyRemoveTypeImports: true,
      declaration: true
    }
  });

  console.log('Transformed JS:', result.code);
  console.log('Generated .d.ts:', result.declaration);
  
  return result;
};

/**
 * React/JSX transformation
 */
export const reactTransform = () => {
  const jsxCode = `
    import React from 'react';
    
    const App: React.FC = () => {
      return <div>Hello, World!</div>;
    };
    
    export default App;
  `;

  const result = transform('App.tsx', jsxCode, {
    jsx: {
      plugin: 'react',
      development: true,
      refresh: {
        refreshReg: '$RefreshReg$',
        refreshSig: '$RefreshSig$',
        emitFullSignatures: true
      }
    },
    typescript: {
      declaration: true
    }
  });

  return result;
};

/**
 * Isolated declarations for .d.ts generation
 */
export const generateDeclarations = () => {
  const typeScriptCode = `
    export interface ApiResponse<T> {
      data: T;
      status: number;
      message: string;
    }
    
    export class ApiClient {
      private baseUrl: string;
      
      constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
      }
      
      async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        // Implementation
        throw new Error('Not implemented');
      }
    }
  `;

  const result = isolatedDeclaration('api.ts', typeScriptCode);
  
  if (result.errors.length > 0) {
    console.error('Declaration errors:', result.errors);
  }
  
  return result.code;
};

/**
 * Styled-components transformation
 */
export const styledComponentsTransform = () => {
  const styledCode = `
    import styled from 'styled-components';
    
    const Button = styled.button\`
      background: \${props => props.primary ? 'blue' : 'white'};
      color: \${props => props.primary ? 'white' : 'blue'};
      padding: 1rem 2rem;
      border: 2px solid blue;
      border-radius: 4px;
    \`;
    
    export default Button;
  `;

  const result = transform('Button.tsx', styledCode, {
    jsx: {
      plugin: 'react'
    },
    plugins: {
      styledComponents: {
        displayName: true,
        ssr: true,
        fileName: true,
        minify: true
      }
    }
  });

  return result;
};

/**
 * Batch transformation of multiple files
 */
export const batchTransform = async (files: Array<{ path: string; content: string }>) => {
  const transformPromises = files.map(async ({ path, content }) => {
    try {
      const result = transform(path, content, {
        typescript: {
          declaration: path.endsWith('.ts') || path.endsWith('.tsx')
        },
        jsx: path.endsWith('.jsx') || path.endsWith('.tsx') ? {
          plugin: 'react'
        } : undefined
      });
      
      return {
        path,
        success: true,
        result
      };
    } catch (error) {
      return {
        path,
        success: false,
        error: error.message
      };
    }
  });

  return await Promise.all(transformPromises);
};

/**
 * Advanced configuration example
 */
export const advancedTransform = () => {
  const sourceCode = `
    import type { FC } from 'react';
    import { useState, useEffect } from 'react';
    
    interface Props {
      initialCount?: number;
    }
    
    const Counter: FC<Props> = ({ initialCount = 0 }) => {
      const [count, setCount] = useState(initialCount);
      
      useEffect(() => {
        console.log('Count changed:', count);
      }, [count]);
      
      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(c => c + 1)}>
            Increment
          </button>
        </div>
      );
    };
    
    export default Counter;
  `;

  const result = transform('Counter.tsx', sourceCode, {
    typescript: {
      onlyRemoveTypeImports: true,
      declaration: {
        stripInternal: true
      }
    },
    jsx: {
      plugin: 'react',
      development: process.env.NODE_ENV === 'development',
      refresh: process.env.NODE_ENV === 'development' ? {
        refreshReg: '$RefreshReg$',
        refreshSig: '$RefreshSig$',
        emitFullSignatures: true
      } : undefined
    }
  });

  return result;
};

// Example usage:
if (require.main === module) {
  console.log('Basic Transform:');
  basicTransform();
  
  console.log('\nReact Transform:');
  reactTransform();
  
  console.log('\nIsolated Declarations:');
  console.log(generateDeclarations());
}