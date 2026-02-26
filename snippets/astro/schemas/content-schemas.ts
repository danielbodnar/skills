// Content collection schemas using Zod
import { z } from 'zod';

// Base schemas for reusable fields
export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const SocialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  instagram: z.string().url().optional(),
  website: z.string().url().optional(),
});

export const SEOSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonical: z.string().url().optional(),
  noindex: z.boolean().default(false),
  ogImage: z.string().optional(),
});

// Blog post schema
export const BlogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string(),
  tags: z.array(z.string()).default([]),
  category: z.enum(['tech', 'design', 'business', 'personal']).optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  image: ImageSchema.optional(),
  readingTime: z.number().positive().optional(),
  seo: SEOSchema.optional(),
  relatedPosts: z.array(z.string()).max(5).default([]),
  tableOfContents: z.boolean().default(true),
});

// Work/Portfolio schema
export const WorkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  publishDate: z.coerce.date(),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  img: z.string(),
  img_alt: z.string().optional(),
  category: z.enum(['web', 'mobile', 'design', 'backend', 'fullstack', 'other']),
  featured: z.boolean().default(false),
  status: z.enum(['completed', 'in-progress', 'archived']).default('completed'),
  client: z.string().optional(),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  technologies: z.array(z.string()).default([]),
  repository: z.string().url().optional(),
  live_url: z.string().url().optional(),
  gallery: z.array(ImageSchema).max(10).default([]),
  testimonial: z.object({
    quote: z.string(),
    author: z.string(),
    position: z.string().optional(),
    company: z.string().optional(),
    avatar: z.string().optional(),
  }).optional(),
  metrics: z.object({
    performance: z.number().min(0).max(100).optional(),
    accessibility: z.number().min(0).max(100).optional(),
    seo: z.number().min(0).max(100).optional(),
    bestPractices: z.number().min(0).max(100).optional(),
  }).optional(),
});

// Author schema
export const AuthorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  email: z.string().email('Valid email is required'),
  avatar: z.string().url('Avatar must be a valid URL'),
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  social: SocialLinksSchema.optional(),
  featured: z.boolean().default(false),
  expertise: z.array(z.string()).default([]),
  yearsOfExperience: z.number().int().min(0).optional(),
});

// Product schema (for e-commerce or SaaS)
export const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description is required'),
  shortDescription: z.string().max(160).optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  sku: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  inventory: z.number().int().min(0).optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'in']).default('cm'),
  }).optional(),
  images: z.array(ImageSchema).min(1, 'At least one image is required'),
  featured: z.boolean().default(false),
  digitalProduct: z.boolean().default(false),
  downloadUrl: z.string().url().optional(),
  variants: z.array(z.object({
    name: z.string(),
    value: z.string(),
    price: z.number().positive().optional(),
    sku: z.string().optional(),
  })).default([]),
  seo: SEOSchema.optional(),
});

// Event schema
export const EventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().min(10, 'Description is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.object({
    name: z.string(),
    address: z.string().optional(),
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  virtual: z.boolean().default(false),
  meetingUrl: z.string().url().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  capacity: z.number().int().positive().optional(),
  category: z.enum(['conference', 'workshop', 'meetup', 'webinar', 'other']),
  tags: z.array(z.string()).default([]),
  image: ImageSchema.optional(),
  organizer: z.string(),
  speakers: z.array(z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    company: z.string().optional(),
    social: SocialLinksSchema.optional(),
  })).default([]),
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
    description: z.string().optional(),
    speaker: z.string().optional(),
  })).default([]),
  registrationRequired: z.boolean().default(true),
  registrationUrl: z.string().url().optional(),
  featured: z.boolean().default(false),
});

// FAQ schema
export const FAQSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
  category: z.string().optional(),
  order: z.number().int().default(0),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// Testimonial schema
export const TestimonialSchema = z.object({
  quote: z.string().min(10, 'Quote must be at least 10 characters'),
  author: z.string().min(1, 'Author name is required'),
  position: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().url().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  featured: z.boolean().default(false),
  project: z.string().optional(), // Reference to work item
  date: z.coerce.date().optional(),
  social: SocialLinksSchema.optional(),
});

// Newsletter schema
export const NewsletterSchema = z.object({
  title: z.string().min(1, 'Newsletter title is required'),
  subject: z.string().min(1, 'Email subject is required'),
  description: z.string().optional(),
  content: z.string().min(10, 'Content is required'),
  publishDate: z.coerce.date(),
  sent: z.boolean().default(false),
  sentDate: z.coerce.date().optional(),
  recipients: z.number().int().min(0).default(0),
  opens: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// Pages schema (for CMS-like content)
export const PageSchema = z.object({
  title: z.string().min(1, 'Page title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  template: z.enum(['default', 'landing', 'contact', 'about']).default('default'),
  published: z.boolean().default(true),
  publishDate: z.coerce.date().optional(),
  lastModified: z.coerce.date().optional(),
  author: z.string().optional(),
  seo: SEOSchema.optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  parentPage: z.string().optional(),
  showInNavigation: z.boolean().default(true),
  requireAuth: z.boolean().default(false),
});

// Export all schemas for use in content.config.ts
export {
  BlogSchema,
  WorkSchema,
  AuthorSchema,
  ProductSchema,
  EventSchema,
  FAQSchema,
  TestimonialSchema,
  NewsletterSchema,
  PageSchema,
  ImageSchema,
  SocialLinksSchema,
  SEOSchema,
};