# PopUpEmpire Kingdom-1 Daily Command Center - Tech Stack

This document outlines the technology stack and architecture for the Kingdom-1 Daily Command Center application.

## Core Technologies

### Frontend Framework
**Next.js 16.2.2**
- **App Router** - Modern routing with server and client components
- **React 19.2.4** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Server Components** - Improved performance and SEO

### UI & Styling
**Tailwind CSS 4**
- Utility-first CSS framework
- Custom design system via CSS variables in `globals.css`
- PostCSS for processing

**Shadcn/ui Components**
- Accessible, customizable UI components
- Built with Radix UI primitives
- Variants managed via `class-variance-authority`

**Additional UI Libraries**
- `lucide-react` - Icon library
- `reactflow` - Interactive canvas/flow diagrams
- `clsx` + `tailwind-merge` - Conditional class composition

### Database & ORM
**Prisma 7.6.0**
- Type-safe database client
- Schema-driven development
- Automatic migrations

**SQLite**
- Local-first data storage
- Fast performance for caching
- File-based database (`dev.db`)
- Schema location: `prisma/schema.prisma`

### State Management
**Zustand 5.0**
- Lightweight state management
- Simple, unopinionated API
- No boilerplate

**TanStack Query 5.96**
- Server state management
- Automatic caching and revalidation
- Optimistic updates

### Data Validation
**Zod 4.3**
- TypeScript-first schema validation
- Runtime type checking
- API request/response validation

### HTTP Client
**Axios 1.14**
- Promise-based HTTP client
- Request/response interceptors
- Used for external API integrations

## External Integrations

### Notion API
**Package:** `@notionhq/client` (v5.16.0)

**Purpose:** Sync projects, tasks, and documents from Notion databases

**Integration Method:**
- Manual sync endpoint (triggered via external cron or manual API call)
- Official Notion SDK
- Implementation: `lib/notion/`

**Required Credentials:**
- `NOTION_API_KEY` - Integration token
- `NOTION_DATABASE_ID_PROJECTS` - Projects database ID
- `NOTION_DATABASE_ID_TASKS` - Tasks database ID  
- `NOTION_DATABASE_ID_DOCS` - Documents database ID

### Taskade API
**Purpose:** Two-way sync with Taskade workspaces

**Integration Method:**
- REST API for fetching data
- Webhooks for real-time updates
- Custom client implementation
- Implementation: `lib/taskade/`

**Required Credentials:**
- `TASKADE_API_TOKEN` - Personal access token
- `TASKADE_WORKSPACE_ID` - Workspace identifier
- `TASKADE_WEBHOOK_SECRET` - Webhook verification secret

## Development Tools

### Linting & Code Quality
**ESLint 9**
- `eslint-config-next` - Next.js-specific rules
- Configuration: `eslint.config.mjs`

### Package Management
**npm**
- Lock file: `package-lock.json`
- Scripts defined in `package.json`

### Environment Management
**dotenv 17.4**
- Environment variable loading
- Development configuration

## Security & Configuration Management

### API Keys and Secrets

**CRITICAL: All API keys, tokens, and secrets MUST be managed via environment variables.**

**✅ Correct Approach:**
1. Store all secrets in `.env.local` (never committed to git)
2. Reference via `process.env.VARIABLE_NAME` in code
3. Provide a `.env.local.example` template with dummy values
4. Add `.env.local` to `.gitignore`

**❌ Never Do This:**
- Hardcode secrets in source files
- Commit API keys to version control
- Store secrets in `config.js` or similar tracked files

### Required Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Notion Integration
NOTION_API_KEY="secret_xxxxxxxxxxxxx"
NOTION_DATABASE_ID_PROJECTS="xxxxxxxxxxxxx"
NOTION_DATABASE_ID_TASKS="xxxxxxxxxxxxx"
NOTION_DATABASE_ID_DOCS="xxxxxxxxxxxxx"

# Taskade Integration
TASKADE_API_TOKEN="xxxxxxxxxxxxx"
TASKADE_WORKSPACE_ID="xxxxxxxxxxxxx"
TASKADE_WEBHOOK_SECRET="xxxxxxxxxxxxx"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Environment Variable Access

**Server-side** (API routes, server components):
```typescript
const apiKey = process.env.NOTION_API_KEY;
```

**Client-side** (browser JavaScript):
```typescript
// Only variables prefixed with NEXT_PUBLIC_ are exposed to the browser
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

**Important:** Never prefix secret keys with `NEXT_PUBLIC_` as this exposes them to the client bundle.

## Project Structure

```
kingdom-1-daily-command-center/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard route group
│   │   ├── page.tsx            # Main dashboard
│   │   ├── projects/           # Projects Kanban view
│   │   ├── calendar/           # Calendar view
│   │   └── canvas/             # System map canvas
│   ├── api/                    # API routes
│   │   ├── notion/             # Notion sync endpoints
│   │   ├── taskade/            # Taskade sync & webhooks
│   │   └── unified/            # Aggregated data endpoints
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── canvas/                 # Canvas/flow components
│   └── layout/                 # Layout components
├── lib/
│   ├── notion/                 # Notion client & utilities
│   ├── taskade/                # Taskade client & utilities
│   ├── unified/                # Data aggregation logic
│   ├── prisma.ts              # Prisma client singleton
│   └── utils.ts               # Shared utilities
├── prisma/
│   └── schema.prisma          # Database schema
├── types/                     # TypeScript type definitions
├── public/                    # Static assets
└── .env.local                # Environment variables (not in git)
```

## Data Models

Prisma schema defines the following models:

- **Project** - Projects from Notion/Taskade
- **Task** - Tasks from both sources
- **CalendarEvent** - Calendar events
- **CanvasNode** - System map nodes
- **CanvasEdge** - System map connections
- **SyncLog** - Sync history and error tracking

All models include:
- `source` enum (NOTION | TASKADE)
- `externalId` - Original source system ID
- `lastSyncAt` - Last synchronization timestamp

## Data Flow Architecture

### Notion → Application
1. Manual or cron-triggered sync (`/api/notion/sync`)
2. Fetch updates from Notion API
3. Transform to unified schema
4. Upsert to local SQLite cache
5. Serve via unified API endpoints

### Taskade → Application
1. Real-time webhook events (`/api/taskade/webhooks`)
2. Verify webhook signature
3. Transform to unified schema
4. Update local SQLite cache
5. Automatic UI updates via React Query

### Application → External APIs
1. User makes changes in UI
2. Optimistic update (immediate UI feedback)
3. API call to source system (Notion or Taskade)
4. Sync confirmation
5. Update local cache

## API Endpoints

### Notion
- `POST /api/notion/sync` - Manual sync trigger
- `GET /api/notion/databases` - List configured databases

### Taskade
- `POST /api/taskade/sync` - Manual sync trigger
- `POST /api/taskade/webhooks` - Webhook handler

### Unified Data
- `GET /api/unified/projects` - All projects (filterable by source/status)
- `GET /api/unified/tasks` - All tasks (filterable by source/status)
- `GET /api/unified/stats` - Dashboard statistics

## Development Workflow

### Local Development
```bash
npm install              # Install dependencies
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npm run dev             # Start dev server on :3000
```

### Database Management
```bash
npx prisma studio       # Visual database editor
npx prisma migrate dev  # Create new migration
npx prisma migrate reset # Reset database (dev only)
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run build          # Production build check
```

## Deployment

### Recommended Platform: Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Automatic deployments on push

### Environment Variables for Production

All variables from `.env.local` must be configured in Vercel:
- Update `NEXT_PUBLIC_APP_URL` to production domain
- Ensure all API keys are valid for production use

### External Configuration

- **Taskade Webhook URL** - Configure in the Taskade dashboard to point to: `https://your-domain.com/api/taskade/webhooks`

### Build Configuration

- **Build Command:** `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x or later

## Performance Considerations

### Caching Strategy
- Local SQLite cache reduces API calls
- React Query automatic cache invalidation
- Manual/cron-triggered sync for Notion
- Real-time webhooks for Taskade (no polling)

### Optimization Techniques
- Server Components for initial render
- Client Components only when needed
- Automatic code splitting
- Static asset optimization

## Future Integrations (Roadmap)

- Google Calendar API
- Slack API
- Additional productivity tools

## Security Best Practices

1. **Never commit secrets** - Use `.env.local` + `.gitignore`
2. **Validate webhook signatures** - (Planned) Verify Taskade webhook authenticity once implemented
3. **Sanitize user input** - Use Zod for validation
4. **Use HTTPS in production** - Especially for webhooks
5. **Rotate API keys regularly** - Update in environment variables
6. **Limit API key permissions** - Notion integrations should have minimal required access

## Troubleshooting

### "Cannot find module" errors
```bash
npx prisma generate
```

### Database locked errors
```bash
npx prisma migrate reset
```

### Environment variables not loading
1. Verify `.env.local` exists in project root
2. Restart dev server (`npm run dev`)
3. Check variable names match exactly (case-sensitive)

---

**Last Updated:** 2026-05-15
**Maintained By:** PopUpEmpire Development Team
