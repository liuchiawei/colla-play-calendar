-- CreateTable
CREATE TABLE "event_registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_registration_eventId_idx" ON "event_registration"("eventId");

-- CreateIndex
CREATE INDEX "event_registration_userId_idx" ON "event_registration"("userId");

-- CreateIndex
CREATE INDEX "event_registration_anonymousSessionId_idx" ON "event_registration"("anonymousSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_eventId_userId_key" ON "event_registration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_eventId_anonymousSessionId_key" ON "event_registration"("eventId", "anonymousSessionId");

-- AddForeignKey
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
