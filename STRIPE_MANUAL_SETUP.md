# 🔧 Stripe Setup für CycleWise - Manuelle Steps

## Step 1: Stripe Account & API Keys

### 1.1 Login/Create Account
- Gehe zu: https://dashboard.stripe.com
- Login oder registrieren
- **TEST MODE aktivieren** (rechts oben Toggle)

### 1.2 API Keys kopieren
- Dashboard → **Developers** → **API keys**
- Kopiere:
  - `Publishable key` (starts with `pk_test_`)
  - `Secret key` (starts with `sk_test_`)

---

## Step 2: Products & Pricing erstellen

### 2.1 Premium Product (€9.99/mo)
1. Dashboard → **Products** → **+ Add product**
2. Details:
   - **Name**: `CycleWise Premium`
   - **Description**: `Premium trading suite`
   - **Type**: Select `Recurring`
   - **Billing interval**: Monthly
   - **Price**: €9.99
3. Klick **Create product**
4. **Kopiere die Price ID** (sieht aus wie `price_xxxx...`) → Speichere als `STRIPE_PRICE_ID_PREMIUM`

### 2.2 Pro Product (€19.99/mo)
1. **+ Add product** nochmal
2. Details:
   - **Name**: `CycleWise Pro`
   - **Description**: `Pro trading suite with AI`
   - **Type**: `Recurring`
   - **Billing interval**: Monthly
   - **Price**: €19.99
3. Klick **Create product**
4. **Kopiere die Price ID** → Speichere als `STRIPE_PRICE_ID_PRO`

---

## Step 3: Webhook Endpoint

### 3.1 Webhook erstellen
1. Dashboard → **Developers** → **Webhooks**
2. Klick **+ Add endpoint**
3. Details:
   - **Endpoint URL**: 
     ```
     https://cycle-wise-2-version.vercel.app/api/stripe/webhook
     ```
   - **Events to send**: Select specific events:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_failed`
4. Klick **Add endpoint**

### 3.2 Signing Secret kopieren
1. Klick auf deinen neuen Endpoint
2. **Signing secret**: Klick **Reveal** 
3. **Kopiere den Secret** (sieht aus wie `whsec_...`) → Speichere als `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Environment Variables in Vercel setzen

Öffne Terminal und führe diese Befehle aus:

```bash
cd /Users/ambikajonas/Downloads/cyclewise-trades-main/cyclewise-trades

# Test Mode Keys (vom Stripe Dashboard)
npx vercel env add STRIPE_SECRET_KEY
# Paste: sk_test_... (kopiert aus Stripe Dashboard)

npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Paste: pk_test_... (kopiert aus Stripe Dashboard)

# Price IDs (aus Products)
npx vercel env add STRIPE_PRICE_ID_PREMIUM
# Paste: price_... (kopiert von Premium Product)

npx vercel env add STRIPE_PRICE_ID_PRO
# Paste: price_... (kopiert von Pro Product)

# Webhook Secret (aus Webhooks)
npx vercel env add STRIPE_WEBHOOK_SECRET
# Paste: whsec_... (kopiert vom Signing Secret)

# Dann redeploy
npx vercel --prod
```

---

## Step 5: Testing

### Test 1: User registriert & kriegt Free Tier
```
1. Gehe zu /register
2. Erstelle neuen Account
3. Check Supabase: subscriptions table → tier sollte 'free' sein ✅
```

### Test 2: Premium Kauf
```
1. /pricing → "Start Premium"
2. Nutze Test Card: 4242 4242 4242 4242
3. Expiry: 12/26 (beliebig Zukunft)
4. CVC: 123
5. Nach Payment → checkout sollte erfolgreich sein ✅
6. Supabase: subscriptions.tier sollte 'premium' sein ✅
7. Premium Features sollten freigeschaltet sein ✅
```

### Test 3: Admin Panel
```
1. /admin/subscriptions
2. Sollte alle User mit Tiers sehen ✅
3. Klick Edit auf User
4. Ändere Tier zu 'pro'
5. Should update in real-time ✅
```

---

## Step 6: Troubleshooting

### Webhook kommt nicht an?
```bash
# Check Vercel Logs
vercel logs

# In Stripe Dashboard prüfen
Developers → Webhooks → Dein Endpoint → Events tab
# Sollte grüne Checkmarks bei "completed" haben
```

### "Failed to create checkout session"?
- Price IDs falsch? Prüfe im Stripe Dashboard
- Secret Key falsch? Prüfe im Vercel env vars

### User tier aktualisiert sich nicht?
- Webhook Events kommen an? (Check Stripe)
- Service Role Key richtig in Vercel? (Supabase → Settings → API)

---

## Live Mode (Production)

**ERST TESTEN, DANN PRODUCTION!**

Wenn alles funktioniert:
1. Stripe Dashboard → **Live Mode** aktivieren (Toggle)
2. Kopiere neue API Keys (Live Mode)
3. Erstelle neue Products mit Live Pricing
4. Neue Webhook mit Live URL
5. Aktualisiere Vercel env vars mit Live Keys
6. Redeploy: `npx vercel --prod`

---

## Checkliste

- [ ] Stripe Account erstellt
- [ ] Premium Product (€9.99) erstellt → Price ID kopiert
- [ ] Pro Product (€19.99) erstellt → Price ID kopiert
- [ ] Webhook Endpoint erstellt → Signing Secret kopiert
- [ ] STRIPE_SECRET_KEY in Vercel
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel
- [ ] STRIPE_PRICE_ID_PREMIUM in Vercel
- [ ] STRIPE_PRICE_ID_PRO in Vercel
- [ ] STRIPE_WEBHOOK_SECRET in Vercel
- [ ] `npx vercel --prod` ausgeführt
- [ ] Test Payment erfolgreich
- [ ] Admin Panel funktioniert
