-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueDate" DATETIME,
    "tags" TEXT,
    "assignees" TEXT,
    "priority" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CanvasNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "positionX" REAL NOT NULL,
    "positionY" REAL NOT NULL,
    "icon" TEXT,
    "status" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CanvasEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CanvasEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CanvasNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanvasEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "CanvasNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Project_source_idx" ON "Project"("source");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_source_externalId_key" ON "Project"("source", "externalId");

-- CreateIndex
CREATE INDEX "Task_source_idx" ON "Task"("source");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_source_externalId_key" ON "Task"("source", "externalId");

-- CreateIndex
CREATE INDEX "CalendarEvent_source_idx" ON "CalendarEvent"("source");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_idx" ON "CalendarEvent"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_source_externalId_key" ON "CalendarEvent"("source", "externalId");

-- CreateIndex
CREATE INDEX "CanvasEdge_sourceId_idx" ON "CanvasEdge"("sourceId");

-- CreateIndex
CREATE INDEX "CanvasEdge_targetId_idx" ON "CanvasEdge"("targetId");

-- CreateIndex
CREATE INDEX "SyncLog_source_idx" ON "SyncLog"("source");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");
