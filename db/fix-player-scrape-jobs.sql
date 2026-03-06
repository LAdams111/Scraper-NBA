-- Run this on Railway Postgres if you get "column url does not exist".
-- Option A: Table doesn't exist yet – create it:
CREATE TABLE IF NOT EXISTS player_scrape_jobs (
  id SERIAL PRIMARY KEY,
  url VARCHAR(500) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_player_scrape_jobs_status ON player_scrape_jobs(status);

-- Option B: Table exists but is missing 'url' – add it (run these one at a time):
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS url VARCHAR(500);
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS error_message TEXT;
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
-- ALTER TABLE player_scrape_jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
