-- AlterTable
ALTER TABLE "Participant" ADD COLUMN "partner" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicCode" TEXT NOT NULL,
    "editCodeHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATETIME,
    "setsToWin" INTEGER NOT NULL DEFAULT 2,
    "kind" TEXT NOT NULL DEFAULT 'singles',
    "status" TEXT NOT NULL DEFAULT 'setup',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("createdAt", "editCodeHash", "id", "location", "name", "publicCode", "setsToWin", "startDate", "status", "updatedAt") SELECT "createdAt", "editCodeHash", "id", "location", "name", "publicCode", "setsToWin", "startDate", "status", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_publicCode_key" ON "Tournament"("publicCode");
CREATE UNIQUE INDEX "Tournament_editCodeHash_key" ON "Tournament"("editCodeHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
