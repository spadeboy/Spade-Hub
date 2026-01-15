# Spade Hub - Torrent Sharing Platform

## Overview

Spade Hub is a torrent sharing platform where users can share and discover magnet links. The application allows the site owner (ashiksa88@gmail.com) to create, view, and manage torrent entries with support for categorization, search, and filtering. The platform maintains uploader anonymity by not exposing author information in the public interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Build System**: Vite for frontend, esbuild for server bundling
- **API Design**: RESTful endpoints under `/api/` prefix with typed request/response schemas

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via drizzle-kit with `db:push` command

### Authentication
- **Method**: Replit Auth integration using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Session Table**: `sessions` table (mandatory for Replit Auth)
- **User Table**: `users` table with profile information

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components including shadcn/ui
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Route page components
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── replit_integrations/auth/  # Replit Auth setup
│   ├── routes.ts        # API route handlers
│   └── storage.ts       # Database operations
└── shared/              # Shared types and schemas
    ├── schema.ts        # Drizzle table definitions
    ├── routes.ts        # API contract definitions
    └── models/auth.ts   # Auth-related schemas
```

### API Contract Pattern
The `shared/routes.ts` file defines a typed API contract with:
- Method, path, input schema, and response schemas for each endpoint
- Zod schemas for runtime validation on both client and server
- Type exports for request/response types

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Tables**: `users`, `sessions`, `torrents`

### Authentication
- **Replit Auth**: OpenID Connect provider at `https://replit.com/oidc`
- **Required Environment Variables**: 
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - Session encryption key
  - `REPL_ID` - Replit environment identifier
  - `ISSUER_URL` - OIDC issuer (defaults to Replit)

### UI Components
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Headless UI primitives for dialogs, dropdowns, forms, etc.
- **Lucide React**: Icon library

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Data fetching and caching
- `wouter`: Client-side routing
- `framer-motion`: Animations
- `passport`: Authentication middleware
- `openid-client`: OIDC client for Replit Auth