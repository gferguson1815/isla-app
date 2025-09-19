# Introduction

This document outlines the complete fullstack architecture for the Modern Link Management Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

After analyzing the competitive landscape and available resources, we'll adopt a **hybrid approach**:

1. **Architecture Inspiration**: Study Dub.co's open-source architecture (github.com/dubinc/dub) which successfully handles 100M+ clicks/month. Key learnings:
   - Turborepo monorepo structure for code organization
   - Next.js with Middleware for high-performance redirects
   - Redis caching strategy for link metadata
   - Prisma ORM with PlanetScale (MySQL)
   - Upstash for Redis/caching needs
   - Tinybird for real-time analytics pipeline

2. **Starting Point**: Use Vercel's Next.js App Router starter with:
   - TypeScript configuration
   - Tailwind CSS setup
   - Vercel deployment optimizations
   - Edge function templates

3. **Key Architectural Differences from Dub.co**:
   - Use Supabase instead of PlanetScale (per PRD requirements)
   - Implement Row Level Security (RLS) for multi-tenancy vs separate database approach
   - Focus on SMB market vs enterprise features
   - Simpler pricing model ($0→$19→$49 vs complex enterprise tiers)

## Change Log

| Date       | Version | Description                      | Author  |
| ---------- | ------- | -------------------------------- | ------- |
| 2025-09-18 | 1.0     | Initial architecture document    | Winston |
| 2025-09-18 | 1.1     | Added three-environment strategy | Winston |
