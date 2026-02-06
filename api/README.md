# API Routes (Vercel Serverless Functions)

Diese API-Endpunkte werden als Vercel Serverless Functions deployed.

## Endpoints

### `POST /api/stripe/checkout`
Erstellt eine Stripe Checkout Session für Subscription-Zahlungen.

**Request Body:**
```json
{
  "tier": "premium" | "pro",
  "paymentMethod": "card" | "paypal" | "sepa" | "sofort"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### `POST /api/stripe/webhook`
Empfängt Stripe Webhook-Events und aktualisiert die Subscription-Datenbank.

**Verarbeitete Events:**
- `checkout.session.completed` - Neue Subscription erstellen
- `customer.subscription.updated` - Subscription aktualisieren
- `customer.subscription.deleted` - Subscription kündigen
- `invoice.payment_succeeded` - Zahlung erfolgreich
- `invoice.payment_failed` - Zahlung fehlgeschlagen

## Development

Lokales Testen mit Stripe CLI:

```bash
# Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Webhooks weiterleiten (in separatem Terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test-Event senden
stripe trigger checkout.session.completed
```

## Environment Variables

Siehe `.env.example` für alle benötigten Variablen.

**Wichtig:** Backend-Variablen (`STRIPE_SECRET_KEY`, etc.) **NUR** in Vercel setzen, nicht in `.env.local` committen!

## Deployment

Vercel erkennt automatisch den `/api` Ordner und deployed die Funktionen.

Nach jedem `git push` werden die API-Routes neu deployed.

## Logs

Logs anzeigen:
```bash
vercel logs --follow
```

Oder in Vercel Dashboard → Projekt → Functions → Logs
