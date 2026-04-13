# iOS Shortcuts Widget Setup Guide

Configure one-tap access to cross-domain actions from your iOS home screen or widget.

## Available Shortcuts

### 1. 📋 Daily Command
Quick access to today's tasks, events, and action items.

**What it does:**
- Fetches today's tasks (sorted by priority)
- Shows upcoming events
- Lists active projects
- Provides daily summary statistics

**API Endpoint:** `POST /api/shortcuts/daily-command`

### 2. 🧠 Knowledge Synthesis
Aggregate insights and patterns across all projects.

**What it does:**
- Analyzes activity over the past week (configurable)
- Identifies completion patterns
- Suggests related projects
- Provides strategic insights

**API Endpoint:** `POST /api/shortcuts/knowledge-synthesis`

### 3. ⚡ Energy Check
Quick system health check across all integrations.

**What it does:**
- Checks sync status (Notion & Taskade)
- Calculates overall health score
- Reports workload metrics
- Provides recommendations

**API Endpoint:** `POST /api/shortcuts/energy-check`

### 4. 🚨 Crisis Mode
Emergency triage for urgent items.

**What it does:**
- Identifies overdue high-priority tasks
- Lists blocked tasks
- Reports sync failures
- Generates action plan

**API Endpoint:** `POST /api/shortcuts/crisis-mode`

---

## Setup Instructions

### Prerequisites

1. Your Kingdom-1 Command Center deployed and accessible via URL
2. iOS device with Shortcuts app (pre-installed on iOS 13+)
3. (Optional) Authentication token if you've enabled API security

### Step 1: Get Your API Base URL

Your API base URL depends on your deployment:

- **Local development:** `http://localhost:3000`
- **Vercel:** `https://your-app.vercel.app`
- **Custom domain:** `https://your-domain.com`

### Step 2: Create Shortcuts

#### Option A: Import Pre-configured Shortcuts (Recommended)

1. Open the files in `/shortcuts/` folder
2. Tap each `.shortcut` file
3. Review permissions and tap "Add Shortcut"
4. Edit the shortcut and update the URL to your deployment

#### Option B: Manual Setup

Follow these steps for each shortcut:

#### Daily Command Shortcut

1. Open **Shortcuts** app
2. Tap **+** to create new shortcut
3. Add actions:
   - **URL:** `https://your-domain.com/api/shortcuts/daily-command`
   - **Get Contents of URL:**
     - Method: `POST`
     - Request Body: `JSON`
     - Add field: `date` = `Current Date` (formatted as ISO 8601)
   - **Get Dictionary from Input**
   - **Show Result** (or customize output)
4. Tap settings (•••) and set:
   - Name: "Daily Command"
   - Icon: Choose 📋 or any preferred icon
   - Color: Blue
   - Add to Home Screen: ✓
   - Show in Widget: ✓

#### Knowledge Synthesis Shortcut

1. Create new shortcut
2. Add actions:
   - **URL:** `https://your-domain.com/api/shortcuts/knowledge-synthesis`
   - **Get Contents of URL:**
     - Method: `POST`
     - Request Body: `JSON`
     - Add field: `timeframe` = `week` (or `day`, `month`)
   - **Get Dictionary from Input**
   - **Show Result**
3. Configure:
   - Name: "Knowledge Synthesis"
   - Icon: 🧠
   - Color: Purple
   - Add to Home Screen: ✓
   - Show in Widget: ✓

#### Energy Check Shortcut

1. Create new shortcut
2. Add actions:
   - **URL:** `https://your-domain.com/api/shortcuts/energy-check`
   - **Get Contents of URL:**
     - Method: `GET`
   - **Get Dictionary from Input**
   - **Get Value for `data.energyLevel`**
   - **Show Notification:**
     - Title: "Energy Check"
     - Body: Combine: "Energy: " + `energyLevel` + " | Health: " + `data.healthScore`
4. Configure:
   - Name: "Energy Check"
   - Icon: ⚡
   - Color: Yellow
   - Add to Home Screen: ✓
   - Show in Widget: ✓

#### Crisis Mode Shortcut

1. Create new shortcut
2. Add actions:
   - **URL:** `https://your-domain.com/api/shortcuts/crisis-mode`
   - **Get Contents of URL:**
     - Method: `GET`
   - **Get Dictionary from Input**
   - **Get Value for `data.crisisLevel`**
   - **If** `crisisLevel` equals `critical` or `high`:
     - **Show Alert:**
       - Title: "🚨 CRISIS MODE"
       - Message: `data.primaryAction`
   - **Otherwise:**
     - **Show Notification:**
       - Title: "Crisis Check"
       - Body: `data.primaryAction`
4. Configure:
   - Name: "Crisis Mode"
   - Icon: 🚨
   - Color: Red
   - Add to Home Screen: ✓
   - Show in Widget: ✓

### Step 3: Add to Widget

1. Long press home screen
2. Tap **+** in top-left corner
3. Search for **Shortcuts**
4. Choose widget size (Small shows 2, Medium shows 4, Large shows 8)
5. Tap **Add Widget**
6. Long press widget and select **Edit Widget**
7. Choose your shortcuts to display

### Step 4: (Optional) Set Up Automations

Create time-based automations for automatic checks:

#### Morning Daily Command
1. Go to **Automation** tab in Shortcuts
2. Create **Personal Automation**
3. Choose **Time of Day** → 8:00 AM
4. Add action: **Run Shortcut** → Daily Command
5. Disable "Ask Before Running"

#### Hourly Energy Check
1. Create automation with **Time of Day** → Hourly (9 AM - 6 PM)
2. Run shortcut: Energy Check
3. Only shows notification if issues detected

#### End-of-Day Crisis Check
1. Time: 5:00 PM
2. Run shortcut: Crisis Mode
3. Alerts only if crisis level is high/critical

---

## Advanced Configuration

### Adding Authentication

If your API requires authentication:

1. Edit each shortcut
2. In **Get Contents of URL** action
3. Add Header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_API_TOKEN`

### Custom Response Formatting

Enhance output with rich notifications:

```
Get Contents of URL → [API]
Get Dictionary from Input
Get Value for "data.summary.totalTasks" from Dictionary
Get Value for "data.summary.highPriorityTasks" from Dictionary
Show Notification
  Title: "Daily Command"
  Body: "📋 {totalTasks} tasks | 🔴 {highPriorityTasks} high priority"
```

### Siri Integration

Each shortcut is automatically available via Siri:
- "Hey Siri, Daily Command"
- "Hey Siri, Energy Check"
- "Hey Siri, Crisis Mode"
- "Hey Siri, Knowledge Synthesis"

---

## API Reference

### Daily Command

**Endpoint:** `POST /api/shortcuts/daily-command`

**Request Body:**
```json
{
  "date": "2026-04-13",  // Optional, defaults to today
  "includeStats": true    // Optional, defaults to true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "date": "2026-04-13",
      "totalTasks": 15,
      "highPriorityTasks": 3,
      "totalEvents": 5,
      "activeProjects": 4
    },
    "tasks": [...],
    "events": [...],
    "projects": [...]
  },
  "timestamp": "2026-04-13T14:30:00.000Z"
}
```

### Knowledge Synthesis

**Endpoint:** `POST /api/shortcuts/knowledge-synthesis`

**Request Body:**
```json
{
  "timeframe": "week",      // "day", "week", or "month"
  "includeArchived": false  // Optional, defaults to false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "week",
    "patterns": {...},
    "insights": [...],
    "connections": [...],
    "topProjects": [...]
  }
}
```

### Energy Check

**Endpoint:** `GET /api/shortcuts/energy-check` or `POST`

**Request Body (optional):**
```json
{
  "detailed": false  // Include recent activity and sync logs
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "energyLevel": "high",     // "high", "medium", "low", "critical"
    "healthScore": 85,          // 0-100
    "color": "green",
    "recommendation": "...",
    "metrics": {...},
    "syncStatus": {...}
  }
}
```

### Crisis Mode

**Endpoint:** `GET /api/shortcuts/crisis-mode` or `POST`

**Request Body (optional):**
```json
{
  "includeContext": true,  // Include additional context
  "maxItems": 10          // Max critical items to return
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "crisisLevel": "low",      // "none", "low", "medium", "high", "critical"
    "color": "yellow",
    "criticalCount": 2,
    "primaryAction": "...",
    "actionPlan": [...],
    "criticalItems": {...}
  }
}
```

---

## Troubleshooting

### "Network Error" or "Could not connect"

- Verify your API base URL is correct
- Ensure your deployment is publicly accessible
- Check if your device has internet connection
- If using localhost, ensure phone is on same network

### "Invalid Response" or "Unexpected Format"

- Verify API endpoints are deployed correctly
- Check server logs for errors
- Test endpoints directly with Postman or curl

### Shortcuts not appearing in widget

- Ensure "Show in Widget" is enabled for each shortcut
- Try removing and re-adding the widget
- Restart Shortcuts app

### Authentication errors

- Verify API token is correct and not expired
- Check Authorization header format
- Ensure API security is configured correctly

---

## Tips & Best Practices

1. **Widget Organization:** Place most-used shortcuts in small/medium widget for quick access
2. **Notifications:** Use notifications for quick checks, alerts for critical items
3. **Automations:** Set up morning Daily Command and evening Crisis Mode automatically
4. **Customization:** Adjust timeframes, limits, and filters to match your workflow
5. **Testing:** Test each shortcut in the app before adding to home screen

---

## Example Workflows

### Morning Routine
1. **Daily Command** → Review tasks and events
2. **Energy Check** → Confirm systems are healthy
3. Start work with confidence

### Mid-Day Check-In
1. **Energy Check** → Monitor workload
2. **Knowledge Synthesis** → Identify patterns
3. Adjust priorities as needed

### End-of-Day Review
1. **Crisis Mode** → Check for urgent items
2. **Knowledge Synthesis** → Review progress
3. Plan next day

### Emergency Mode
1. **Crisis Mode** → Identify critical issues
2. Address action plan items
3. **Energy Check** → Confirm resolution

---

## Support

For issues or questions:
- Check API logs: `npm run dev` output
- Review Prisma database: `npx prisma studio`
- Test API directly: Use Postman or curl
- See main README.md for general troubleshooting

---

Built for Kingdom-1 Daily Command Center
