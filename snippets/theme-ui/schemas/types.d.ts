// Theme UI TypeScript Type Definitions

declare module 'theme-ui' {
  export interface Theme {
    // Color scale
    colors?: {
      text?: string
      background?: string
      primary?: string
      secondary?: string
      accent?: string
      muted?: string
      gray?: string
      highlight?: string
      [key: string]: string | undefined | {
        modes?: {
          [mode: string]: {
            [color: string]: string
          }
        }
      }
    }

    // Typography scale
    fonts?: {
      body?: string
      heading?: string
      monospace?: string
      [key: string]: string | undefined
    }

    fontSizes?: (number | string)[]

    fontWeights?: {
      body?: number | string
      heading?: number | string
      bold?: number | string
      [key: string]: number | string | undefined
    }

    lineHeights?: {
      body?: number
      heading?: number
      [key: string]: number | undefined
    }

    letterSpacings?: {
      body?: number | string
      caps?: number | string
      [key: string]: number | string | undefined
    }

    // Layout scale
    space?: (number | string)[]

    sizes?: {
      container?: number | string | (number | string)[]
      wide?: number | string
      narrow?: number | string
      [key: string]: number | string | (number | string)[] | undefined
    }

    // Responsive breakpoints
    breakpoints?: string[]

    // Design tokens
    radii?: {
      default?: number | string
      circle?: number | string
      [key: string]: number | string | undefined
    }

    shadows?: {
      small?: string
      large?: string
      [key: string]: string | undefined
    }

    borders?: {
      [key: string]: string | number
    }

    zIndices?: {
      [key: string]: number
    }

    // Component variants
    text?: {
      [variant: string]: SystemStyleObject
    }

    buttons?: {
      [variant: string]: SystemStyleObject
    }

    cards?: {
      [variant: string]: SystemStyleObject
    }

    forms?: {
      [variant: string]: SystemStyleObject
    }

    badges?: {
      [variant: string]: SystemStyleObject
    }

    alerts?: {
      [variant: string]: SystemStyleObject
    }

    layout?: {
      [variant: string]: SystemStyleObject
    }

    links?: {
      [variant: string]: SystemStyleObject
    }

    images?: {
      [variant: string]: SystemStyleObject
    }

    // Global styles for MDX
    styles?: {
      root?: SystemStyleObject
      h1?: SystemStyleObject
      h2?: SystemStyleObject
      h3?: SystemStyleObject
      h4?: SystemStyleObject
      h5?: SystemStyleObject
      h6?: SystemStyleObject
      p?: SystemStyleObject
      a?: SystemStyleObject
      ul?: SystemStyleObject
      ol?: SystemStyleObject
      li?: SystemStyleObject
      blockquote?: SystemStyleObject
      pre?: SystemStyleObject
      code?: SystemStyleObject
      table?: SystemStyleObject
      th?: SystemStyleObject
      td?: SystemStyleObject
      img?: SystemStyleObject
      hr?: SystemStyleObject
      [element: string]: SystemStyleObject | undefined
    }

    // Theme configuration
    config?: {
      initialColorModeName?: string
      useCustomProperties?: boolean
      useColorSchemeMediaQuery?: boolean
      useLocalStorage?: boolean
      printColorModeName?: string
    }

    // Allow additional properties
    [key: string]: any
  }

  // System style object with responsive and pseudo-selector support
  export interface SystemStyleObject {
    // Layout
    display?: ResponsiveValue<CSS.Property.Display>
    width?: ResponsiveValue<CSS.Property.Width>
    height?: ResponsiveValue<CSS.Property.Height>
    minWidth?: ResponsiveValue<CSS.Property.MinWidth>
    maxWidth?: ResponsiveValue<CSS.Property.MaxWidth>
    minHeight?: ResponsiveValue<CSS.Property.MinHeight>
    maxHeight?: ResponsiveValue<CSS.Property.MaxHeight>

    // Spacing
    margin?: ResponsiveValue<CSS.Property.Margin | number>
    m?: ResponsiveValue<CSS.Property.Margin | number>
    marginTop?: ResponsiveValue<CSS.Property.MarginTop | number>
    mt?: ResponsiveValue<CSS.Property.MarginTop | number>
    marginRight?: ResponsiveValue<CSS.Property.MarginRight | number>
    mr?: ResponsiveValue<CSS.Property.MarginRight | number>
    marginBottom?: ResponsiveValue<CSS.Property.MarginBottom | number>
    mb?: ResponsiveValue<CSS.Property.MarginBottom | number>
    marginLeft?: ResponsiveValue<CSS.Property.MarginLeft | number>
    ml?: ResponsiveValue<CSS.Property.MarginLeft | number>
    marginX?: ResponsiveValue<CSS.Property.Margin | number>
    mx?: ResponsiveValue<CSS.Property.Margin | number>
    marginY?: ResponsiveValue<CSS.Property.Margin | number>
    my?: ResponsiveValue<CSS.Property.Margin | number>

    padding?: ResponsiveValue<CSS.Property.Padding | number>
    p?: ResponsiveValue<CSS.Property.Padding | number>
    paddingTop?: ResponsiveValue<CSS.Property.PaddingTop | number>
    pt?: ResponsiveValue<CSS.Property.PaddingTop | number>
    paddingRight?: ResponsiveValue<CSS.Property.PaddingRight | number>
    pr?: ResponsiveValue<CSS.Property.PaddingRight | number>
    paddingBottom?: ResponsiveValue<CSS.Property.PaddingBottom | number>
    pb?: ResponsiveValue<CSS.Property.PaddingBottom | number>
    paddingLeft?: ResponsiveValue<CSS.Property.PaddingLeft | number>
    pl?: ResponsiveValue<CSS.Property.PaddingLeft | number>
    paddingX?: ResponsiveValue<CSS.Property.Padding | number>
    px?: ResponsiveValue<CSS.Property.Padding | number>
    paddingY?: ResponsiveValue<CSS.Property.Padding | number>
    py?: ResponsiveValue<CSS.Property.Padding | number>

    // Colors
    color?: ResponsiveValue<CSS.Property.Color | string>
    backgroundColor?: ResponsiveValue<CSS.Property.BackgroundColor | string>
    bg?: ResponsiveValue<CSS.Property.BackgroundColor | string>
    borderColor?: ResponsiveValue<CSS.Property.BorderColor | string>

    // Typography
    fontFamily?: ResponsiveValue<CSS.Property.FontFamily | string>
    fontSize?: ResponsiveValue<CSS.Property.FontSize | number>
    fontWeight?: ResponsiveValue<CSS.Property.FontWeight | string>
    lineHeight?: ResponsiveValue<CSS.Property.LineHeight | string>
    letterSpacing?: ResponsiveValue<CSS.Property.LetterSpacing | string>
    textAlign?: ResponsiveValue<CSS.Property.TextAlign>
    textDecoration?: ResponsiveValue<CSS.Property.TextDecoration>
    textTransform?: ResponsiveValue<CSS.Property.TextTransform>

    // Borders
    border?: ResponsiveValue<CSS.Property.Border>
    borderWidth?: ResponsiveValue<CSS.Property.BorderWidth>
    borderStyle?: ResponsiveValue<CSS.Property.BorderStyle>
    borderRadius?: ResponsiveValue<CSS.Property.BorderRadius | string>

    // Flexbox
    alignItems?: ResponsiveValue<CSS.Property.AlignItems>
    alignContent?: ResponsiveValue<CSS.Property.AlignContent>
    justifyItems?: ResponsiveValue<CSS.Property.JustifyItems>
    justifyContent?: ResponsiveValue<CSS.Property.JustifyContent>
    flexWrap?: ResponsiveValue<CSS.Property.FlexWrap>
    flexDirection?: ResponsiveValue<CSS.Property.FlexDirection>
    flex?: ResponsiveValue<CSS.Property.Flex>
    flexGrow?: ResponsiveValue<CSS.Property.FlexGrow>
    flexShrink?: ResponsiveValue<CSS.Property.FlexShrink>
    flexBasis?: ResponsiveValue<CSS.Property.FlexBasis>
    justifySelf?: ResponsiveValue<CSS.Property.JustifySelf>
    alignSelf?: ResponsiveValue<CSS.Property.AlignSelf>
    order?: ResponsiveValue<CSS.Property.Order>

    // Grid
    gridGap?: ResponsiveValue<CSS.Property.GridGap | number>
    gap?: ResponsiveValue<CSS.Property.Gap | number>
    gridRowGap?: ResponsiveValue<CSS.Property.GridRowGap | number>
    gridColumnGap?: ResponsiveValue<CSS.Property.GridColumnGap | number>
    gridColumn?: ResponsiveValue<CSS.Property.GridColumn>
    gridRow?: ResponsiveValue<CSS.Property.GridRow>
    gridAutoFlow?: ResponsiveValue<CSS.Property.GridAutoFlow>
    gridAutoColumns?: ResponsiveValue<CSS.Property.GridAutoColumns>
    gridAutoRows?: ResponsiveValue<CSS.Property.GridAutoRows>
    gridTemplateColumns?: ResponsiveValue<CSS.Property.GridTemplateColumns>
    gridTemplateRows?: ResponsiveValue<CSS.Property.GridTemplateRows>
    gridTemplateAreas?: ResponsiveValue<CSS.Property.GridTemplateAreas>
    gridArea?: ResponsiveValue<CSS.Property.GridArea>

    // Position
    position?: ResponsiveValue<CSS.Property.Position>
    zIndex?: ResponsiveValue<CSS.Property.ZIndex | string>
    top?: ResponsiveValue<CSS.Property.Top | number>
    right?: ResponsiveValue<CSS.Property.Right | number>
    bottom?: ResponsiveValue<CSS.Property.Bottom | number>
    left?: ResponsiveValue<CSS.Property.Left | number>

    // Shadows and effects
    boxShadow?: ResponsiveValue<CSS.Property.BoxShadow | string>
    textShadow?: ResponsiveValue<CSS.Property.TextShadow>
    opacity?: ResponsiveValue<CSS.Property.Opacity>
    transform?: ResponsiveValue<CSS.Property.Transform>
    transition?: ResponsiveValue<CSS.Property.Transition>

    // Pseudo-selectors
    '&:hover'?: SystemStyleObject
    '&:focus'?: SystemStyleObject
    '&:active'?: SystemStyleObject
    '&:disabled'?: SystemStyleObject
    '&:first-child'?: SystemStyleObject
    '&:last-child'?: SystemStyleObject
    '&:nth-child(odd)'?: SystemStyleObject
    '&:nth-child(even)'?: SystemStyleObject

    // Responsive pseudo-selectors
    '&:hover:not(:disabled)'?: SystemStyleObject
    '&:focus-visible'?: SystemStyleObject

    // Allow any CSS property
    [property: string]: any
  }

  // Responsive value type
  export type ResponsiveValue<T> = T | T[]

  // Color mode type
  export type ColorMode = string

  // Hook types
  export function useThemeUI(): {
    theme: Theme
    colorMode: ColorMode
    setColorMode: (mode: ColorMode) => void
  }

  export function useColorMode(): [ColorMode, (mode: ColorMode) => void]

  // Component props with sx
  export interface SxProps {
    sx?: SystemStyleObject
  }

  // Theme provider props
  export interface ThemeUIProviderProps {
    theme: Theme
    children: React.ReactNode
  }

  // Component types
  export interface BoxProps extends SxProps {
    as?: React.ElementType
    variant?: string
    [key: string]: any
  }

  export interface TextProps extends SxProps {
    as?: React.ElementType
    variant?: string
    [key: string]: any
  }

  export interface HeadingProps extends SxProps {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    variant?: string
    [key: string]: any
  }

  export interface ButtonProps extends SxProps {
    variant?: string
    [key: string]: any
  }

  export interface FlexProps extends BoxProps {
    [key: string]: any
  }

  export interface GridProps extends BoxProps {
    columns?: ResponsiveValue<number | string>
    gap?: ResponsiveValue<number | string>
    [key: string]: any
  }

  export interface CardProps extends BoxProps {
    variant?: string
    [key: string]: any
  }

  export interface ImageProps extends SxProps {
    variant?: string
    [key: string]: any
  }

  export interface LinkProps extends SxProps {
    variant?: string
    [key: string]: any
  }

  // Export all components
  export const ThemeUIProvider: React.ComponentType<ThemeUIProviderProps>
  export const Box: React.ComponentType<BoxProps>
  export const Flex: React.ComponentType<FlexProps>
  export const Grid: React.ComponentType<GridProps>
  export const Text: React.ComponentType<TextProps>
  export const Heading: React.ComponentType<HeadingProps>
  export const Button: React.ComponentType<ButtonProps>
  export const Link: React.ComponentType<LinkProps>
  export const Image: React.ComponentType<ImageProps>
  export const Card: React.ComponentType<CardProps>
  export const Input: React.ComponentType<SxProps>
  export const Label: React.ComponentType<SxProps>
  export const Textarea: React.ComponentType<SxProps>
  export const Select: React.ComponentType<SxProps>
  export const Checkbox: React.ComponentType<SxProps>
  export const Radio: React.ComponentType<SxProps>
  export const Slider: React.ComponentType<SxProps>
  export const Progress: React.ComponentType<SxProps>
  export const Divider: React.ComponentType<SxProps>
  export const Badge: React.ComponentType<SxProps>
  export const Alert: React.ComponentType<SxProps>
  export const Close: React.ComponentType<SxProps>
  export const Avatar: React.ComponentType<SxProps>
  export const IconButton: React.ComponentType<SxProps>
  export const MenuButton: React.ComponentType<SxProps>
  export const NavLink: React.ComponentType<SxProps>
}

// Augment @emotion/react module for sx prop
declare module '@emotion/react' {
  export interface Theme extends import('theme-ui').Theme {}
}

// CSS namespace for TypeScript CSS properties
declare namespace CSS {
  interface Properties {
    [key: string]: any
  }
}

// JSX pragma for Theme UI
declare namespace React {
  interface DOMAttributes<T> {
    sx?: import('theme-ui').SystemStyleObject
  }
}