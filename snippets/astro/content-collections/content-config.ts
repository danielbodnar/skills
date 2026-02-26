// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Blog collection using glob loader
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }).optional(),
  }),
});

// Authors collection using file loader
const authors = defineCollection({
  loader: file('src/data/authors.json'),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    email: z.string().email(),
    avatar: z.string().url(),
    social: z.object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }),
});

// Portfolio/work collection
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/work' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()),
    img: z.string(),
    img_alt: z.string().optional(),
    category: z.enum(['web', 'mobile', 'design', 'other']),
    featured: z.boolean().default(false),
    repository: z.string().url().optional(),
    live_url: z.string().url().optional(),
  }),
});

// Products collection with references
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/products' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    price: z.number(),
    category: z.string(),
    inStock: z.boolean().default(true),
    // Reference to authors collection
    author: z.string().optional(),
  }),
});

export const collections = {
  blog,
  authors,
  work,
  products,
};