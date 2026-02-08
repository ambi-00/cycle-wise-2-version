#!/bin/bash
# Stripe Environment Variables Setup für Vercel
# Kopiere diese Befehle in Terminal (einen nach dem anderen!)

# 1. API Keys (vom Stripe Dashboard → Developers → API keys)
npx vercel env add STRIPE_SECRET_KEY
# Paste: sk_test_... (Secret Key aus Stripe Dashboard)

npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Paste: pk_test_... (Publishable Key aus Stripe Dashboard)

# 2. Price IDs (vom Stripe Dashboard → Products)
npx vercel env add STRIPE_PRICE_ID_PREMIUM
# Paste: price_... (Price ID von Premium Product €9.99)

npx vercel env add STRIPE_PRICE_ID_PRO
# Paste: price_... (Price ID von Pro Product €19.99)

# 3. Webhook Secret (vom Stripe Dashboard → Developers → Webhooks)
npx vercel env add STRIPE_WEBHOOK_SECRET
# Paste: whsec_... (Signing Secret vom Webhook Endpoint)

# 4. Nach allen Eingaben → Redeploy zu Production
npx vercel --prod

# FERTIG! ✅
