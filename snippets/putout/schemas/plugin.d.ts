// TypeScript definitions for Putout plugins

export interface PutoutPlugin {
  /**
   * Report function that returns the error message
   */
  report(): string;

  /**
   * Fix function that performs the transformation
   */
  fix(path: NodePath): void;

  /**
   * Traverse function that defines visitor methods
   */
  traverse(options: TraverseOptions): Visitor;

  /**
   * Plugin metadata
   */
  meta?: PluginMeta;

  /**
   * Plugin validation
   */
  validate?(options: any): boolean;
}

export interface MultiRulePlugin {
  /**
   * Multiple rules in a single plugin
   */
  rules: Record<string, PutoutPlugin>;
}

export interface TemplatePlugin {
  /**
   * Report function
   */
  report(): string;

  /**
   * Template replacement rules
   */
  replace(): Record<string, string>;
}

export interface VisitorPlugin {
  /**
   * Report function
   */
  report(): string;

  /**
   * Visitor methods
   */
  visitor: Visitor;
}

export interface TraverseOptions {
  /**
   * Function to push nodes for transformation
   */
  push(path: NodePath): void;

  /**
   * Plugin options
   */
  options?: any;

  /**
   * Path store for tracking changes
   */
  pathStore?: PathStore;
}

export interface Visitor {
  [key: string]: VisitorMethod | VisitorObject;
}

export interface VisitorMethod {
  (path: NodePath): void;
}

export interface VisitorObject {
  enter?(path: NodePath): void;
  exit?(path: NodePath): void;
}

export interface NodePath {
  /**
   * The AST node
   */
  node: Node;

  /**
   * Parent path
   */
  parent: NodePath | null;

  /**
   * Scope information
   */
  scope: Scope;

  /**
   * Remove the node
   */
  remove(): void;

  /**
   * Replace the node with another
   */
  replaceWith(node: Node): void;

  /**
   * Insert before the node
   */
  insertBefore(node: Node): void;

  /**
   * Insert after the node
   */
  insertAfter(node: Node): void;

  /**
   * Skip visiting children
   */
  skip(): void;

  /**
   * Check if node is referenced
   */
  isReferencedIdentifier(): boolean;

  /**
   * Get the source code
   */
  getSource(): string;
}

export interface Node {
  type: string;
  [key: string]: any;
}

export interface Scope {
  /**
   * Get binding for a variable
   */
  getBinding(name: string): Binding | undefined;

  /**
   * All bindings in this scope
   */
  bindings: Record<string, Binding>;

  /**
   * Parent scope
   */
  parent: Scope | null;
}

export interface Binding {
  /**
   * Variable name
   */
  identifier: Node;

  /**
   * Is the variable referenced?
   */
  referenced: boolean;

  /**
   * Number of references
   */
  references: number;

  /**
   * Reference paths
   */
  referencePaths: NodePath[];

  /**
   * Constant violations
   */
  constantViolations: NodePath[];
}

export interface PathStore {
  /**
   * Mark as changed
   */
  markAsChanged(): void;

  /**
   * Check if changed
   */
  isChanged(): boolean;
}

export interface PluginMeta {
  /**
   * Plugin name
   */
  name: string;

  /**
   * Plugin version
   */
  version: string;

  /**
   * Plugin description
   */
  description: string;

  /**
   * Plugin author
   */
  author: string;

  /**
   * Is the plugin fixable?
   */
  fixable: boolean;

  /**
   * Plugin category
   */
  category: string;
}

export interface TransformOptions {
  /**
   * Apply fixes?
   */
  fix?: boolean;

  /**
   * Rule configuration
   */
  rules?: Record<string, RuleConfig>;

  /**
   * Plugin list
   */
  plugins?: PluginConfig[];

  /**
   * File matching patterns
   */
  match?: Record<string, Record<string, RuleConfig>>;

  /**
   * Ignore patterns
   */
  ignore?: string[];

  /**
   * Processor list
   */
  processors?: string[];
}

export type RuleConfig = 
  | 'on' 
  | 'off' 
  | 'error' 
  | 'warn'
  | [string, any];

export type PluginConfig = 
  | string 
  | [string, any];

export interface TransformResult {
  /**
   * Transformed code
   */
  code: string;

  /**
   * Transform locations
   */
  places: Place[];
}

export interface Place {
  /**
   * Rule name
   */
  rule: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Position in code
   */
  position: Position;
}

export interface Position {
  /**
   * Line number
   */
  line: number;

  /**
   * Column number
   */
  column: number;
}

// AST Node Types
export interface Program extends Node {
  type: 'Program';
  body: Statement[];
}

export interface Statement extends Node {}

export interface Expression extends Node {}

export interface Identifier extends Node {
  type: 'Identifier';
  name: string;
}

export interface Literal extends Node {
  type: 'Literal';
  value: any;
  raw: string;
}

export interface FunctionDeclaration extends Statement {
  type: 'FunctionDeclaration';
  id: Identifier | null;
  params: Pattern[];
  body: BlockStatement;
  generator: boolean;
  async: boolean;
}

export interface FunctionExpression extends Expression {
  type: 'FunctionExpression';
  id: Identifier | null;
  params: Pattern[];
  body: BlockStatement;
  generator: boolean;
  async: boolean;
}

export interface ArrowFunctionExpression extends Expression {
  type: 'ArrowFunctionExpression';
  params: Pattern[];
  body: BlockStatement | Expression;
  generator: boolean;
  async: boolean;
}

export interface VariableDeclaration extends Statement {
  type: 'VariableDeclaration';
  declarations: VariableDeclarator[];
  kind: 'var' | 'let' | 'const';
}

export interface VariableDeclarator extends Node {
  type: 'VariableDeclarator';
  id: Pattern;
  init: Expression | null;
}

export interface BlockStatement extends Statement {
  type: 'BlockStatement';
  body: Statement[];
}

export interface CallExpression extends Expression {
  type: 'CallExpression';
  callee: Expression;
  arguments: (Expression | SpreadElement)[];
}

export interface MemberExpression extends Expression {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
  optional: boolean;
}

export interface LogicalExpression extends Expression {
  type: 'LogicalExpression';
  operator: '&&' | '||' | '??';
  left: Expression;
  right: Expression;
}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface AssignmentExpression extends Expression {
  type: 'AssignmentExpression';
  operator: string;
  left: Pattern | Expression;
  right: Expression;
}

export interface DebuggerStatement extends Statement {
  type: 'DebuggerStatement';
}

export interface IfStatement extends Statement {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface Pattern extends Node {}

export interface SpreadElement extends Node {
  type: 'SpreadElement';
  argument: Expression;
}

export interface ObjectExpression extends Expression {
  type: 'ObjectExpression';
  properties: (Property | SpreadElement)[];
}

export interface Property extends Node {
  type: 'Property';
  key: Expression;
  value: Expression;
  kind: 'init' | 'get' | 'set';
  method: boolean;
  shorthand: boolean;
  computed: boolean;
}

export interface ArrayExpression extends Expression {
  type: 'ArrayExpression';
  elements: (Expression | SpreadElement | null)[];
}

export interface ObjectPattern extends Pattern {
  type: 'ObjectPattern';
  properties: (Property | RestElement)[];
}

export interface ArrayPattern extends Pattern {
  type: 'ArrayPattern';
  elements: (Pattern | null)[];
}

export interface RestElement extends Pattern {
  type: 'RestElement';
  argument: Pattern;
}

export interface ImportDeclaration extends Statement {
  type: 'ImportDeclaration';
  specifiers: (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[];
  source: Literal;
}

export interface ImportSpecifier extends Node {
  type: 'ImportSpecifier';
  local: Identifier;
  imported: Identifier;
}

export interface ImportDefaultSpecifier extends Node {
  type: 'ImportDefaultSpecifier';
  local: Identifier;
}

export interface ImportNamespaceSpecifier extends Node {
  type: 'ImportNamespaceSpecifier';
  local: Identifier;
}

export interface ExportDeclaration extends Statement {}

export interface ExportDefaultDeclaration extends ExportDeclaration {
  type: 'ExportDefaultDeclaration';
  declaration: Declaration | Expression;
}

export interface ExportNamedDeclaration extends ExportDeclaration {
  type: 'ExportNamedDeclaration';
  declaration: Declaration | null;
  specifiers: ExportSpecifier[];
  source: Literal | null;
}

export interface ExportSpecifier extends Node {
  type: 'ExportSpecifier';
  exported: Identifier;
  local: Identifier;
}

export interface Declaration extends Statement {}

// Utility types
export type ASTNode = 
  | Program
  | Statement
  | Expression
  | Pattern
  | Identifier
  | Literal;

export type VisitorKeys = {
  [K in ASTNode['type']]: string[];
};

export type NodeType = ASTNode['type'];

export type NodeOfType<T extends NodeType> = Extract<ASTNode, { type: T }>;

export type VisitorFunction<T extends NodeType> = (path: NodePath & { node: NodeOfType<T> }) => void;

export type TypedVisitor = {
  [K in NodeType]?: VisitorFunction<K> | {
    enter?: VisitorFunction<K>;
    exit?: VisitorFunction<K>;
  };
};

// Plugin factory types
export type PluginFactory<T = any> = (options?: T) => PutoutPlugin;

export interface PluginOptions {
  [key: string]: any;
}

export interface RuleContext {
  report(node: Node, message: string): void;
  fix(node: Node, fixer: (fixer: RuleFixer) => FixResult): void;
}

export interface RuleFixer {
  insertTextBefore(node: Node, text: string): FixResult;
  insertTextAfter(node: Node, text: string): FixResult;
  remove(node: Node): FixResult;
  replaceText(node: Node, text: string): FixResult;
}

export interface FixResult {
  range: [number, number];
  text: string;
}

declare module 'putout' {
  export function transform(code: string, options?: TransformOptions): TransformResult;
  export function createPlugin(plugin: PutoutPlugin): PutoutPlugin;
}

declare module '@putout/test' {
  export function test(name: string, fn: (t: TestContext) => void): void;
  
  export interface TestContext {
    transform(code: string, options?: any): void;
    noTransform(code: string, options?: any): void;
    transformCode(input: string, expected: string, options?: any): void;
    equal(actual: any, expected: any, message?: string): void;
    ok(value: any, message?: string): void;
    matchSnapshot(value: any): void;
    updateSnapshot(value: any): void;
    doesNotThrow(fn: () => void): void;
  }
}