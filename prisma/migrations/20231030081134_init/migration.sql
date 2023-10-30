-- CreateTable
CREATE TABLE "LoggedTime" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minutes" DECIMAL(10,2) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LoggedTime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LoggedTime" ADD CONSTRAINT "LoggedTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
