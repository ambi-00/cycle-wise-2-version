-- Add execution quality, checklist, and image fields to trades table
-- These fields are used for trade review, quality tracking, and chart screenshots

-- Add checklist field (JSONB array of checklist items)
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';

-- Add execution quality review fields (from TradeReviewModal)
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS followed_entry_criteria BOOLEAN,
ADD COLUMN IF NOT EXISTS followed_exit_criteria BOOLEAN,
ADD COLUMN IF NOT EXISTS risk_appropriate BOOLEAN,
ADD COLUMN IF NOT EXISTS emotionally_neutral BOOLEAN,
ADD COLUMN IF NOT EXISTS execution_score INTEGER,
ADD COLUMN IF NOT EXISTS execution_notes TEXT,
ADD COLUMN IF NOT EXISTS exit_criteria_used TEXT;

-- Rename existing image columns to match the code (add _tf suffix for "timeframe")
-- The old column names were image_before_small, image_before_large, etc.
-- The code uses image_before_small_tf, image_before_large_tf, etc.
ALTER TABLE trades
RENAME COLUMN image_before_small TO image_before_small_tf;
ALTER TABLE trades
RENAME COLUMN image_before_large TO image_before_large_tf;
ALTER TABLE trades
RENAME COLUMN image_after_small TO image_after_small_tf;
ALTER TABLE trades
RENAME COLUMN image_after_large TO image_after_large_tf;

-- Add comments for documentation
COMMENT ON COLUMN trades.checklist IS 'Pre-trade checklist items as JSONB array [{"text": "...", "done": true/false}]';
COMMENT ON COLUMN trades.followed_entry_criteria IS 'Did trader follow entry criteria from strategy?';
COMMENT ON COLUMN trades.followed_exit_criteria IS 'Did trader follow exit criteria from strategy?';
COMMENT ON COLUMN trades.risk_appropriate IS 'Was risk sizing appropriate for conditions?';
COMMENT ON COLUMN trades.emotionally_neutral IS 'Was trader emotionally neutral during trade?';
COMMENT ON COLUMN trades.execution_score IS 'Overall execution quality score (0-100)';
COMMENT ON COLUMN trades.execution_notes IS 'Notes about trade execution quality';
COMMENT ON COLUMN trades.exit_criteria_used IS 'Which exit criteria was actually used';
COMMENT ON COLUMN trades.image_before_small_tf IS 'Chart screenshot before trade entry (small timeframe)';
COMMENT ON COLUMN trades.image_before_large_tf IS 'Chart screenshot before trade entry (large timeframe)';
COMMENT ON COLUMN trades.image_after_small_tf IS 'Chart screenshot after trade exit (small timeframe)';
COMMENT ON COLUMN trades.image_after_large_tf IS 'Chart screenshot after trade exit (large timeframe)';
