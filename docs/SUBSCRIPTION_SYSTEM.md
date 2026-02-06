# 🚀 Subscription System Implementation Guide

This document explains how the subscription-based feature gating system works in CycleWise Trades.

## Overview

The app now has **3 subscription tiers**:
- **FREE** (€0) - Basic features, 50 trades/month
- **PREMIUM** (€9.99/mo) - 100 trades/month, advanced features, cycle tracking
- **PRO** (€19.99/mo) - Unlimited trades + PropFirm integration, AI insights (daily), Safety Mode

## Architecture

### 1. Database Schema
**Table:** `public.subscriptions`
- Location: `supabase/migrations/20250204_create_subscriptions.sql`
- Stores user subscription tier, status, and Stripe metadata
- RLS enabled: users can only read their own subscription

### 2. Subscription Hook
**File:** `src/hooks/use-subscription.ts`
**Functions:**
- `hasFeature(feature)` - Check if user has access to a feature
- `getTradeLimit()` - Returns 50 for FREE, 100 for Premium, Infinity for Pro
- `getScreenshotLimit()` - Returns 2/4/Infinity based on tier
- `canUpgradeTo(tier)` - Check if user can upgrade to target tier

**Feature List:**
```typescript
// FREE features
basic_tracking, day_view, dashboard, challenges, 
propfirm_compare, basic_statistics

// PREMIUM features  
cycle_tracking, cloud_sync,
advanced_filters, unlimited_strategies, smart_predictions,
custom_reasons, export_reports, full_statistics

// PRO features
propfirm_integration, ai_insights_daily, safety_mode,
unlimited_screenshots, advanced_risk_analytics, early_access
```

### 3. Feature Guard Component
**File:** `src/components/FeatureGuard.tsx`
Wrapper component that shows paywall UI when user lacks required feature.

**Usage:**
```tsx
<FeatureGuard feature="cycle_tracking">
  <CycleTrackerContent />
</FeatureGuard>
```

## Implementation Details

### Locked Pages (Full Paywall)
1. **Cycle Tracker** (`src/pages/CycleTracker.tsx`)
   - Requires: `cycle_tracking` (Premium)
   - Wrapped in `<FeatureGuard>`

2. **AI Insights** (`src/pages/AIInsights.tsx`)
   - Requires: `ai_insights_weekly` (Premium)
   - Wrapped in `<FeatureGuard>` (both empty state and full page)

3. **PropFirm Accounts** (`src/pages/PropFirmAccounts.tsx`)
   - Requires: `propfirm_integration` (Pro)
   - Wrapped in `<FeatureGuard requiredTier="pro">`

### Restricted Features

#### New Trade (`src/pages/NewTrade.tsx`)
- **Trade Limit:** 50/month for FREE users
  - Checked before saving new trade
  - Shows alert with upgrade prompt when limit reached
- **Strategy Dropdown:** Disabled for FREE
  - Shows "Premium" badge
  - Displays upgrade message below
- **Screenshot Uploads:** 
  - FREE: 2 (before-small + after-small only)
  - Premium: 4 (all screenshots)
  - Pro: Unlimited
  - Large TF screenshots hidden with `{getScreenshotLimit() > 2 && (...)}`

#### Trade Journal (`src/pages/TradeJournal.tsx`)
- **Advanced Filters:** Hidden for FREE users
  - Cycle Phase filter - Premium only
  - R-Multiple range - Premium only
  - Shows upgrade prompt in filter panel

#### Statistics (`src/pages/Statistics.tsx`)
- **Strategy Performance by Cycle Phase:** Locked for FREE
  - Blurred with overlay showing upgrade card
  - Uses `{!hasFeature('full_statistics') && (...)}` pattern

#### Strategies (`src/pages/Strategies.tsx`)
- **Entire Page:** Blurred for FREE users
  - Shows centered upgrade card overlay
  - Demo data visible but not interactive
  - New strategy button disabled

## How to Deploy

### 1. Run Database Migration
```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Run SQL manually in Supabase Dashboard
# Go to SQL Editor > New Query
# Paste contents of supabase/migrations/20250204_create_subscriptions.sql
# Execute
```

### 2. Set Up Stripe (or Paddle)
1. Create Stripe account
2. Add products:
   - Premium: €9.99/month (recurring)
   - Pro: €19.99/month (recurring)
3. Get API keys (test mode first)
4. Set environment variables:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_... (backend only)
   ```

### 3. Create Checkout Flow
**TODO:** Implement checkout page or modal
- Use Stripe Checkout or Paddle Checkout
- On successful payment, create subscription record in database
- Handle webhooks to update subscription status

### 4. Add Webhook Handler
**TODO:** Create webhook endpoint to handle:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Update `subscriptions` table based on webhook events.

## Testing the Feature Gates

### Test as FREE User
1. Register new account (or clear subscription data)
2. Try to:
   - Create 51st trade → Should show limit alert ✅
   - Access Cycle Tracker → Should show paywall ✅
   - Access AI Insights → Should show paywall ✅
   - Use strategy dropdown → Should be disabled ✅
   - Upload large TF screenshot → Should be hidden ✅
   - Use Cycle Phase filter → Should be hidden ✅
   - View Strategy by Cycle in Statistics → Should be blurred ✅
   - Access Strategies page → Should show demo with overlay ✅
   - Access PropFirm Integration → Should show Pro paywall ✅

### Test as PREMIUM User
Manually set subscription in Supabase:
```sql
INSERT INTO subscriptions (user_id, tier, status)
VALUES ('YOUR_USER_ID', 'premium', 'active')
ON CONFLICT (user_id) 
DO UPDATE SET tier = 'premium', status = 'active';
```

Then verify:
- Unlimited trades ✅
- Cycle Tracker accessible ✅
- AI Insights accessible ✅
- All filters available ✅
- Strategies unlocked ✅
- 4 screenshots allowed ✅
- PropFirm Integration still locked (Pro only) ✅

### Test as PRO User
```sql
UPDATE subscriptions 
SET tier = 'pro' 
WHERE user_id = 'YOUR_USER_ID';
```

Verify everything unlocked including PropFirm Integration ✅

## Next Steps

1. **Payment Integration** (2-3 hours)
   - Implement Stripe/Paddle checkout
   - Create checkout page/modal
   - Add webhook handler
   - Test payment flow

2. **Subscription Management** (1 hour)
   - Create settings page to manage subscription
   - Show current plan details
   - Allow upgrade/downgrade
   - Handle cancellation

3. **Testing** (1 hour)
   - End-to-end test all feature gates
   - Test payment flow
   - Test subscription updates
   - Test edge cases

4. **Go Live**
   - Switch to production Stripe keys
   - Update pricing page links to real checkout
   - Monitor for issues
   - Celebrate launch! 🎉

## Troubleshooting

**"Feature still locked after upgrading"**
- Refresh the page to reload subscription data
- Check browser console for errors
- Verify subscription record in Supabase

**"useSubscription hook not working"**
- Check if user is authenticated
- Verify subscriptions table exists
- Check RLS policies allow reading

**"Trade limit not working"**
- Check localStorage for test data
- Clear browser cache
- Verify month calculation logic

## Support

For questions or issues, check:
- `.github/copilot-instructions.md` for project context
- This README for implementation details
- Supabase dashboard for database issues
