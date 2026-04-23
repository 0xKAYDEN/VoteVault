import { z } from 'zod';

const nullableString = z.string().nullable().optional().or(z.literal(''));
const urlSchema = z.string().url().nullable().optional().or(z.literal(''));

export const createServerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    short_description: z.string().min(5).max(255),
    long_description: nullableString,
    logo_url: urlSchema,
    banner_url: urlSchema,
    website_url: urlSchema,
    discord_url: urlSchema,
    version: nullableString,
    rate: nullableString,
    region: nullableString,
    features: nullableString,
    events_time: nullableString,
    upcoming_updates: nullableString,
  })
});

export const updateServerSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    short_description: z.string().min(5).max(255).optional(),
    long_description: nullableString,
    logo_url: urlSchema,
    banner_url: urlSchema,
    website_url: urlSchema,
    discord_url: urlSchema,
    version: nullableString,
    rate: nullableString,
    region: nullableString,
    features: nullableString,
    events_time: nullableString,
    upcoming_updates: nullableString,
    status: z.enum(['pending', 'approved', 'rejected', 'banned']).optional(),
  })
});
