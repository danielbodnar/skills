// MDX TypeScript Type Definitions
// Comprehensive type definitions for MDX components and APIs

import type {ComponentType, ReactNode} from 'react'

// Base MDX module declaration
declare module '*.mdx' {
  const Component: ComponentType<{
    components?: MDXComponents
  }>
  export default Component
}

// MDX component types
export interface MDXComponents {
  // HTML elements
  a?: ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement>>
  abbr?: ComponentType<React.HTMLAttributes<HTMLElement>>
  address?: ComponentType<React.HTMLAttributes<HTMLElement>>
  area?: ComponentType<React.AreaHTMLAttributes<HTMLAreaElement>>
  article?: ComponentType<React.HTMLAttributes<HTMLElement>>
  aside?: ComponentType<React.HTMLAttributes<HTMLElement>>
  audio?: ComponentType<React.AudioHTMLAttributes<HTMLAudioElement>>
  b?: ComponentType<React.HTMLAttributes<HTMLElement>>
  base?: ComponentType<React.BaseHTMLAttributes<HTMLBaseElement>>
  bdi?: ComponentType<React.HTMLAttributes<HTMLElement>>
  bdo?: ComponentType<React.HTMLAttributes<HTMLElement>>
  big?: ComponentType<React.HTMLAttributes<HTMLElement>>
  blockquote?: ComponentType<React.BlockquoteHTMLAttributes<HTMLQuoteElement>>
  body?: ComponentType<React.HTMLAttributes<HTMLBodyElement>>
  br?: ComponentType<React.HTMLAttributes<HTMLBRElement>>
  button?: ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
  canvas?: ComponentType<React.CanvasHTMLAttributes<HTMLCanvasElement>>
  caption?: ComponentType<React.HTMLAttributes<HTMLElement>>
  cite?: ComponentType<React.HTMLAttributes<HTMLElement>>
  code?: ComponentType<React.HTMLAttributes<HTMLElement>>
  col?: ComponentType<React.ColHTMLAttributes<HTMLTableColElement>>
  colgroup?: ComponentType<React.ColgroupHTMLAttributes<HTMLTableColElement>>
  data?: ComponentType<React.DataHTMLAttributes<HTMLDataElement>>
  datalist?: ComponentType<React.HTMLAttributes<HTMLDataListElement>>
  dd?: ComponentType<React.HTMLAttributes<HTMLElement>>
  del?: ComponentType<React.DelHTMLAttributes<HTMLModElement>>
  details?: ComponentType<React.DetailsHTMLAttributes<HTMLDetailsElement>>
  dfn?: ComponentType<React.HTMLAttributes<HTMLElement>>
  dialog?: ComponentType<React.DialogHTMLAttributes<HTMLDialogElement>>
  div?: ComponentType<React.HTMLAttributes<HTMLDivElement>>
  dl?: ComponentType<React.HTMLAttributes<HTMLDListElement>>
  dt?: ComponentType<React.HTMLAttributes<HTMLElement>>
  em?: ComponentType<React.HTMLAttributes<HTMLElement>>
  embed?: ComponentType<React.EmbedHTMLAttributes<HTMLEmbedElement>>
  fieldset?: ComponentType<React.FieldsetHTMLAttributes<HTMLFieldSetElement>>
  figcaption?: ComponentType<React.HTMLAttributes<HTMLElement>>
  figure?: ComponentType<React.HTMLAttributes<HTMLElement>>
  footer?: ComponentType<React.HTMLAttributes<HTMLElement>>
  form?: ComponentType<React.FormHTMLAttributes<HTMLFormElement>>
  h1?: ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  h2?: ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  h3?: ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  h4?: ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  h5?: ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  h6?: ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  head?: ComponentType<React.HTMLAttributes<HTMLHeadElement>>
  header?: ComponentType<React.HTMLAttributes<HTMLElement>>
  hgroup?: ComponentType<React.HTMLAttributes<HTMLElement>>
  hr?: ComponentType<React.HTMLAttributes<HTMLHRElement>>
  html?: ComponentType<React.HtmlHTMLAttributes<HTMLHtmlElement>>
  i?: ComponentType<React.HTMLAttributes<HTMLElement>>
  iframe?: ComponentType<React.IframeHTMLAttributes<HTMLIFrameElement>>
  img?: ComponentType<React.ImgHTMLAttributes<HTMLImageElement>>
  input?: ComponentType<React.InputHTMLAttributes<HTMLInputElement>>
  ins?: ComponentType<React.InsHTMLAttributes<HTMLModElement>>
  kbd?: ComponentType<React.HTMLAttributes<HTMLElement>>
  keygen?: ComponentType<React.KeygenHTMLAttributes<HTMLElement>>
  label?: ComponentType<React.LabelHTMLAttributes<HTMLLabelElement>>
  legend?: ComponentType<React.HTMLAttributes<HTMLLegendElement>>
  li?: ComponentType<React.LiHTMLAttributes<HTMLLIElement>>
  link?: ComponentType<React.LinkHTMLAttributes<HTMLLinkElement>>
  main?: ComponentType<React.HTMLAttributes<HTMLElement>>
  map?: ComponentType<React.MapHTMLAttributes<HTMLMapElement>>
  mark?: ComponentType<React.HTMLAttributes<HTMLElement>>
  menu?: ComponentType<React.MenuHTMLAttributes<HTMLElement>>
  menuitem?: ComponentType<React.HTMLAttributes<HTMLElement>>
  meta?: ComponentType<React.MetaHTMLAttributes<HTMLMetaElement>>
  meter?: ComponentType<React.MeterHTMLAttributes<HTMLMeterElement>>
  nav?: ComponentType<React.HTMLAttributes<HTMLElement>>
  noscript?: ComponentType<React.HTMLAttributes<HTMLElement>>
  object?: ComponentType<React.ObjectHTMLAttributes<HTMLObjectElement>>
  ol?: ComponentType<React.OlHTMLAttributes<HTMLOListElement>>
  optgroup?: ComponentType<React.OptgroupHTMLAttributes<HTMLOptGroupElement>>
  option?: ComponentType<React.OptionHTMLAttributes<HTMLOptionElement>>
  output?: ComponentType<React.OutputHTMLAttributes<HTMLOutputElement>>
  p?: ComponentType<React.HTMLAttributes<HTMLParagraphElement>>
  param?: ComponentType<React.ParamHTMLAttributes<HTMLParamElement>>
  picture?: ComponentType<React.HTMLAttributes<HTMLElement>>
  pre?: ComponentType<React.HTMLAttributes<HTMLPreElement>>
  progress?: ComponentType<React.ProgressHTMLAttributes<HTMLProgressElement>>
  q?: ComponentType<React.QuoteHTMLAttributes<HTMLQuoteElement>>
  rp?: ComponentType<React.HTMLAttributes<HTMLElement>>
  rt?: ComponentType<React.HTMLAttributes<HTMLElement>>
  ruby?: ComponentType<React.HTMLAttributes<HTMLElement>>
  s?: ComponentType<React.HTMLAttributes<HTMLElement>>
  samp?: ComponentType<React.HTMLAttributes<HTMLElement>>
  script?: ComponentType<React.ScriptHTMLAttributes<HTMLScriptElement>>
  section?: ComponentType<React.HTMLAttributes<HTMLElement>>
  select?: ComponentType<React.SelectHTMLAttributes<HTMLSelectElement>>
  small?: ComponentType<React.HTMLAttributes<HTMLElement>>
  source?: ComponentType<React.SourceHTMLAttributes<HTMLSourceElement>>
  span?: ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  strong?: ComponentType<React.HTMLAttributes<HTMLElement>>
  style?: ComponentType<React.StyleHTMLAttributes<HTMLStyleElement>>
  sub?: ComponentType<React.HTMLAttributes<HTMLElement>>
  summary?: ComponentType<React.HTMLAttributes<HTMLElement>>
  sup?: ComponentType<React.HTMLAttributes<HTMLElement>>
  table?: ComponentType<React.TableHTMLAttributes<HTMLTableElement>>
  tbody?: ComponentType<React.HTMLAttributes<HTMLTableSectionElement>>
  td?: ComponentType<React.TdHTMLAttributes<HTMLTableDataCellElement>>
  textarea?: ComponentType<React.TextareaHTMLAttributes<HTMLTextAreaElement>>
  tfoot?: ComponentType<React.HTMLAttributes<HTMLTableSectionElement>>
  th?: ComponentType<React.ThHTMLAttributes<HTMLTableHeaderCellElement>>
  thead?: ComponentType<React.HTMLAttributes<HTMLTableSectionElement>>
  time?: ComponentType<React.TimeHTMLAttributes<HTMLTimeElement>>
  title?: ComponentType<React.HTMLAttributes<HTMLTitleElement>>
  tr?: ComponentType<React.HTMLAttributes<HTMLTableRowElement>>
  track?: ComponentType<React.TrackHTMLAttributes<HTMLTrackElement>>
  u?: ComponentType<React.HTMLAttributes<HTMLElement>>
  ul?: ComponentType<React.HTMLAttributes<HTMLUListElement>>
  var?: ComponentType<React.HTMLAttributes<HTMLElement>>
  video?: ComponentType<React.VideoHTMLAttributes<HTMLVideoElement>>
  wbr?: ComponentType<React.HTMLAttributes<HTMLElement>>

  // SVG elements
  svg?: ComponentType<React.SVGProps<SVGSVGElement>>
  animate?: ComponentType<React.SVGProps<SVGElement>>
  animateMotion?: ComponentType<React.SVGProps<SVGElement>>
  animateTransform?: ComponentType<React.SVGProps<SVGElement>>
  circle?: ComponentType<React.SVGProps<SVGCircleElement>>
  clipPath?: ComponentType<React.SVGProps<SVGClipPathElement>>
  defs?: ComponentType<React.SVGProps<SVGDefsElement>>
  desc?: ComponentType<React.SVGProps<SVGDescElement>>
  ellipse?: ComponentType<React.SVGProps<SVGEllipseElement>>
  feBlend?: ComponentType<React.SVGProps<SVGFEBlendElement>>
  feColorMatrix?: ComponentType<React.SVGProps<SVGFEColorMatrixElement>>
  feComponentTransfer?: ComponentType<React.SVGProps<SVGFEComponentTransferElement>>
  feComposite?: ComponentType<React.SVGProps<SVGFECompositeElement>>
  feConvolveMatrix?: ComponentType<React.SVGProps<SVGFEConvolveMatrixElement>>
  feDiffuseLighting?: ComponentType<React.SVGProps<SVGFEDiffuseLightingElement>>
  feDisplacementMap?: ComponentType<React.SVGProps<SVGFEDisplacementMapElement>>
  feDistantLight?: ComponentType<React.SVGProps<SVGFEDistantLightElement>>
  feDropShadow?: ComponentType<React.SVGProps<SVGFEDropShadowElement>>
  feFlood?: ComponentType<React.SVGProps<SVGFEFloodElement>>
  feFuncA?: ComponentType<React.SVGProps<SVGFEFuncAElement>>
  feFuncB?: ComponentType<React.SVGProps<SVGFEFuncBElement>>
  feFuncG?: ComponentType<React.SVGProps<SVGFEFuncGElement>>
  feFuncR?: ComponentType<React.SVGProps<SVGFEFuncRElement>>
  feGaussianBlur?: ComponentType<React.SVGProps<SVGFEGaussianBlurElement>>
  feImage?: ComponentType<React.SVGProps<SVGFEImageElement>>
  feMerge?: ComponentType<React.SVGProps<SVGFEMergeElement>>
  feMergeNode?: ComponentType<React.SVGProps<SVGFEMergeNodeElement>>
  feMorphology?: ComponentType<React.SVGProps<SVGFEMorphologyElement>>
  feOffset?: ComponentType<React.SVGProps<SVGFEOffsetElement>>
  fePointLight?: ComponentType<React.SVGProps<SVGFEPointLightElement>>
  feSpecularLighting?: ComponentType<React.SVGProps<SVGFESpecularLightingElement>>
  feSpotLight?: ComponentType<React.SVGProps<SVGFESpotLightElement>>
  feTile?: ComponentType<React.SVGProps<SVGFETileElement>>
  feTurbulence?: ComponentType<React.SVGProps<SVGFETurbulenceElement>>
  filter?: ComponentType<React.SVGProps<SVGFilterElement>>
  foreignObject?: ComponentType<React.SVGProps<SVGForeignObjectElement>>
  g?: ComponentType<React.SVGProps<SVGGElement>>
  image?: ComponentType<React.SVGProps<SVGImageElement>>
  line?: ComponentType<React.SVGProps<SVGLineElement>>
  linearGradient?: ComponentType<React.SVGProps<SVGLinearGradientElement>>
  marker?: ComponentType<React.SVGProps<SVGMarkerElement>>
  mask?: ComponentType<React.SVGProps<SVGMaskElement>>
  metadata?: ComponentType<React.SVGProps<SVGMetadataElement>>
  mpath?: ComponentType<React.SVGProps<SVGElement>>
  path?: ComponentType<React.SVGProps<SVGPathElement>>
  pattern?: ComponentType<React.SVGProps<SVGPatternElement>>
  polygon?: ComponentType<React.SVGProps<SVGPolygonElement>>
  polyline?: ComponentType<React.SVGProps<SVGPolylineElement>>
  radialGradient?: ComponentType<React.SVGProps<SVGRadialGradientElement>>
  rect?: ComponentType<React.SVGProps<SVGRectElement>>
  stop?: ComponentType<React.SVGProps<SVGStopElement>>
  switch?: ComponentType<React.SVGProps<SVGSwitchElement>>
  symbol?: ComponentType<React.SVGProps<SVGSymbolElement>>
  text?: ComponentType<React.SVGProps<SVGTextElement>>
  textPath?: ComponentType<React.SVGProps<SVGTextPathElement>>
  tspan?: ComponentType<React.SVGProps<SVGTSpanElement>>
  use?: ComponentType<React.SVGProps<SVGUseElement>>
  view?: ComponentType<React.SVGProps<SVGViewElement>>

  // Custom components (can be extended)
  [key: string]: ComponentType<any> | undefined
}

// MDX compilation options
export interface MDXCompileOptions {
  /**
   * Whether to use the automatic JSX runtime
   */
  jsxRuntime?: 'automatic' | 'classic'
  
  /**
   * Import source for JSX
   */
  jsxImportSource?: string
  
  /**
   * JSX pragma (for classic runtime)
   */
  pragma?: string
  
  /**
   * JSX fragment pragma (for classic runtime)
   */
  pragmaFrag?: string
  
  /**
   * Import source for pragma (for classic runtime)
   */
  pragmaImportSource?: string
  
  /**
   * Module format
   */
  format?: 'esm' | 'cjs'
  
  /**
   * Output format
   */
  outputFormat?: 'program' | 'function-body'
  
  /**
   * Whether to include development information
   */
  development?: boolean
  
  /**
   * Base URL for imports
   */
  baseUrl?: string
  
  /**
   * Provider import source
   */
  providerImportSource?: string
  
  /**
   * Remark plugins
   */
  remarkPlugins?: any[]
  
  /**
   * Rehype plugins
   */
  rehypePlugins?: any[]
  
  /**
   * Recma plugins
   */
  recmaPlugins?: any[]
}

// MDX evaluation options
export interface MDXEvaluateOptions extends MDXCompileOptions {
  /**
   * Fragment factory (for React 17+)
   */
  Fragment?: ComponentType
  
  /**
   * JSX factory (for React 17+)
   */
  jsx?: Function
  
  /**
   * JSX development factory
   */
  jsxDEV?: Function
  
  /**
   * JSX fragment factory
   */
  jsxs?: Function
  
  /**
   * Use MDX provider
   */
  useMDXComponents?: (components?: MDXComponents) => MDXComponents
  
  /**
   * MDX components
   */
  components?: MDXComponents
  
  /**
   * Additional scope variables
   */
  [key: string]: any
}

// MDX run options
export interface MDXRunOptions extends MDXEvaluateOptions {}

// MDX processor options
export interface MDXProcessorOptions extends MDXCompileOptions {}

// MDX file metadata
export interface MDXFileMetadata {
  /**
   * File path
   */
  path: string
  
  /**
   * File content
   */
  content: string
  
  /**
   * Frontmatter data
   */
  frontmatter?: Record<string, any>
  
  /**
   * Compilation timestamp
   */
  compiledAt?: Date
  
  /**
   * File hash for cache invalidation
   */
  hash?: string
}

// MDX compilation result
export interface MDXCompilationResult {
  /**
   * Compiled JavaScript code
   */
  code: string
  
  /**
   * Source map (if enabled)
   */
  map?: string
  
  /**
   * Compilation messages
   */
  messages: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    line?: number
    column?: number
  }>
}

// MDX provider props
export interface MDXProviderProps {
  /**
   * Components to provide
   */
  components?: MDXComponents
  
  /**
   * Children to render
   */
  children: ReactNode
  
  /**
   * Disable parent context
   */
  disableParentContext?: boolean
}

// Custom MDX component props
export interface CustomMDXComponentProps {
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
  [key: string]: any
}

// Alert component props
export interface AlertProps extends CustomMDXComponentProps {
  type: 'info' | 'warning' | 'error' | 'success'
  title?: string
}

// Code block component props
export interface CodeBlockProps extends CustomMDXComponentProps {
  language: string
  code: string
  fileName?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
}

// Image component props
export interface MDXImageProps extends CustomMDXComponentProps {
  src: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  priority?: boolean
}

// Callout component props
export interface CalloutProps extends CustomMDXComponentProps {
  type?: 'note' | 'tip' | 'important' | 'warning' | 'caution'
  title?: string
  emoji?: string
}

// Tabs component props
export interface TabsProps extends CustomMDXComponentProps {
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
}

export interface TabProps extends CustomMDXComponentProps {
  value: string
  label: string
}

// Card component props
export interface CardProps extends CustomMDXComponentProps {
  title?: string
  description?: string
  href?: string
  icon?: ReactNode
}

// Global MDX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mdx-provider': React.DetailedHTMLProps<MDXProviderProps, HTMLElement>
    }
  }
}

// Module augmentation for Next.js
declare module 'next/mdx' {
  const withMDX: (config: any) => (nextConfig: any) => any
  export default withMDX
}

// Module augmentation for Vite
declare module '@mdx-js/rollup' {
  import type {Plugin} from 'rollup'
  const mdx: (options?: MDXCompileOptions) => Plugin
  export default mdx
}

// Module augmentation for webpack
declare module '@mdx-js/loader' {
  import type {LoaderDefinition} from 'webpack'
  const loader: LoaderDefinition<MDXCompileOptions>
  export = loader
}

// Re-export common types
export type {ComponentType, ReactNode} from 'react'
export type {Plugin as RemarkPlugin} from 'unified'
export type {Plugin as RehypePlugin} from 'unified'