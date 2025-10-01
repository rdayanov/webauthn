-- CreateTable
CREATE TABLE "passkeys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicKey" BLOB NOT NULL,
    "userId" INTEGER NOT NULL,
    "webauthnUserID" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    CONSTRAINT "passkeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "passkeys_id_webauthnUserID_idx" ON "passkeys"("id", "webauthnUserID");

-- CreateIndex
CREATE UNIQUE INDEX "passkeys_webauthnUserID_userId_key" ON "passkeys"("webauthnUserID", "userId");
