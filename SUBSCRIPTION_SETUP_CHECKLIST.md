# 🚀 Subscription System - Setup Checkliste

## 📋 Schritt 1: Stripe Dashboard Konfiguration

### A) Price IDs erstellen (wenn noch nicht done)

1. **Gehe zu**: https://dashboard.stripe.com → Products
2. **Erstelle Premium Product** (falls nicht vorhanden):
   - Name: `CycleWise Premium`
   - Type: Recurring
   - Billing Interval: Monthly
   - Price: €9.99
   - ✅ **Kopiere die Price ID** (sieht aus wie `price_xxx`)

3. **Erstelle Pro Product**:
   - Name: `CycleWise Pro`
   - Type: Recurring
   - Billing Interval: Monthly
   - Price: €19.99
   - ✅ **Kopiere die Price ID**

### B) Webhook einrichten

1. **Gehe zu**: https://dashboard.stripe.com → Developers → Webhooks
2. **Neue Endpoint hinzufügen**:
   - URL: `https://cycle-wise-2-version.vercel.app/api/stripe/webhook`
   - Events zum senden:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - ✅ **Kopiere das Signing Secret** (sieht aus wie `whsec_xxx`)

---

## 🔧 Schritt 2: Vercel Environment Variables

Gehe zu: https://vercel.com → `cycle-wise-2-version` → Settings → Environment Variables

Setze folgende Variablen:

```
STRIPE_SECRET_KEY = sk_test_... (von Stripe Dashboard → API Keys)
STRIPE_PUBLISHABLE_KEY = pk_test_... (von Stripe Dashboard)
STRIPE_PRICE_ID_PREMIUM = price_xxx (kopiert von Premium Product)
STRIPE_PRICE_ID_PRO = price_xxx (kopiert von Pro Product)
STRIPE_WEBHOOK_SECRET = whsec_xxx (kopiert vom Webhook Signing Secret)
SUPABASE_SERVICE_ROLE_KEY = (schon vorhanden?)
SUPABASE_URL = (schon vorhanden?)
VITE_SUPABASE_URL = (schon vorhanden?)
VITE_SUPABASE_PUBLISHABLE_KEY = (schon vorhanden?)
```

**⚠️ WICHTIG**: Nach jedem Change → **Redeploy erforderlich**
```bash
vercel deploy --prod
```

---

## ✅ Schritt 3: Testing

### Test 1: New User Registration
```
1. Gehe zu /register
2. Erstelle neuen Test-Account
3. Nach Login → prüfe ob subscriptions Tabelle einen "free" Tier hat
```

### Test 2: Stripe Checkout
```
1. Gehe zu /pricing
2. Klick "Start Premium"
3. Checkout-Form ausfüllen
4. Nutze Test Card: 4242 4242 4242 4242
5. Beliebige Zukunftsdatum für Expiry
6. Nach Payment → sollte zu /dashboard?success=true redirecten
7. Prüfe ob tier aktualisiert wurde (sollte "premium" sein)
8. Premium Features sollten sichtbar sein
```

### Test 3: Admin Panel
```
1. Gehe zu /admin/subscriptions
2. Sollte alle User mit Tiers sehen
3. Klick Edit auf einen User
4. Ändere Tier auf "pro"
5. Bestätigung sehen
6. User sollte sofort Pro-Features haben
```

---

## 🐛 Debugging

### Webhook kommt nicht an?
```bash
# In Vercel Terminal prüfen:
vercel logs

# Dort sollte sichtbar sein bei successful payment:
"Subscription created for user abc-123: premium"
```

### Logs in Stripe prüfen:
1. https://dashboard.stripe.com → Developers → Webhooks
2. Letzte Events anschauen
3. Wenn "failed" → Details öffnen

### Lokales Testing (optional):
```bash
# Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# Webhook lokal testen:
stripe listen --forward-to localhost:3001/api/stripe/webhook

# In neuem Terminal:
npm run dev

# In Test erfolgen
```

---

## 📱 Frontend Flows zu testen

### Flow 1: Free User sieht Lock-Icons
```
1. Login mit Free-User
2. Gehe zu /insights oder /strategies
3. Sollte "Lock" Icon + "Upgrade" Button sehen
```

### Flow 2: Premium User sieht Strategies
```
1. Login mit Premium-User (oder upgrade im Test)
2. Gehe zu /strategies
3. Sollte "New Strategy" Button sehen, nicht locked
```

### Flow 3: Pro User sieht AI Insights
```
1. Login mit Pro-User
2. Gehe zu /insights
3. Sollte AI Cards ohne Lock sehen
```

---

## 🎯 Was nach Setup funktionieren sollte

✅ Neue User bekommen automatisch "free" Tier
✅ User kann auf /pricing kaufen (Premium oder Pro)
✅ Nach Stripe-Zahlung wird Tier automatisch aktualisiert
✅ Features werden sofort basierend auf Tier freigegeben
✅ Admin kann über /admin/subscriptions manuell Tiers ändern
✅ Webhook aktualisiert subscription Status bei Problemen (past_due, canceled)

---

## 🔐 Production Readiness

Bevor zu Live Stripe wechseln:

- [ ] Alle env vars gesetzt + verified
- [ ] Test-Flow erfolgreich durchlaufen
- [ ] Webhook-Events kommen an
- [ ] Admin Panel funktioniert
- [ ] Logs sind clean (keine SQL errors)
- [ ] Vercel Deploy war erfolgreich

Dann:
1. Stripe → Live Mode aktivieren
2. Live API Keys generieren
3. Live Price IDs kopieren
4. Live Webhook Signing Secret kopieren
5. Alle env vars updaten
6. Redeploy
7. Mit echtem Zahlungsmittel testen

---

## 📞 Probleme?

Schaue hier:
- `/api/stripe/` Dateien - Endpoints
- `src/pages/Checkout.tsx` - Frontend Zahlung
- `src/hooks/use-subscription.ts` - Feature-Gating
- `src/pages/AdminSubscriptions.tsx` - Admin UI
- `supabase/migrations/001_initial_schema.sql` - Trigger

Oder: `SUBSCRIPTION_IMPLEMENTATION.md` für detaillierte Dokumentation
