# 🎯 Quick Start: Testing the Subscription System

## Sofort Testen (Ohne Payment)

### 1. Datenbank Migration ausführen

```bash
cd /Users/ambikajonas/Downloads/cyclewise-trades-main/cyclewise-trades

# Supabase Dashboard öffnen oder:
# SQL direkt ausführen in supabase/migrations/20250204_create_subscriptions.sql
```

Oder geh zu **Supabase Dashboard > SQL Editor** und führe das SQL aus `supabase/migrations/20250204_create_subscriptions.sql` aus.

### 2. App starten

```bash
npm run dev
```

### 3. Als FREE User testen

1. Neue Registrierung oder bestehenden Account verwenden
2. Die App läuft standardmäßig im **FREE Modus**
3. Teste alle Einschränkungen:

**✅ Was funktioniert (FREE):**
- Dashboard
- Day View  
- Trade Journal (basic filters: Result, Direction, Date)
- Challenges
- PropFirm Compare
- Statistics (basic: P&L, Winrate, Charts)
- 50 Trades pro Monat
- 2 Screenshots (before-small + after-small)

**🔒 Was gesperrt ist (FREE):**
- Cycle Tracker → Zeigt Paywall
- AI Insights → Zeigt Paywall  
- PropFirm Integration → Zeigt Pro Paywall
- Strategies → Zeigt Demo mit Blur-Overlay
- Strategy Dropdown in New Trade → Disabled
- Advanced Filters (Cycle Phase, R-Multiple) → Hidden
- Statistics "Performance by Cycle Phase" → Blurred
- Large TF Screenshots → Hidden

### 4. Als PREMIUM testen

Öffne **Supabase Dashboard > Table Editor > subscriptions**

Klick "Insert row" und füge ein:
```
user_id: [Deine User ID aus auth.users]
tier: premium
status: active
```

Oder SQL:
```sql
INSERT INTO subscriptions (user_id, tier, status)
VALUES ('DEINE_USER_ID_HIER', 'premium', 'active');
```

**Dann Seite neu laden (F5)** ✅

Jetzt solltest du Zugriff haben auf:
- Cycle Tracker
- AI Insights
- Unlimited Trades
- 4 Screenshots
- Alle Filter
- Strategies
- Full Statistics

PropFirm Integration bleibt gesperrt (nur Pro).

### 5. Als PRO testen

```sql
UPDATE subscriptions 
SET tier = 'pro' 
WHERE user_id = 'DEINE_USER_ID_HIER';
```

**Seite neu laden** → Jetzt ist alles freigeschaltet! ✅

## User ID finden

1. Geh zu **Supabase Dashboard > Authentication > Users**
2. Kopiere die UUID deines Test-Users
3. Oder finde sie in der Browser Console:
   ```javascript
   // In Browser DevTools Console
   JSON.parse(localStorage.getItem('supabase.auth.token')).user.id
   ```

## Schnell zwischen Tiers wechseln

Erstelle Bookmarks für diese SQL-Queries:

**FREE:**
```sql
UPDATE subscriptions SET tier = 'free' WHERE user_id = 'YOUR_ID';
```

**PREMIUM:**
```sql
UPDATE subscriptions SET tier = 'premium' WHERE user_id = 'YOUR_ID';
```

**PRO:**
```sql
UPDATE subscriptions SET tier = 'pro' WHERE user_id = 'YOUR_ID';
```

Nach jedem Update → **Seite neu laden (F5)**

## Fehlersuche

**Feature bleibt gesperrt:**
- Seite neu laden (F5)
- Browser Console auf Fehler prüfen
- Subscription in Supabase prüfen

**useSubscription lädt nicht:**
- Bist du eingeloggt?
- Subscription Tabelle existiert?
- RLS Policies aktiv?

**Trade Limit funktioniert nicht:**
- LocalStorage clearen
- Datum überprüfen

## Nächste Schritte

Wenn alles funktioniert:
1. **Stripe Account erstellen**
2. **Checkout Flow implementieren** (siehe `docs/SUBSCRIPTION_SYSTEM.md`)
3. **Webhook Handler bauen**
4. **Payment Flow testen**
5. **Live gehen!** 🚀

## Support

Lies `docs/SUBSCRIPTION_SYSTEM.md` für Details zur Implementierung.
