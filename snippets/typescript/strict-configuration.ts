// TypeScript Strict Configuration Examples
// Complete tsconfig.json configurations for maximum type safety

// ✅ Strict Mode Configuration (tsconfig.json)
export const strictTsConfig = {
  "compilerOptions": {
    // Target and Module
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    
    // Strict Type Checking
    "strict": true,                           // Enable all strict type checking
    "strictNullChecks": true,                 // Strict null checking
    "strictFunctionTypes": true,              // Strict function types
    "strictBindCallApply": true,              // Strict bind/call/apply
    "strictPropertyInitialization": true,     // Strict property initialization
    "noImplicitAny": true,                    // No implicit any types
    "noImplicitReturns": true,                // No implicit returns
    "noImplicitThis": true,                   // No implicit this
    "noImplicitOverride": true,               // Require explicit override
    "exactOptionalPropertyTypes": true,       // Exact optional property types
    "noUncheckedIndexedAccess": true,         // No unchecked indexed access
    "noPropertyAccessFromIndexSignature": true, // No property access from index signature
    
    // Additional Checks
    "noUnusedLocals": true,                   // No unused locals
    "noUnusedParameters": true,               // No unused parameters
    "noFallthroughCasesInSwitch": true,       // No fallthrough cases in switch
    "allowUnreachableCode": false,            // No unreachable code
    "allowUnusedLabels": false,               // No unused labels
    
    // Module Resolution
    "skipLibCheck": true,                     // Skip lib checking for performance
    "forceConsistentCasingInFileNames": true, // Force consistent casing
    
    // Emit
    "declaration": true,                      // Generate declaration files
    "declarationMap": true,                   // Generate declaration maps
    "sourceMap": true,                        // Generate source maps
    "outDir": "./dist",                       // Output directory
    "removeComments": true,                   // Remove comments
    "noEmitOnError": true,                    // No emit on error
    
    // Type Checking
    "types": [],                              // No automatic type inclusion
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    
    // Advanced
    "useDefineForClassFields": true,          // Use define for class fields
    "isolatedModules": true,                  // Isolated modules
    "verbatimModuleSyntax": true             // Verbatim module syntax
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
};

// ✅ Bun-specific Configuration (tsconfig.json)
export const bunTsConfig = {
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "moduleDetection": "force",
    "noEmit": true,
    
    // Bun-specific
    "allowJs": true,
    "checkJs": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    
    // All strict options
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    
    "types": ["bun-types"],
    "lib": ["ES2024", "DOM", "DOM.Iterable"]
  },
  "include": [
    "src/**/*",
    "*.ts",
    "*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
};

// ✅ Library Configuration (tsconfig.json)
export const libraryTsConfig = {
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    // Library-specific
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    
    // Strict mode
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Additional strictness
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // Performance
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    
    // No DOM types for libraries
    "types": [],
    "lib": ["ES2020"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "examples/**/*"
  ]
};

// ✅ Monorepo Configuration (tsconfig.json)
export const monorepoBaseTsConfig = {
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    // Monorepo-specific
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    
    // Strict mode
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Path mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared/src/*"],
      "@utils/*": ["../utils/src/*"]
    },
    
    // Additional strictness
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    
    "types": [],
    "lib": ["ES2024", "DOM", "DOM.Iterable"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
};

// ✅ Example of strict compiler options in action
interface StrictExample {
  requiredProp: string;
  optionalProp?: number;
  nullableProp: string | null;
  undefinedProp: string | undefined;
}

// With exactOptionalPropertyTypes: true
function strictOptionalsExample(obj: StrictExample) {
  // ✅ Good: Proper handling of optional properties
  if (obj.optionalProp !== undefined) {
    console.log(obj.optionalProp * 2);
  }
  
  // ✅ Good: Proper null handling
  if (obj.nullableProp !== null) {
    console.log(obj.nullableProp.toUpperCase());
  }
  
  // ✅ Good: Proper undefined handling
  if (obj.undefinedProp !== undefined) {
    console.log(obj.undefinedProp.length);
  }
}

// With noUncheckedIndexedAccess: true
function strictIndexingExample(arr: string[], obj: Record<string, number>) {
  // ✅ Good: Check array bounds
  const item = arr[0];
  if (item !== undefined) {
    console.log(item.toUpperCase());
  }
  
  // ✅ Good: Check object properties
  const value = obj['key'];
  if (value !== undefined) {
    console.log(value * 2);
  }
}

// With noPropertyAccessFromIndexSignature: true
interface StrictIndexSignature {
  knownProp: string;
  [key: string]: unknown;
}

function strictPropertyAccess(obj: StrictIndexSignature) {
  // ✅ Good: Direct property access
  console.log(obj.knownProp);
  
  // ✅ Good: Index signature access
  console.log(obj['dynamicProp']);
  
  // ❌ Error: Property access from index signature
  // console.log(obj.dynamicProp);
}

// With noImplicitOverride: true
class BaseClass {
  method(): void {
    console.log('base');
  }
}

class DerivedClass extends BaseClass {
  // ✅ Good: Explicit override
  override method(): void {
    console.log('derived');
  }
}

// With noImplicitReturns: true
function strictReturns(condition: boolean): string {
  if (condition) {
    return 'true';
  }
  // ✅ Good: All code paths return
  return 'false';
}

// With noFallthroughCasesInSwitch: true
function strictSwitch(value: 'a' | 'b' | 'c'): string {
  switch (value) {
    case 'a':
      return 'A';
    case 'b':
      return 'B';
    case 'c':
      return 'C';
    default:
      const _exhaustive: never = value;
      throw new Error(`Unhandled value: ${value}`);
  }
}

export {
  StrictExample,
  strictOptionalsExample,
  strictIndexingExample,
  strictPropertyAccess,
  BaseClass,
  DerivedClass,
  strictReturns,
  strictSwitch
};