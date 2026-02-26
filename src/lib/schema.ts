import { Schema } from "effect"

export const OwnerSchema = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  url: Schema.optional(Schema.String),
})

export type Owner = typeof OwnerSchema.Type

export const PluginEntrySchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  source: Schema.String,
  category: Schema.optional(Schema.String),
})

export type PluginEntry = typeof PluginEntrySchema.Type

export const MetadataSchema = Schema.Struct({
  description: Schema.String,
  version: Schema.String,
})

export type Metadata = typeof MetadataSchema.Type

export const MarketplaceSchema = Schema.Struct({
  $schema: Schema.optional(Schema.String),
  name: Schema.String,
  metadata: MetadataSchema,
  owner: OwnerSchema,
  plugins: Schema.Array(PluginEntrySchema),
})

export type Marketplace = typeof MarketplaceSchema.Type

export const PluginAuthorSchema = Schema.Struct({
  name: Schema.String,
  email: Schema.optional(Schema.String),
})

export const PluginManifestSchema = Schema.Struct({
  name: Schema.String,
  version: Schema.String,
  description: Schema.String,
  author: Schema.optional(PluginAuthorSchema),
  keywords: Schema.optional(Schema.Array(Schema.String)),
})

export type PluginManifest = typeof PluginManifestSchema.Type
