-- Ensure MetaTrader tables exist (idempotent)
-- This can be run multiple times safely

-- Create metatrader_accounts table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metatrader_accounts') THEN
    create table metatrader_accounts (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      account_number text not null,
      server text not null,
      platform text not null check (platform in ('mt4', 'mt5')),
      account_type text not null check (account_type in ('demo', 'challenge', 'live')) default 'demo',
      prop_firm text,
      include_in_analytics boolean default true,
      connected_at timestamp with time zone default now(),
      last_sync timestamp with time zone,
      is_active boolean default true,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now(),
      unique(user_id, account_number, server)
    );

    -- Create index for faster queries
    create index idx_metatrader_accounts_user_id on metatrader_accounts(user_id);
    create index idx_metatrader_accounts_active on metatrader_accounts(user_id, is_active);

    -- Enable RLS
    alter table metatrader_accounts enable row level security;

    -- RLS Policies: Users can only see their own accounts
    create policy "Users can view their own MT accounts" on metatrader_accounts
      for select using (auth.uid() = user_id);

    create policy "Users can insert their own MT accounts" on metatrader_accounts
      for insert with check (auth.uid() = user_id);

    create policy "Users can update their own MT accounts" on metatrader_accounts
      for update using (auth.uid() = user_id);

    create policy "Users can delete their own MT accounts" on metatrader_accounts
      for delete using (auth.uid() = user_id);
  END IF;
END $$;

-- Create mt_trades table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mt_trades') THEN
    create table mt_trades (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      account_id uuid not null references metatrader_accounts(id) on delete cascade,
      ticket bigint not null,
      symbol text not null,
      cmd text not null, -- "buy" or "sell"
      open_price numeric(15,5),
      close_price numeric(15,5),
      volume numeric(15,2),
      open_time timestamp with time zone,
      close_time timestamp with time zone,
      profit numeric(15,2),
      comment text,
      -- Enrichment Fields
      screenshot_url text,
      entry_reason text,
      rrr numeric(10,2),
      position_size numeric(15,2),
      is_enriched boolean default false,
      synced_at timestamp with time zone default now(),
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now(),
      unique(user_id, account_id, ticket)
    );

    -- Create index for faster queries
    create index idx_mt_trades_user_id on mt_trades(user_id);
    create index idx_mt_trades_account_id on mt_trades(account_id);
    create index idx_mt_trades_open_time on mt_trades(open_time);

    -- Enable RLS
    alter table mt_trades enable row level security;

    -- RLS Policies
    create policy "Users can view their own MT trades" on mt_trades
      for select using (auth.uid() = user_id);

    create policy "System can insert MT trades" on mt_trades
      for insert with check (true);

    create policy "Users can update their own MT trades" on mt_trades
      for update using (auth.uid() = user_id);
  END IF;
END $$;

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if not exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metatrader_accounts') THEN
    DROP TRIGGER IF EXISTS update_metatrader_accounts_updated_at ON metatrader_accounts;
    CREATE TRIGGER update_metatrader_accounts_updated_at 
      BEFORE UPDATE ON metatrader_accounts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mt_trades') THEN
    DROP TRIGGER IF EXISTS update_mt_trades_updated_at ON mt_trades;
    CREATE TRIGGER update_mt_trades_updated_at 
      BEFORE UPDATE ON mt_trades
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
