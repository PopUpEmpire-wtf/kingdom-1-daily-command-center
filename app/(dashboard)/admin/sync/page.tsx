'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const handleSyncAll = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/unified/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableAutoMerge: true,
        }),
      });

      const data = await response.json();
      setResult(data);
      await fetchStats();
    } catch (error) {
      console.error('Sync failed:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setSyncing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/unified/sync-stats');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleScanFilesystem = async () => {
    setSyncing(true);

    try {
      const response = await fetch('/api/unified/filesystem-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootPaths: [process.cwd()],
          saveToDb: true,
        }),
      });

      const data = await response.json();
      alert(`Found ${data.data?.found || 0} tasks, saved ${data.data?.saved || 0}`);
      await fetchStats();
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task Sync Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage synchronization across all task sources
        </p>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Actions</CardTitle>
          <CardDescription>Trigger synchronization across all sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleSyncAll} disabled={syncing} size="lg">
              {syncing ? 'Syncing...' : '🔄 Sync All Sources'}
            </Button>
            <Button onClick={handleScanFilesystem} disabled={syncing} variant="outline">
              📁 Scan Filesystem
            </Button>
            <Button onClick={fetchStats} variant="outline">
              📊 Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Notion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.counts.notion}</div>
              <p className="text-sm text-muted-foreground">
                Last sync: {stats.lastSyncs.NOTION?.timestamp
                  ? new Date(stats.lastSyncs.NOTION.timestamp).toLocaleString()
                  : 'Never'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taskade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.counts.taskade}</div>
              <p className="text-sm text-muted-foreground">
                Last sync: {stats.lastSyncs.TASKADE?.timestamp
                  ? new Date(stats.lastSyncs.TASKADE.timestamp).toLocaleString()
                  : 'Never'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.counts.filesystem}</div>
              <p className="text-sm text-muted-foreground">
                Last scan: {stats.lastSyncs.FILESYSTEM?.timestamp
                  ? new Date(stats.lastSyncs.FILESYSTEM.timestamp).toLocaleString()
                  : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✅ Success' : '❌ Failed'}
                </span>
                {result.data && (
                  <span className="text-sm text-muted-foreground">
                    {result.data.totalSynced} items synced
                  </span>
                )}
              </div>

              {result.data?.results && (
                <div className="space-y-2">
                  {result.data.results.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{r.source}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.itemsSynced} synced in {r.duration}ms
                        </div>
                      </div>
                      <div className={r.success ? 'text-green-600' : 'text-red-600'}>
                        {r.success ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.data?.mergeResults && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h3 className="font-semibold mb-2">Merge Results</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Groups</div>
                      <div className="text-xl font-bold">{result.data.mergeResults.totalGroups}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Unified Tasks</div>
                      <div className="text-xl font-bold">{result.data.mergeResults.totalUnified}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Duplicates Found</div>
                      <div className="text-xl font-bold">{result.data.mergeResults.duplicatesFound}</div>
                    </div>
                  </div>
                </div>
              )}

              {result.error && (
                <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 rounded-lg">
                  {result.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Source Configuration</CardTitle>
          <CardDescription>Environment variables required for each source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>✅ Notion:</strong> NOTION_API_KEY, NOTION_DATABASE_ID_TASKS
            </div>
            <div>
              <strong>✅ Taskade:</strong> TASKADE_API_TOKEN, TASKADE_WORKSPACE_ID
            </div>
            <div>
              <strong>📁 File System:</strong> Scans current directory by default
            </div>
            <div>
              <strong>📱 iOS Reminders:</strong> ICLOUD_USERNAME, ICLOUD_APP_PASSWORD
              <span className="text-yellow-600 ml-2">(CalDAV integration)</span>
            </div>
            <div>
              <strong>📝 iOS Notes:</strong> IOS_NOTES_PATH
              <span className="text-blue-600 ml-2">(File-based export)</span>
            </div>
            <div>
              <strong>🔄 TaskFlow:</strong> TASKFLOW_API_URL, TASKFLOW_API_KEY
              <span className="text-purple-600 ml-2">(API integration)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
