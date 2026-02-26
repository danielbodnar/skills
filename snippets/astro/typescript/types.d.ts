// src/env.d.ts or global type definitions
/// <reference types="astro/client" />

// Extend Astro's App namespace for type safety
declare namespace App {
  interface Locals {
    // Authentication
    user?: {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'admin' | 'moderator';
      avatar?: string;
    };
    isAuthenticated?: boolean;
    hasRole?: (role: string) => boolean;
    
    // Session management
    session?: {
      id: string;
      data: Record<string, any>;
      save: () => Promise<void>;
      destroy: () => Promise<void>;
    };
    
    // Request context
    requestId?: string;
    startTime?: number;
    
    // Feature flags
    features?: {
      enableBetaFeatures: boolean;
      enableAnalytics: boolean;
      maintenanceMode: boolean;
    };
  }
  
  interface PageData {
    title?: string;
    description?: string;
    image?: string;
    canonical?: string;
    noindex?: boolean;
  }
}

// Environment variables type safety
interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly JWT_SECRET: string;
  readonly API_BASE_URL: string;
  readonly SMTP_HOST: string;
  readonly SMTP_PORT: number;
  readonly SMTP_USER: string;
  readonly SMTP_PASS: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly STRIPE_PUBLIC_KEY: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly CLOUDINARY_CLOUD_NAME: string;
  readonly CLOUDINARY_API_KEY: string;
  readonly CLOUDINARY_API_SECRET: string;
  readonly ANALYTICS_ID?: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Content Collections types
declare module 'astro:content' {
  interface ContentCollectionData {
    blog: {
      title: string;
      description: string;
      pubDate: Date;
      updatedDate?: Date;
      author: string;
      tags: string[];
      featured: boolean;
      draft: boolean;
      image?: {
        src: string;
        alt: string;
      };
    };
    
    work: {
      title: string;
      description: string;
      publishDate: Date;
      tags: string[];
      img: string;
      img_alt?: string;
      category: 'web' | 'mobile' | 'design' | 'other';
      featured: boolean;
      repository?: string;
      live_url?: string;
    };
    
    authors: {
      name: string;
      bio: string;
      email: string;
      avatar: string;
      social?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
    };
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
}

export interface NewsletterFormData {
  email: string;
  firstName?: string;
  interests?: string[];
}

// Database types (example with Prisma-style types)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  author: User;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postsCount: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Component prop types
export interface BaseComponentProps {
  class?: string;
  id?: string;
  'data-testid'?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  image?: string;
  href?: string;
  target?: '_blank' | '_self';
}

// Third-party library extensions
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    dataLayer?: any[];
    plausible?: (event: string, options?: any) => void;
  }
}

// Module declarations for assets
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.avif' {
  const content: string;
  export default content;
}