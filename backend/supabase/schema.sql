-- Run this in Supabase SQL Editor
-- It creates the tables expected by the Golf Platform backend.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'subscriber',
  "subscriptionStatus" text,
  "subscriptionPlan" text,
  "subscriptionRenewal" timestamptz,
  "charityId" uuid,
  "charityContribution" numeric,
  "totalWon" numeric default 0,
  "avatarInitials" text,
  "createdAt" timestamptz default now()
);

create table if not exists charities (
  id uuid primary key,
  name text not null,
  description text not null,
  category text,
  image text,
  featured boolean default false,
  "upcomingEvents" jsonb default '[]'::jsonb,
  "totalReceived" numeric default 0,
  active boolean default true,
  "createdAt" timestamptz default now()
);

create table if not exists scores (
  id uuid primary key,
  "userId" uuid not null references users(id) on delete cascade,
  value integer not null,
  date timestamptz not null,
  "createdAt" timestamptz default now()
);

create table if not exists winners (
  id uuid primary key,
  "userId" uuid not null references users(id) on delete cascade,
  "matchType" text not null,
  amount numeric not null default 0,
  status text not null default 'pending',
  "proofUrl" text,
  "reviewedAt" timestamptz,
  "createdAt" timestamptz default now()
);

create table if not exists draw_results (
  id uuid primary key,
  month text not null,
  "drawnNumbers" jsonb not null,
  "drawType" text not null,
  "totalPool" numeric not null default 0,
  "jackpotPool" numeric not null default 0,
  "fourMatchPool" numeric not null default 0,
  "threeMatchPool" numeric not null default 0,
  "activeSubscribers" integer not null default 0,
  "jackpotWinners" jsonb not null default '[]'::jsonb,
  "fourMatchWinners" jsonb not null default '[]'::jsonb,
  "threeMatchWinners" jsonb not null default '[]'::jsonb,
  "jackpotRolledOver" boolean default false,
  published boolean default true,
  "publishedAt" timestamptz,
  "createdAt" timestamptz default now()
);

create table if not exists donations (
  id uuid primary key,
  "charityId" uuid not null references charities(id) on delete cascade,
  amount numeric not null,
  "donorName" text,
  "donorEmail" text,
  note text,
  "createdAt" timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key,
  "userId" uuid not null references users(id) on delete cascade,
  plan text not null,
  amount numeric not null,
  currency text not null default 'INR',
  provider text not null default 'razorpay',
  status text not null default 'pending',
  "razorpayOrderId" text,
  "razorpayPaymentId" text,
  "paymentSignature" text,
  notes jsonb default '{}'::jsonb,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists draw_entries (
  id uuid primary key,
  "drawResultId" uuid references draw_results(id) on delete cascade,
  "userId" uuid not null references users(id) on delete cascade,
  month text not null,
  entered boolean not null default false,
  matches integer not null default 0,
  "scoreSnapshot" jsonb not null default '[]'::jsonb,
  "drawnNumbers" jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz default now()
);

create index if not exists idx_scores_user_id on scores("userId");
create index if not exists idx_winners_user_id on winners("userId");
create index if not exists idx_users_email on users(email);
create index if not exists idx_donations_charity_id on donations("charityId");
create index if not exists idx_subscriptions_user_id on subscriptions("userId");
create index if not exists idx_subscriptions_order_id on subscriptions("razorpayOrderId");
create index if not exists idx_draw_entries_user_id on draw_entries("userId");
create index if not exists idx_draw_entries_draw_result_id on draw_entries("drawResultId");
