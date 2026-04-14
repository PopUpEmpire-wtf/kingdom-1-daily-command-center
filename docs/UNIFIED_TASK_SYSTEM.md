# Unified Task System

Complete task aggregation, merging, and synchronization across all your task management sources.

## Overview

The Unified Task System scans, merges, and synchronizes tasks from multiple sources:

- ✅ **Notion** - Project management databases
- ✅ **Taskade** - Real-time collaboration tasks
- 📁 **File System** - TODO comments, FIXME, HACK, markdown tasks
- 📱 **iOS Reminders** - iCloud Reminders via CalDAV
- 📝 **iOS Notes** - Extracted tasks from notes
- 🔄 **TaskFlow** - TaskFlow app integration

## Features

### 🔍 Intelligent Scanning

- **Code Comments**: Automatically finds TODO, FIXME, HACK, BUG, NOTE, XXX comments
- **Markdown Tasks**: Detects `- [ ]` and `- [x]` checkbox syntax
- **Priority Detection**: Extracts priority levels from markers like `[!]`, `(HIGH)`, `P0-P5`
- **Tag Extraction**: Identifies hashtags like `#urgent`, `#bug`, `#feature`

### 🔄 Smart Merging

- **Fuzzy Matching**: Uses Levenshtein distance to find similar tasks across sources
- **Confidence Scores**: Rates merge accuracy (0-1 scale)
- **Deduplication**: Prevents duplicate tasks from cluttering your system
- **Source Mapping**: Tracks which sources contain each task

### ⚙️ Flexible Sync

- **Multi-Source**: Sync all sources or select specific ones
- **Conflict Resolution**: Configurable strategies (latest, source-priority, manual)
- **Scheduled Sync**: Run periodic syncs via cron or automation
- **Manual Control**: Admin UI for on-demand syncing

## Setup

### 1. Environment Variables

Create or update `.env.local` with:

```env
# Existing integrations
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID_TASKS=xxxxx
TASKADE_API_TOKEN=xxxxx
TASKADE_WORKSPACE_ID=xxxxx

# iOS Reminders (via iCloud CalDAV)
ICLOUD_USERNAME=your-apple-id@icloud.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# iOS Notes (file-based export)
IOS_NOTES_PATH=/path/to/icloud/notes/folder

# TaskFlow
TASKFLOW_API_URL=https://api.taskflow.app
TASKFLOW_API_KEY=your-api-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Update Database

```bash
npx prisma db push --schema=./prisma/schema.prisma --url=file:./dev.db
npx prisma generate
```

### 4. Verify Installation

Visit `/admin/sync` in your app to access the admin panel.

## iOS Integration Setup

### iOS Reminders (iCloud CalDAV)

1. **Generate App-Specific Password**:
   - Go to https://appleid.apple.com
   - Sign in → Security → App-Specific Passwords
   - Generate new password

2. **Configure Environment**:
   ```env
   ICLOUD_USERNAME=your@email.com
   ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```

3. **Test Connection**:
   ```bash
   # Run sync and check logs
   curl -X POST http://localhost:3000/api/unified/sync-all
   ```

### iOS Notes (File Export)

**Option 1: iCloud Folder Sync (Recommended)**

1. Enable iCloud Drive
2. Notes are auto-synced to `~/Library/Mobile Documents/com~apple~CloudDocs/Notes/`
3. Set environment variable:
   ```env
   IOS_NOTES_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Notes"
   ```

**Option 2: Manual Export**

1. Export notes as `.txt` files to a folder
2. Point `IOS_NOTES_PATH` to that folder

**Option 3: Shortcuts Automation** (macOS)

Create a shortcut that exports notes as JSON:

```applescript
# See lib/ios-notes/client.ts for generated AppleScript
```

## File System Scanning

### Supported File Types

- **Code**: `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.rb`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.php`, etc.
- **Docs**: `.md`, `.txt`, `.org`, `.rst`

### Task Patterns

```javascript
// TODO: Implement authentication
// FIXME: Fix memory leak in component
// HACK: Temporary workaround for API bug
// BUG: User login fails on mobile
// NOTE: Remember to update documentation
// XXX: This needs refactoring

/* TODO: Multi-line comment
   with more details */

# Python/Shell comment
# TODO: Add error handling
```

### Markdown Tasks

```markdown
- [ ] Incomplete task
- [x] Completed task
- [ ] Task with #tag and (HIGH) priority
```

### Configuration

```json
{
  "rootPaths": ["/home/user/project"],
  "excludePaths": ["node_modules", ".git", "dist"],
  "includeExtensions": [".js", ".ts", ".md"],
  "maxDepth": 10,
  "maxFileSize": 1048576
}
```

## API Endpoints

### Sync All Sources

```http
POST /api/unified/sync-all
Content-Type: application/json

{
  "sources": ["NOTION", "TASKADE", "FILESYSTEM"],
  "enableAutoMerge": true,
  "conflictStrategy": "latest"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalSynced": 157,
    "results": [
      {
        "source": "NOTION",
        "success": true,
        "itemsSynced": 42,
        "duration": 1234
      }
    ],
    "mergeResults": {
      "totalGroups": 145,
      "totalUnified": 140,
      "duplicatesFound": 12
    }
  }
}
```

### Get Merged Tasks

```http
GET /api/unified/merged-tasks?status=TODO&minConfidence=0.8
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 89,
    "tasks": [
      {
        "canonicalId": "unified-xxx",
        "title": "Implement authentication",
        "status": "TODO",
        "priority": "HIGH",
        "sources": [
          {
            "source": "NOTION",
            "sourceId": "notion-123"
          },
          {
            "source": "FILESYSTEM",
            "sourceId": "file-456",
            "sourcePath": "/src/auth.ts:42"
          }
        ],
        "confidence": 0.92
      }
    ]
  }
}
```

### Scan File System

```http
POST /api/unified/filesystem-scan
Content-Type: application/json

{
  "rootPaths": ["/home/user/project"],
  "saveToDb": true
}
```

### Get Sync Stats

```http
GET /api/unified/sync-stats
```

## Admin UI

Access the admin panel at `/admin/sync`:

### Features

- **Sync All Sources**: One-click sync across all integrations
- **Scan Filesystem**: Trigger file system scan
- **View Stats**: See task counts and last sync times for each source
- **Sync History**: Review recent sync operations
- **Merge Results**: See deduplication statistics

### Actions

1. **🔄 Sync All Sources**: Full sync + merge
2. **📁 Scan Filesystem**: Scan for code/doc tasks
3. **📊 Refresh Stats**: Update dashboard statistics

## Task Merging

### How It Works

1. **Normalization**: Converts all tasks to common format
2. **Similarity Calculation**: Compares tasks using:
   - Title similarity (50% weight)
   - Due date similarity (30% weight)
   - Description similarity (20% weight)
3. **Grouping**: Tasks with >75% similarity are grouped
4. **Unification**: Creates canonical task with all source mappings

### Similarity Algorithm

```typescript
Levenshtein distance for string comparison
Date proximity for due date matching
Weighted average for overall score
```

### Confidence Scoring

- **1.0**: Perfect match (exact title and date)
- **0.9-0.99**: Very high confidence
- **0.75-0.89**: High confidence (merged by default)
- **<0.75**: Low confidence (kept separate)

### Source Priority

When merging conflicting data:

1. Notion (most structured)
2. Taskade (collaboration features)
3. TaskFlow (dedicated task management)
4. iOS Reminders (mobile native)
5. iOS Notes (freeform notes)
6. File System (code comments)

## Conflict Resolution

### Strategies

**1. Latest** (default)
- Use most recently updated value
- Best for active development

**2. Source Priority**
- Use value from highest-priority source
- Best for production environments

**3. Manual**
- Flag conflicts for user review
- Best for critical projects

### Example

```javascript
Task A (Notion): "Fix login bug" - Due: Apr 15
Task B (Filesystem): "Fix login bug" - Due: Apr 14

// Latest strategy → Due: Apr 15
// Source priority → Due: Apr 15 (Notion higher)
// Manual → User decides
```

## Scheduled Syncing

### Cron Job (Linux/Mac)

```bash
# Add to crontab
0 */6 * * * curl -X POST http://localhost:3000/api/unified/sync-all
```

### GitHub Actions

```yaml
name: Sync Tasks
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST https://your-app.vercel.app/api/unified/sync-all \
            -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

### Vercel Cron

```json
// vercel.json
{
  "crons": [{
    "path": "/api/unified/sync-all",
    "schedule": "0 */6 * * *"
  }]
}
```

## Troubleshooting

### File System Scan Finds No Tasks

- Check `rootPaths` points to correct directory
- Verify file extensions are included
- Check `excludePaths` isn't too restrictive
- Ensure files are readable

### iOS Reminders Not Syncing

- Verify app-specific password is correct
- Check iCloud Reminders is enabled
- Try different server number in CalDAV URL
- Check network/firewall settings

### iOS Notes Extraction Fails

- Verify `IOS_NOTES_PATH` exists and is readable
- Check notes are .txt or .md format
- Try manual export first to verify format

### TaskFlow Connection Failed

- Verify API URL and key are correct
- Check API endpoint exists
- Test with curl/Postman first
- Review TaskFlow documentation

### Duplicate Tasks After Merge

- Lower similarity threshold (default: 0.75)
- Check task titles are normalized properly
- Verify date formats are consistent
- Review merge confidence scores

## Best Practices

### 1. Regular Syncing

- Sync at least daily for active projects
- Use hourly sync for real-time needs
- Monitor sync logs for errors

### 2. Clean Task Descriptions

- Use consistent naming
- Include due dates when possible
- Add priority markers
- Use tags for categorization

### 3. Source Selection

- Enable only needed sources
- Disable unused integrations
- Monitor performance with many sources

### 4. Merge Review

- Check confidence scores
- Verify high-confidence merges
- Manually review low-confidence matches

### 5. File System Organization

- Use consistent TODO formats
- Add line numbers for context
- Group related tasks
- Clean up completed TODOs

## Advanced Usage

### Custom Scan Paths

```javascript
// Scan multiple project directories
{
  "rootPaths": [
    "/home/user/project1",
    "/home/user/project2",
    "/home/user/docs"
  ]
}
```

### Selective Source Sync

```javascript
// Sync only Notion and Filesystem
fetch('/api/unified/sync-all', {
  method: 'POST',
  body: JSON.stringify({
    sources: ['NOTION', 'FILESYSTEM']
  })
});
```

### Programmatic Access

```typescript
import { TaskMerger } from '@/lib/unified/merger';
import { SyncOrchestrator } from '@/lib/unified/orchestrator';

// Merge tasks
const merger = new TaskMerger();
const unified = await merger.mergeAllTasks();

// Sync with custom config
const orchestrator = new SyncOrchestrator({
  sources: ['NOTION', 'TASKADE'],
  enableAutoMerge: true,
});
const result = await orchestrator.syncAll();
```

## Architecture

### Database Schema

```prisma
enum DataSource {
  NOTION
  TASKADE
  FILESYSTEM
  IOS_REMINDERS
  IOS_NOTES
  TASKFLOW
}

model TaskMapping {
  canonicalId  String
  source       DataSource
  sourceId     String
  confidence   Float
  ...
}

model FileSystemTask {
  filePath    String
  lineNumber  Int
  taskType    String
  content     String
  ...
}
```

### Components

- **Scanner**: Finds tasks in files
- **Client**: Connects to external APIs
- **Merger**: Deduplicates and unifies
- **Orchestrator**: Coordinates all syncs
- **API**: Exposes endpoints
- **UI**: Admin dashboard

## Performance

- **File Scan**: ~1000 files/second
- **API Sync**: Depends on external APIs
- **Merge**: ~10000 tasks/second
- **Database**: SQLite (fast for <100K tasks)

## Limitations

- iOS CalDAV requires app-specific password
- iOS Notes has no official API (file-based workaround)
- TaskFlow integration depends on their API
- File scanning is CPU-intensive for large codebases
- Fuzzy matching can have false positives/negatives

## Roadmap

- [ ] Google Calendar integration
- [ ] Microsoft To Do integration
- [ ] Slack reminders integration
- [ ] Jira/Linear integration
- [ ] AI-powered task categorization
- [ ] Natural language task creation
- [ ] Cross-source task creation
- [ ] Mobile app

---

**Need Help?** Check the troubleshooting section or review the API documentation.
