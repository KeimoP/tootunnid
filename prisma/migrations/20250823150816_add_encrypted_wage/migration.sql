-- AlterTable
ALTER TABLE "users" ADD COLUMN "encryptedWage" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_time_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clockIn" DATETIME NOT NULL,
    "clockOut" DATETIME,
    "duration" INTEGER,
    "earnings" REAL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "time_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_time_entries" ("clockIn", "clockOut", "createdAt", "duration", "earnings", "id", "updatedAt", "userId") SELECT "clockIn", "clockOut", "createdAt", "duration", "earnings", "id", "updatedAt", "userId" FROM "time_entries";
DROP TABLE "time_entries";
ALTER TABLE "new_time_entries" RENAME TO "time_entries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
