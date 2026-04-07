# Kingdom-1 Daily Command Center

A unified dashboard for project management and planning that integrates **Notion** and **Taskade** with two-way sync capabilities.

## Features

- 📊 **Unified Dashboard** - View projects and tasks from both Notion and Taskade in one place
- 🔄 **Two-Way Sync** - Changes sync bidirectionally between platforms
- 📋 **Kanban Board** - Visual project management with status columns
- 📅 **Calendar View** - See all events and deadlines from both sources
- 🗺️ **System Map** - Interactive canvas showing integrations and data flow
- ⚡ **Real-Time Updates** - Taskade webhooks for instant sync
- 💾 **Local Cache** - Fast performance with SQLite database

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma + SQLite
- **UI:** Tailwind CSS + Shadcn/ui
- **Canvas:** React Flow
- **Integrations:**
  - Notion API (@notionhq/client)
  - Taskade REST API
  - Webhooks for real-time sync

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Notion account with API access
- Taskade account with API access
- npm or pnpm package manager

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/PopUpEmpire-wtf/kingdom-1-daily-command-center.git
cd kingdom-1-daily-command-center
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

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

4. **Set up the database**

```bash
npx prisma generate
npx prisma migrate dev
```

5. **Run the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard!

## Configuration

### Getting Notion Credentials

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "Kingdom-1 Dashboard" and submit
4. Copy the "Internal Integration Token" → this is your `NOTION_API_KEY`
5. Share your Notion databases with this integration
6. Copy the database IDs from the URLs (the part between the workspace name and the `?v=`)

### Getting Taskade Credentials

1. Go to Taskade Settings → Developer → Personal Access Tokens
2. Create a new token → this is your `TASKADE_API_TOKEN`
3. Find your Workspace ID in the URL when viewing your workspace
4. Generate a webhook secret (any random string) for `TASKADE_WEBHOOK_SECRET`

### Setting up Taskade Webhooks

1. In Taskade, go to Settings → Webhooks
2. Add a new webhook pointing to: `https://your-domain.com/api/taskade/webhooks`
3. Select events: task.created, task.updated, task.deleted, project.updated

## Project Structure

```
kingdom-1-daily-command-center/
├── app/
│   ├── (dashboard)/         # Dashboard routes
│   │   ├── page.tsx         # Main dashboard
│   │   ├── projects/        # Projects kanban view
│   │   ├── calendar/        # Calendar view
│   │   └── canvas/          # System map
│   ├── api/                 # API routes
│   │   ├── notion/          # Notion integration
│   │   ├── taskade/         # Taskade integration
│   │   └── unified/         # Unified data endpoints
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Shadcn components
│   ├── canvas/              # Canvas components
│   ├── layout/              # Layout components
│   └── projects/            # Project components
├── lib/
│   ├── notion/              # Notion client & sync
│   ├── taskade/             # Taskade client & sync
│   ├── unified/             # Data aggregation
│   └── prisma.ts            # Prisma client
├── prisma/
│   └── schema.prisma        # Database schema
└── types/                   # TypeScript types
```

## API Endpoints

### Notion
- `POST /api/notion/sync` - Trigger manual sync
- `GET /api/notion/databases` - List Notion databases

### Taskade
- `POST /api/taskade/sync` - Trigger manual sync
- `POST /api/taskade/webhooks` - Webhook handler (for Taskade)

### Unified
- `GET /api/unified/projects` - Get all projects
- `GET /api/unified/tasks` - Get all tasks
- `GET /api/unified/stats` - Get dashboard statistics

Query parameters:
- `?source=NOTION` - Filter by source
- `?source=TASKADE` - Filter by source
- `?status=TODO` - Filter by status

## Data Flow

1. **Notion** → Polls every 60 seconds → Local Cache → Dashboard
2. **Taskade** → Real-time webhooks → Local Cache → Dashboard
3. **Dashboard** → User updates → Sync back to source (Notion or Taskade)

## Features in Detail

### Unified Dashboard

The main dashboard shows:
- Total projects and tasks
- Breakdown by source (Notion vs Taskade)
- Breakdown by status (Todo, In Progress, Done)
- Quick access to all views

### Projects Kanban View

- Filter by source (All, Notion, Taskade)
- Three columns: To Do, In Progress, Done
- Source badges on each card
- Updates sync back to original source

### System Map Canvas

Interactive visualization showing:
- Integration nodes (Notion, Taskade, Slack, Google Calendar)
- Data flow connections
- Sync methods (polling vs webhooks)
- Local cache architecture

### Calendar View

- Aggregates events from both sources
- Color-coded by source
- Monthly/weekly views
- (Full implementation coming soon)

## Database Schema

The local SQLite database uses Prisma ORM with these main models:

- **Project** - Projects from both sources
- **Task** - Tasks from both sources
- **CalendarEvent** - Calendar events
- **CanvasNode** - System map nodes
- **CanvasEdge** - System map connections
- **SyncLog** - Sync history and errors

All items include:
- `source` - NOTION or TASKADE
- `externalId` - ID from source system
- `lastSyncAt` - Last sync timestamp

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Note: Update `NEXT_PUBLIC_APP_URL` to your Vercel URL and configure Taskade webhook to point to your production domain.

## Troubleshooting

### Sync not working

1. Check API keys in `.env.local`
2. Verify database connections in Notion/Taskade
3. Check logs: `npm run dev` shows sync errors
4. Try manual sync: `POST /api/notion/sync` or `POST /api/taskade/sync`

### Webhook not receiving events

1. Verify `NEXT_PUBLIC_APP_URL` is publicly accessible
2. Check Taskade webhook configuration
3. Verify webhook secret matches
4. Check API logs for incoming webhook calls

### Database errors

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Roadmap

- [ ] Drag-and-drop for Kanban board
- [ ] Full calendar implementation
- [ ] Google Calendar integration
- [ ] Slack integration
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] Export/import functionality
- [ ] Advanced filtering and search
- [ ] Dashboard customization
- [ ] Analytics and insights

---

Built for efficient project management across multiple platforms
