-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE');
CREATE TYPE "Platform" AS ENUM ('amazon', 'etsy', 'ebay', 'shopify', 'gumroad');
CREATE TYPE "TrendDirection" AS ENUM ('up', 'down', 'stable');
CREATE TYPE "CompetitionLevel" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'PAYPAL', 'BANK_TRANSFER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "searchVolume" INTEGER NOT NULL,
    "trend" "TrendDirection" NOT NULL,
    "competition" "CompetitionLevel" NOT NULL,
    "potentialRevenue" DECIMAL(10,2) NOT NULL,
    "cpc" DECIMAL(10,2),
    "difficulty" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "resultsCount" INTEGER NOT NULL,
    "searchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "searchVolume" INTEGER NOT NULL,
    "trendScore" DECIMAL(5,2),
    "competitionScore" DECIMAL(5,2),
    "opportunityScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformData" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "totalKeywords" INTEGER NOT NULL DEFAULT 0,
    "avgSearchVolume" INTEGER NOT NULL DEFAULT 0,
    "avgCompetition" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgCpc" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_platform_key" ON "Keyword"("term", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformData_platform_key" ON "PlatformData"("platform");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE INDEX "Keyword_term_idx" ON "Keyword"("term");
CREATE INDEX "Keyword_platform_idx" ON "Keyword"("platform");
CREATE INDEX "Keyword_searchVolume_idx" ON "Keyword"("searchVolume");
CREATE INDEX "Keyword_competition_idx" ON "Keyword"("competition");
CREATE INDEX "Keyword_potentialRevenue_idx" ON "Keyword"("potentialRevenue");
CREATE INDEX "Keyword_lastUpdated_idx" ON "Keyword"("lastUpdated");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");
CREATE INDEX "SearchHistory_keyword_idx" ON "SearchHistory"("keyword");
CREATE INDEX "SearchHistory_platform_idx" ON "SearchHistory"("platform");
CREATE INDEX "SearchHistory_searchDate_idx" ON "SearchHistory"("searchDate");

-- CreateIndex
CREATE INDEX "Trend_keywordId_idx" ON "Trend"("keywordId");
CREATE INDEX "Trend_date_idx" ON "Trend"("date");
CREATE INDEX "Trend_searchVolume_idx" ON "Trend"("searchVolume");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trend" ADD CONSTRAINT "Trend_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
