import { Schema } from "effect"

export const OwnerSchema = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  url: Schema.optional(Schema.String),
})

export type Owner = typeof OwnerSchema.Type

export const GithubSourceSchema = Schema.Struct({
  source: Schema.Literal("github"),
  repo: Schema.String,
  ref: Schema.optional(Schema.String),
  sha: Schema.optional(Schema.String),
})

export const GitUrlSourceSchema = Schema.Struct({
  source: Schema.Literal("url"),
  url: Schema.String,
  ref: Schema.optional(Schema.String),
  sha: Schema.optional(Schema.String),
})

export const GitSubdirSourceSchema = Schema.Struct({
  source: Schema.Literal("git-subdir"),
  url: Schema.String,
  path: Schema.String,
  ref: Schema.optional(Schema.String),
  sha: Schema.optional(Schema.String),
})

export const NpmSourceSchema = Schema.Struct({
  source: Schema.Literal("npm"),
  package: Schema.String,
  version: Schema.optional(Schema.String),
  registry: Schema.optional(Schema.String),
})

export const RemoteSourceSchema = Schema.Union(
  GithubSourceSchema,
  GitUrlSourceSchema,
  GitSubdirSourceSchema,
  NpmSourceSchema
)

export type RemoteSource = typeof RemoteSourceSchema.Type

export const PluginSourceSchema = Schema.Union(Schema.String, RemoteSourceSchema)

export type PluginSource = typeof PluginSourceSchema.Type

export const PluginAuthorSchema = Schema.Struct({
  name: Schema.String,
  email: Schema.optional(Schema.String),
})

export const PluginEntrySchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  source: PluginSourceSchema,
  version: Schema.optional(Schema.String),
  author: Schema.optional(PluginAuthorSchema),
  category: Schema.optional(Schema.String),
  homepage: Schema.optional(Schema.String),
  strict: Schema.optional(Schema.Boolean),
  lspServers: Schema.optional(Schema.Unknown),
  mcpServers: Schema.optional(Schema.Unknown),
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

export const PluginManifestSchema = Schema.Struct({
  name: Schema.String,
  version: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  author: Schema.optional(PluginAuthorSchema),
  keywords: Schema.optional(Schema.Array(Schema.String)),
})

export type PluginManifest = typeof PluginManifestSchema.Type

export const isLocalSource = (source: PluginSource): source is string =>
  typeof source === "string"

export const isPinned = (source: PluginSource): boolean => {
  if (typeof source === "string") return false
  if (source.source === "npm") return source.version !== undefined
  return source.ref !== undefined || source.sha !== undefined
}

const pinSuffix = (source: { readonly ref?: string; readonly sha?: string }): string => {
  if (source.sha !== undefined) return `@${source.sha}`
  if (source.ref !== undefined) return `@${source.ref}`
  return ""
}

export const formatSource = (source: PluginSource): string => {
  if (typeof source === "string") return source
  switch (source.source) {
    case "github":
      return `github:${source.repo}${pinSuffix(source)}`
    case "url":
      return `git:${source.url}${pinSuffix(source)}`
    case "git-subdir":
      return `git:${source.url}#${source.path}${pinSuffix(source)}`
    case "npm":
      return source.version === undefined
        ? `npm:${source.package}`
        : `npm:${source.package}@${source.version}`
  }
}
