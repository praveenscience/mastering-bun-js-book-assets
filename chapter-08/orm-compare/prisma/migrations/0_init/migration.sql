-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ts" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ms" INTEGER NOT NULL
);

