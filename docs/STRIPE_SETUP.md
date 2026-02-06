# 💳 Stripe Integration Setup

## Schritt-für-Schritt Anleitung

### 1. Stripe Account erstellen
1. Gehe zu [https://stripe.com](https://stripe.com) und erstelle einen Account
2. Aktiviere **Test Mode** (Schalter oben rechts)

### 2. Produkte & Preise erstellen

#### In Stripe Dashboard:
1. Gehe zu **Products** → **Add Product**
2. Erstelle zwei Produkte:

**Premium Plan:**
- Name: `CycleWise Premium`
- Description: `Monthly subscription for premium features`
- Pricing: Recurring, Monthly, €9.99
- ✅ Kopiere die `Price ID` (beginnt mit `price_...`)

**Pro Plan:**
- Name: `CycleWise Pro`
- Description: `Monthly subscription for pro features`  
- Pricing: Recurring, Monthly, €19.99
- ✅ Kopiere die `Price ID`

### 3. API Keys holen

1. Gehe zu **Developers** → **API Keys**
2. Kopiere:
   - **Publishable key** (beginnt mit `pk_test_...`)
   - **Secret key** (beginnt mit `sk_test_...`) ⚠️ Nie committen!

### 4. Environment Variables setzen

Füge in `.env.local` hinzu:

```env
# Stripe Frontend (VITE_ prefix macht es öffentlich)
VITE_STRIPE_PUBLIC_KEY=pk_test_XXX

# Stripe Backend (nur in Vercel Environment Variables)
STRIPE_SECRET_KEY=sk_test_XXX
STRIPE_WEBHOOK_SECRET=whsec_XXX  # Später hinzufügen
STRIPE_PRICE_ID_PREMIUM=price_XXX
STRIPE_PRICE_ID_PRO=price_XXX

# Supabase Service Role (für Webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJXXX  # Aus Supabase Dashboard

# Frontend URL
FRONTEND_URL=https://your-app.vercel.app
```

### 5. Vercel Deployment

#### In Vercel Dashboard:
1. Gehe zu deinem Projekt → **Settings** → **Environment Variables**
2. Füge **alle** Backend-Variablen hinzu:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID_PREMIUM`
   - `STRIPE_PRICE_ID_PRO`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL`

3. Deploy neu: `git push` (oder Redeploy in Vercel)

### 6. Webhook Setup

#### Nach dem Deployment:
1. Gehe zu Stripe **Developers** → **Webhooks**
2. Klicke **Add endpoint**
3. URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. ✅ Kopiere **Signing secret** (beginnt mit `whsec_...`)
6. Füge in Vercel Environment Variables hinzu:
   - `STRIPE_WEBHOOK_SECRET=whsec_XXX`
7. Deploy neu

### 7. Testen

#### Test-Kreditkarten (Stripe Test Mode):
- **Erfolg:** `4242 4242 4242 4242`
- **Abgelehnt:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0027 6000 3184`
- CVV: beliebige 3 Ziffern
- Ablaufdatum: beliebiges zukünftiges Datum

#### Test Flow:
1. Gehe zu `/pricing`
2. Klicke "Upgrade to Premium"
3. Wähle Zahlungsmethode
4. Klicke "Complete Purchase"
5. Verwende Test-Karte `4242 4242 4242 4242`
6. Nach Erfolg → Redirect zu `/dashboard?success=true`
7. Überprüfe in Supabase: `subscriptions` Tabelle → neuer Eintrag

### 8. Production Umstellung

Wenn alles funktioniert:

1. In Stripe: Deaktiviere **Test Mode**
2. Hole **Production Keys**:
   - `pk_live_...` (Publishable)
   - `sk_live_...` (Secret)
3. Erstelle Production Produkte & Preise
4. Update Vercel Environment Variables
5. Update Webhook URL mit Production Secret

## Troubleshooting

### "Failed to create checkout session"
- ✅ Prüfe: `STRIPE_SECRET_KEY` ist in Vercel gesetzt
- ✅ Prüfe: `STRIPE_PRICE_ID_PREMIUM` und `STRIPE_PRICE_ID_PRO` sind korrekt

### Webhook nicht empfangen
- ✅ Prüfe: Webhook URL ist korrekt (`/api/stripe/webhook`)
- ✅ Prüfe: `STRIPE_WEBHOOK_SECRET` ist gesetzt
- ✅ Teste Webhook in Stripe Dashboard → "Send test webhook"

### Subscription wird nicht in Supabase gespeichert
- ✅ Prüfe: `SUPABASE_SERVICE_ROLE_KEY` ist gesetzt
- ✅ Prüfe: User hat eine `profiles` Tabelle mit Email
- ✅ Prüfe Vercel Logs: Funktion Logs → `/api/stripe/webhook`

## Weitere Ressourcen
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
