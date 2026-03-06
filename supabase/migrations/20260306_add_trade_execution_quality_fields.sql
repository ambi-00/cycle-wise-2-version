-- Add execution quality and checklist fields to trades table
-- These fields are used for trade review and quality tracking

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

-- Add comments for documentation
COMMENT ON COLUMN trades.checklist IS 'Pre-trade checklist items as JSONB array [{"text": "...", "done": true/false}]';
COMMENT ON COLUMN trades.followed_entry_criteria IS 'Did trader follow entry criteria from strategy?';
COMMENT ON COLUMN trades.followed_exit_criteria IS 'Did trader follow exit criteria from strategy?';
COMMENT ON COLUMN trades.risk_appropriate IS 'Was risk sizing appropriate for conditions?';
COMMENT ON COLUMN trades.emotionally_neutral IS 'Was trader emotionally neutral during trade?';
COMMENT ON COLUMN trades.execution_score IS 'Overall execution quality score (0-100)';
COMMENT ON COLUMN trades.execution_notes IS 'Notes about trade execution quality';
COMMENT ON COLUMN trades.exit_criteria_used IS 'Which exit criteria was actually used';
