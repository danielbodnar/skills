// Theme UI Responsive Design Patterns

/** @jsxImportSource theme-ui */
import { Box, Flex, Grid, Text, Heading, Button, Image, Card } from 'theme-ui'
import { Theme } from 'theme-ui'

// 1. Responsive Theme Configuration
export const responsiveTheme: Theme = {
  breakpoints: ['40em', '52em', '64em', '80em'], // sm, md, lg, xl
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    muted: '#f6f6f6',
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'inherit',
  },
  fontSizes: [12, 14, 16, 18, 20, 24, 32, 48, 64, 96],
  space: [0, 4, 8, 16, 24, 32, 48, 64, 96, 128],
  sizes: {
    container: [320, 768, 1024, 1280],
    sidebar: [280, 320],
  },
}

// 2. Responsive Typography
export const ResponsiveTypography = () => (
  <Box sx={{ padding: [2, 3, 4] }}>
    {/* Mobile-first responsive font sizes */}
    <Heading
      sx={{
        fontSize: [4, 5, 6, 7], // 20px, 24px, 32px, 48px
        lineHeight: [1.2, 1.3, 1.4],
        marginBottom: [2, 3, 4],
        textAlign: ['center', 'left'], // center on mobile, left on tablet+
      }}
    >
      Responsive Heading
    </Heading>
    
    <Text
      sx={{
        fontSize: [2, 3, 4], // 16px, 18px, 20px
        lineHeight: [1.4, 1.5, 1.6],
        marginBottom: [3, 4],
        maxWidth: ['100%', '80%', '60%'], // full width on mobile, constrained on larger screens
      }}
    >
      This text scales responsively across different screen sizes.
    </Text>
  </Box>
)

// 3. Responsive Layout Grid
export const ResponsiveGrid = () => (
  <Grid
    columns={[1, 2, 3, 4]} // 1 col mobile, 2 tablet, 3 desktop, 4 large
    gap={[2, 3, 4]}
    sx={{
      padding: [2, 3, 4],
      maxWidth: 'container',
      margin: '0 auto',
    }}
  >
    {Array.from({ length: 8 }).map((_, i) => (
      <Card
        key={i}
        sx={{
          padding: [2, 3],
          minHeight: [120, 140, 160],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bg: 'muted',
          borderRadius: 'default',
        }}
      >
        Item {i + 1}
      </Card>
    ))}
  </Grid>
)

// 4. Responsive Navigation
export const ResponsiveNav = () => (
  <Box
    as="nav"
    sx={{
      bg: 'background',
      borderBottom: '1px solid',
      borderColor: 'muted',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}
  >
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: [2, 3],
        maxWidth: 'container',
        margin: '0 auto',
      }}
    >
      {/* Logo */}
      <Text
        sx={{
          fontSize: [3, 4],
          fontWeight: 'bold',
          color: 'primary',
        }}
      >
        Logo
      </Text>
      
      {/* Desktop Navigation */}
      <Flex
        sx={{
          display: ['none', 'none', 'flex'], // hidden on mobile/tablet
          gap: [3, 4],
          alignItems: 'center',
        }}
      >
        <Text>Home</Text>
        <Text>About</Text>
        <Text>Services</Text>
        <Text>Contact</Text>
        <Button variant="primary" sx={{ ml: 2 }}>
          Get Started
        </Button>
      </Flex>
      
      {/* Mobile Menu Button */}
      <Button
        sx={{
          display: ['block', 'block', 'none'], // visible on mobile/tablet only
          bg: 'transparent',
          color: 'text',
          border: '1px solid',
          borderColor: 'muted',
          padding: 2,
        }}
      >
        ☰
      </Button>
    </Flex>
  </Box>
)

// 5. Responsive Hero Section
export const ResponsiveHero = () => (
  <Box
    sx={{
      background: 'linear-gradient(45deg, primary, secondary)',
      color: 'background',
      padding: [4, 5, 6],
      textAlign: 'center',
      minHeight: ['60vh', '70vh', '80vh'],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box
      sx={{
        maxWidth: ['90%', '80%', '60%'],
      }}
    >
      <Heading
        sx={{
          fontSize: [5, 6, 7, 8], // 24px, 32px, 48px, 64px
          marginBottom: [3, 4],
          lineHeight: 1.2,
        }}
      >
        Build Amazing Experiences
      </Heading>
      
      <Text
        sx={{
          fontSize: [2, 3, 4], // 16px, 18px, 20px
          marginBottom: [4, 5],
          opacity: 0.9,
          lineHeight: 1.6,
        }}
      >
        Create responsive, accessible, and beautiful user interfaces with Theme UI.
      </Text>
      
      <Flex
        sx={{
          gap: [2, 3],
          justifyContent: 'center',
          flexDirection: ['column', 'row'], // stack on mobile, row on tablet+
          alignItems: 'center',
        }}
      >
        <Button
          sx={{
            bg: 'background',
            color: 'primary',
            fontSize: [2, 3],
            padding: [2, 3],
            minWidth: [200, 'auto'],
          }}
        >
          Get Started
        </Button>
        
        <Button
          sx={{
            bg: 'transparent',
            color: 'background',
            border: '2px solid',
            borderColor: 'background',
            fontSize: [2, 3],
            padding: [2, 3],
            minWidth: [200, 'auto'],
          }}
        >
          Learn More
        </Button>
      </Flex>
    </Box>
  </Box>
)

// 6. Responsive Image Gallery
export const ResponsiveImageGallery = () => {
  const images = Array.from({ length: 12 }, (_, i) => 
    `https://picsum.photos/400/300?random=${i}`
  )
  
  return (
    <Box sx={{ padding: [2, 3, 4] }}>
      <Grid
        columns={[1, 2, 3, 4]} // responsive columns
        gap={[2, 3, 4]}
        sx={{
          maxWidth: 'container',
          margin: '0 auto',
        }}
      >
        {images.map((src, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'default',
              aspectRatio: [1, 4/3], // square on mobile, 4:3 on larger screens
            }}
          >
            <Image
              src={src}
              alt={`Gallery image ${index + 1}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: ['none', 'scale(1.05)'], // no hover effect on mobile
                },
              }}
            />
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

// 7. Responsive Sidebar Layout
export const ResponsiveSidebar = () => (
  <Grid
    columns={['1fr', '1fr', '280px 1fr']} // single column on mobile, sidebar on desktop
    gap={[0, 0, 4]}
    sx={{
      minHeight: '100vh',
      maxWidth: 'container',
      margin: '0 auto',
    }}
  >
    {/* Sidebar */}
    <Box
      sx={{
        bg: 'muted',
        padding: [3, 3, 4],
        display: ['none', 'none', 'block'], // hidden on mobile/tablet
      }}
    >
      <Text sx={{ fontWeight: 'bold', mb: 3 }}>Navigation</Text>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Text>Dashboard</Text>
        <Text>Analytics</Text>
        <Text>Settings</Text>
        <Text>Profile</Text>
      </Box>
    </Box>
    
    {/* Main Content */}
    <Box sx={{ padding: [3, 3, 4] }}>
      <Heading sx={{ mb: 4 }}>Main Content</Heading>
      <Text>
        This layout adapts from a single column on mobile to a sidebar layout on desktop.
      </Text>
    </Box>
  </Grid>
)

// 8. Responsive Utilities
export const getResponsiveValue = <T,>(
  values: T | T[],
  breakpointIndex: number
): T => {
  if (Array.isArray(values)) {
    return values[breakpointIndex] ?? values[values.length - 1]
  }
  return values
}

export const useBreakpoint = () => {
  // This would need to be implemented with useEffect and matchMedia
  // for actual breakpoint detection in a real application
  const breakpoints = ['40em', '52em', '64em']
  return { breakpoints, current: 'md' }
}

// 9. Container Component with Max Widths
export const Container = ({ children, size = 'default' }: {
  children: React.ReactNode
  size?: 'narrow' | 'default' | 'wide' | 'full'
}) => {
  const maxWidths = {
    narrow: [320, 480, 640],
    default: [320, 768, 1024],
    wide: [320, 968, 1280],
    full: '100%',
  }
  
  return (
    <Box
      sx={{
        maxWidth: maxWidths[size],
        margin: '0 auto',
        padding: [2, 3, 4],
      }}
    >
      {children}
    </Box>
  )
}