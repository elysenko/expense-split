-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseShare" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Household_joinCode_key" ON "Household"("joinCode");

-- CreateIndex
CREATE INDEX "Membership_householdId_idx" ON "Membership"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_householdId_key" ON "Membership"("userId", "householdId");

-- CreateIndex
CREATE INDEX "Expense_householdId_idx" ON "Expense"("householdId");

-- CreateIndex
CREATE INDEX "Expense_payerId_idx" ON "Expense"("payerId");

-- CreateIndex
CREATE INDEX "ExpenseShare_userId_idx" ON "ExpenseShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseShare_expenseId_userId_key" ON "ExpenseShare"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "Settlement_householdId_idx" ON "Settlement"("householdId");

-- CreateIndex
CREATE INDEX "Settlement_fromUserId_idx" ON "Settlement"("fromUserId");

-- CreateIndex
CREATE INDEX "Settlement_toUserId_idx" ON "Settlement"("toUserId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
