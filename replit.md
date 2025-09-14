# DIECAST BR - Miniature Car Collection App

## Overview
This is a Next.js application for managing miniature car collections (Hot Wheels and other brands). The app includes features like:
- User authentication via Supabase
- OCR text recognition for automatic miniature identification
- Collection management and trading system
- Real-time data with Supabase integration

## Recent Changes (September 14, 2025)
- **Project Import**: Successfully imported from GitHub v0.app project
- **Dependencies**: Installed all npm packages including Next.js 14.2.16, Supabase, and Radix UI components
- **Environment Setup**: Configured Supabase environment variables for authentication and database access
- **Replit Configuration**: Set up Next.js dev server on port 5000 with proper host configuration
- **Authentication Fix**: Fixed critical Supabase SSR cookie handling for proper session management
- **Deployment**: Configured for autoscale deployment with build and start commands

## Project Architecture
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL) with authentication
- **UI**: Radix UI components with Tailwind CSS
- **State Management**: TanStack React Query for server state
- **OCR**: Tesseract.js for automatic miniature identification
- **Analytics**: Vercel Analytics integration

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for backend operations
- `DATABASE_URL`: Direct database connection URL

## Development Workflow
- **Start Server**: `npm run dev` (configured for port 5000)
- **Build**: `npm run build` 
- **Production**: `npm start`
- **Linting**: `npm run lint`

## Key Features
- **Authentication**: Email/password and OAuth via Supabase Auth
- **Collection Management**: Add, edit, and organize miniature cars
- **OCR Integration**: Automatic miniature identification from photos
- **Trading System**: User-to-user trading functionality
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## File Structure
- `/app`: Next.js App Router pages and API routes
- `/components`: Reusable React components organized by feature
- `/lib`: Utility functions and service integrations
- `/integrations`: Supabase client configuration
- `/scripts`: Database and data import scripts
- `/public`: Static assets and images

Current state: Fully functional development environment ready for use.