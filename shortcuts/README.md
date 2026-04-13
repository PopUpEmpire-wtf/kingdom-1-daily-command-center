# iOS Shortcuts Configuration Files

This directory contains JSON configuration templates for Kingdom-1 iOS Shortcuts.

## Files

- **daily-command.json** - Morning/daily task overview
- **knowledge-synthesis.json** - Weekly insights and patterns
- **energy-check.json** - Hourly system health monitoring
- **crisis-mode.json** - Emergency triage and prioritization

## How to Use

These JSON files are **reference templates** showing the structure and configuration for each shortcut. iOS Shortcuts app doesn't directly import JSON, so you'll need to:

### Option 1: Manual Setup (Recommended)

Follow the step-by-step instructions in `/docs/IOS_SHORTCUTS_SETUP.md` to create each shortcut manually in the iOS Shortcuts app. The JSON files serve as a reference for:

- Action sequences
- API endpoints
- Request/response handling
- Notification formatting
- Conditional logic

### Option 2: Quick Reference

Use these JSON files to quickly understand:
- What each shortcut does
- API endpoints and parameters
- Expected response format
- Suggested automations
- Configuration options

## Configuration Steps

1. **Review** the JSON file for the shortcut you want to create
2. **Open** iOS Shortcuts app
3. **Create** new shortcut
4. **Add actions** following the sequence in `actions` array
5. **Configure** settings from `configuration` object
6. **Replace** `YOUR_DOMAIN_HERE` with your deployment URL
7. **Test** the shortcut
8. **Add** to home screen and/or widget

## Common Customizations

### Update Your Domain

In each shortcut, replace:
```
https://YOUR_DOMAIN_HERE/api/shortcuts/...
```

With your actual deployment URL:
```
https://your-app.vercel.app/api/shortcuts/...
```

### Add Authentication

If your API requires authentication, add header to `getContentsOfURL` action:
```json
{
  "headers": {
    "Authorization": "Bearer YOUR_API_TOKEN"
  }
}
```

### Customize Notifications

Modify the `showNotification` action to display different information:
```json
{
  "type": "showNotification",
  "title": "Your Custom Title",
  "body": "Your custom message with {variables}"
}
```

### Adjust Timeframes

For Knowledge Synthesis, change timeframe:
```json
{
  "timeframe": "month"  // Options: "day", "week", "month"
}
```

## Automation Suggestions

Each JSON file includes `automations.suggested` array with recommended triggers:

### Daily Command
- **Morning:** 8:00 AM daily
- **After lunch:** 1:00 PM daily

### Energy Check
- **Hourly:** Every hour from 9 AM - 6 PM
- **Morning:** 9:00 AM daily

### Crisis Mode
- **End of day:** 5:00 PM daily
- **Before bed:** 10:00 PM daily

### Knowledge Synthesis
- **Weekly:** Monday 9:00 AM
- **Monthly:** First day of month, 9:00 AM

## Testing

Before adding to home screen:

1. Run shortcut in Shortcuts app
2. Verify API connection
3. Check response format
4. Test notifications/alerts
5. Confirm data accuracy

## Troubleshooting

### Shortcut fails to run
- Verify API URL is correct and accessible
- Check internet connection
- Ensure API endpoints are deployed

### No data returned
- Check API logs for errors
- Verify database has data
- Test endpoint directly with Postman/curl

### Notifications not showing
- Check notification permissions
- Verify shortcut has "Show Notification" action
- Test with "Show Alert" instead for debugging

## Advanced Features

### Variables

Extract specific data points:
```json
{
  "type": "getVariable",
  "path": "data.summary.totalTasks",
  "variable": "taskCount"
}
```

### Conditionals

Show different messages based on data:
```json
{
  "type": "conditional",
  "condition": "healthScore > 80",
  "ifTrue": [...],
  "ifFalse": [...]
}
```

### Loops

Iterate over arrays:
```json
{
  "type": "repeatWithEach",
  "items": "{tasks}",
  "actions": [...]
}
```

## Resources

- **Main Setup Guide:** `/docs/IOS_SHORTCUTS_SETUP.md`
- **API Documentation:** See setup guide for full API reference
- **Apple Shortcuts User Guide:** https://support.apple.com/guide/shortcuts/welcome

## Support

For issues or questions:
- Review `/docs/IOS_SHORTCUTS_SETUP.md` troubleshooting section
- Check API endpoints are accessible
- Test with Postman or curl first
- Verify JSON response structure matches expected format

---

**Note:** These are template/reference files. iOS Shortcuts uses a proprietary plist format. Use these JSON files as a guide for manual setup in the Shortcuts app.
