# 🚀 Stripe Setup - Schnellstart (5 Minuten)

Du hast bereits deinen Publishable Key hinterlegt ✅

## Nächste Schritte:

### 1. Gehe zu Stripe Dashboard
👉 https://dashboard.stripe.com/test/products

### 2. Erstelle Premium Produkt
- Klicke **"+ Add product"**
- Name: `CycleWise Premium`
- Description: `Monthly trading journal subscription`
- Pricing:
  - Type: **Recurring**
  - Billing period: **Monthly**  
  - Price: **€9.99**
- Klicke **"Save product"**

### 3. Erstelle Payment Link für Premium
- Im Produkt → Scroll zu deinem Pricing (€9.99/month)
- Klicke **"Create payment link"**
- ✅ Kopiere die URL (sieht aus wie: `https://buy.stripe.com/test_xxxxx`)

### 4. Wiederhole für Pro
- **"+ Add product"**
- Name: `CycleWise Pro`
- Pricing: **€19.99/month**
- **"Create payment link"**
- ✅ Kopiere die URL

### 5. Füge Payment Links in Code ein

Öffne: `src/pages/Pricing.tsx`

Ersetze in Zeile 90-97:

```typescript
const handleUpgrade = (tierName: string) => {
  // Ersetze mit deinen echten Links:
  const paymentLinks = {
    premium: 'https://buy.stripe.com/test_DEIN_PREMIUM_LINK',  // ← Hier einfügen
    pro: 'https://buy.stripe.com/test_DEIN_PRO_LINK',          // ← Hier einfügen
  };
  
  const link = paymentLinks[tierName.toLowerCase() as keyof typeof paymentLinks];
  if (link) {
    window.location.href = link;
  }
};
```

### 6. Testen

```bash
npm run dev
# Öffne http://localhost:8080/pricing
# Klicke "Upgrade to Premium"
# Du wirst zu Stripe weitergeleitet
```

**Test-Kreditkarte:**
- Nummer: `4242 4242 4242 4242`
- Datum: `12/34`
- CVV: `123`

### 7. Nach Testkauf: Subscription in Supabase aktivieren

1. Gehe zu Supabase Dashboard → Table Editor → `subscriptions`
2. **Insert row:**
   - `user_id`: Deine User-ID aus `auth.users` Tabelle
   - `tier`: `premium` oder `pro`
   - `status`: `active`
   - `stripe_customer_id`: (findest du in Stripe → Customers)
   - Rest leer lassen
3. Save

Jetzt hat der User Zugriff auf Premium/Pro Features! 🎉

---

## Optional: Automatische Sync (später)

Wenn du viele Kunden hast und nicht manuell updaten willst:
→ Siehe `docs/STRIPE_SETUP.md` für Webhook-Integration

Für die ersten 10-20 Kunden reicht die manuelle Methode völlig!
