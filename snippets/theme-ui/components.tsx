// Theme UI Component Examples

/** @jsxImportSource theme-ui */
import {
  Box,
  Flex,
  Grid,
  Button,
  Text,
  Heading,
  Link,
  Image,
  Card,
  Input,
  Label,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Slider,
  Progress,
  Divider,
  Badge,
  Alert,
  Close,
  Avatar,
  IconButton,
  MenuButton,
  NavLink,
} from 'theme-ui'
import { ReactNode } from 'react'

// 1. Layout Components
export const LayoutExample = () => (
  <Box>
    {/* Basic Box */}
    <Box
      sx={{
        padding: 3,
        margin: 2,
        bg: 'muted',
        borderRadius: 'default',
      }}
    >
      Basic Box Component
    </Box>

    {/* Flex Layout */}
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 3,
        bg: 'background',
      }}
    >
      <Text>Left Content</Text>
      <Text>Right Content</Text>
    </Flex>

    {/* Grid Layout */}
    <Grid
      columns={[1, 2, 3]}
      gap={3}
      sx={{ padding: 3 }}
    >
      <Card>Grid Item 1</Card>
      <Card>Grid Item 2</Card>
      <Card>Grid Item 3</Card>
    </Grid>
  </Box>
)

// 2. Typography Components
export const TypographyExample = () => (
  <Box sx={{ padding: 3 }}>
    <Heading as="h1" variant="display">
      Display Heading
    </Heading>
    
    <Heading as="h2" sx={{ color: 'primary', mb: 3 }}>
      Section Heading
    </Heading>
    
    <Text variant="caps" sx={{ mb: 2 }}>
      Caps Text
    </Text>
    
    <Text sx={{ mb: 3, lineHeight: 'body' }}>
      Body text with proper line height and spacing.
    </Text>
    
    <Link href="#" sx={{ color: 'primary' }}>
      Themed Link
    </Link>
  </Box>
)

// 3. Button Variants
export const ButtonExample = () => (
  <Flex sx={{ gap: 3, flexWrap: 'wrap', padding: 3 }}>
    <Button variant="primary">
      Primary Button
    </Button>
    
    <Button variant="secondary">
      Secondary Button
    </Button>
    
    <Button
      sx={{
        variant: 'buttons.primary',
        bg: 'accent',
        '&:hover': { bg: 'secondary' },
      }}
    >
      Custom Button
    </Button>
    
    <IconButton
      sx={{
        width: 40,
        height: 40,
        borderRadius: 'circle',
      }}
    >
      ×
    </IconButton>
  </Flex>
)

// 4. Form Components
export const FormExample = () => (
  <Box
    as="form"
    sx={{
      maxWidth: 400,
      padding: 4,
      bg: 'muted',
      borderRadius: 'default',
    }}
  >
    <Label htmlFor="name">Name</Label>
    <Input
      id="name"
      name="name"
      placeholder="Enter your name"
      sx={{ mb: 3 }}
    />
    
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      name="email"
      type="email"
      placeholder="Enter your email"
      sx={{ mb: 3 }}
    />
    
    <Label htmlFor="message">Message</Label>
    <Textarea
      id="message"
      name="message"
      placeholder="Enter your message"
      rows={4}
      sx={{ mb: 3 }}
    />
    
    <Label htmlFor="category">Category</Label>
    <Select id="category" name="category" sx={{ mb: 3 }}>
      <option>General</option>
      <option>Support</option>
      <option>Feedback</option>
    </Select>
    
    <Label>
      <Checkbox sx={{ mr: 2 }} />
      Subscribe to newsletter
    </Label>
    
    <Flex sx={{ gap: 3, mt: 3 }}>
      <Label>
        <Radio name="priority" value="low" />
        Low
      </Label>
      <Label>
        <Radio name="priority" value="high" />
        High
      </Label>
    </Flex>
    
    <Button type="submit" sx={{ mt: 4, width: '100%' }}>
      Submit
    </Button>
  </Box>
)

// 5. Card Layouts
export const CardExample = () => (
  <Grid columns={[1, 2]} gap={4} sx={{ padding: 3 }}>
    <Card variant="primary">
      <Image
        src="https://via.placeholder.com/300x200"
        alt="Placeholder"
        sx={{ width: '100%', height: 200, objectFit: 'cover' }}
      />
      <Box sx={{ padding: 3 }}>
        <Heading as="h3" sx={{ mb: 2 }}>
          Card Title
        </Heading>
        <Text sx={{ mb: 3 }}>
          Card description with theme-aware styling.
        </Text>
        <Button variant="primary">
          Learn More
        </Button>
      </Box>
    </Card>
    
    <Card variant="compact">
      <Flex sx={{ alignItems: 'center', gap: 3 }}>
        <Avatar
          src="https://via.placeholder.com/60"
          alt="User"
          sx={{ flexShrink: 0 }}
        />
        <Box>
          <Heading as="h4" sx={{ mb: 1 }}>
            User Name
          </Heading>
          <Text sx={{ color: 'gray' }}>
            User description
          </Text>
          <Badge sx={{ mt: 1 }}>
            Online
          </Badge>
        </Box>
      </Flex>
    </Card>
  </Grid>
)

// 6. Interactive Components
export const InteractiveExample = () => (
  <Box sx={{ padding: 4 }}>
    <Alert sx={{ mb: 4 }}>
      <Text>This is an alert message.</Text>
      <Close sx={{ ml: 'auto' }} />
    </Alert>
    
    <Box sx={{ mb: 4 }}>
      <Text sx={{ mb: 2 }}>Progress Example</Text>
      <Progress value={0.6} sx={{ height: 8 }} />
    </Box>
    
    <Box sx={{ mb: 4 }}>
      <Text sx={{ mb: 2 }}>Slider Example</Text>
      <Slider defaultValue={50} />
    </Box>
    
    <Divider sx={{ my: 4 }} />
    
    <Flex sx={{ gap: 2, alignItems: 'center' }}>
      <MenuButton />
      <NavLink href="#home">Home</NavLink>
      <NavLink href="#about">About</NavLink>
      <NavLink href="#contact">Contact</NavLink>
    </Flex>
  </Box>
)

// 7. Custom Component with Theme Integration
interface ThemedComponentProps {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export const ThemedComponent = ({ 
  variant = 'primary', 
  children 
}: ThemedComponentProps) => (
  <Box
    sx={{
      padding: 3,
      borderRadius: 'default',
      bg: variant === 'primary' ? 'primary' : 'secondary',
      color: 'background',
      fontWeight: 'bold',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 'large',
      },
    }}
  >
    {children}
  </Box>
)

// 8. Responsive Image Gallery
export const ImageGallery = ({ images }: { images: string[] }) => (
  <Grid
    columns={[1, 2, 3, 4]}
    gap={3}
    sx={{ padding: 3 }}
  >
    {images.map((src, index) => (
      <Card key={index} sx={{ overflow: 'hidden' }}>
        <Image
          src={src}
          alt={`Gallery image ${index + 1}`}
          sx={{
            width: '100%',
            height: 200,
            objectFit: 'cover',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />
      </Card>
    ))}
  </Grid>
)