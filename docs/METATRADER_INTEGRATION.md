# 🚀 MetaTrader 4 & 5 Integration Guide

**Stand:** 9. Februar 2026  
**Version:** 1.0

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Setup für Benutzer](#setup-für-benutzer)
3. [Setup für Entwickler](#setup-für-entwickler)
4. [Automatische Synchronisierung](#automatische-synchronisierung)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Überblick

CycleWise Trades unterstützt automatische Trade-Synchronisierung von:
- **MetaTrader 4 (MT4)** - Klassische Plattform
- **MetaTrader 5 (MT5)** - Moderne Plattform mit erweiterten Funktionen

### Was wird synchronisiert?
✅ Trade-Daten (Entry, Exit, Profit/Loss)  
✅ Account-Informationen  
✅ Trading-Historie  
✅ Profit/Loss Analysen  

---

## 📱 Setup für Benutzer

### Schritt 1: Kontonummer & Passwort finden

#### Im MetaTrader (MT4/MT5):
```
Menu → Tools → Options → Server
```

Hier findest du:
- **Kontonummer**: Deine Account-ID (z.B. 123456789)
- **Server**: Der Server deines Brokers (z.B. "ICMarketsDemo")

#### Passwort:
⚠️ **WICHTIG**: Nutze IMMER das **Investor-Passwort** (Read-Only), NICHT dein Master-Passwort!

```
MetaTrader → Tools → Options → Account
Klick auf "Change Password" → Neuer Investor Passwort
```

### Schritt 2: Verbindung in CycleWise Trades

1. Gehe zu: **Settings → MetaTrader Connection**
2. Wähle deine Plattform (MT4 oder MT5)
3. Gib ein:
   - Kontonummer
   - Investor-Passwort
   - Server (wähle aus Liste oder custom)
   - Prop Firm (optional, z.B. FinProMax)
4. Klick: **Verbinden**

✅ Nach erfolgreicher Verbindung wird dein Account angezeigt

### Schritt 3: Automatische Synchronisierung

Nach der Verbindung synchronisieren wir deine Trades:
- **Täglich um 00:00 UTC** (automatisch)
- Bei neuen Trades innerhalb einer Stunde (bei Pro-Plan)
- Alle Daten werden verschlüsselt in unserer Datenbank gespeichert

---

## 👨‍💻 Setup für Entwickler

### Architektur

```
MetaTrader Terminal
       ↓
  MT API Backend (server/mt-api-backend.js)
       ↓
  Vercel Edge Functions (api/mt/*)
       ↓
  Supabase Database
       ↓
  CycleWise Frontend
```

### Datenbanktabellen

#### `metatrader_accounts`
Speichert verbundene Accounts:
```sql
id | user_id | account_number | server | platform | is_active | connected_at | last_sync
```

#### `mt_trades`
Speichert synchronisierte Trades:
```sql
id | user_id | account_id | ticket | symbol | cmd | open_price | close_price | profit | open_time | close_time
```

### API Endpoints

#### 1. Account verbinden
```bash
POST /api/mt/connect
Content-Type: application/json

{
  "accountNumber": "123456789",
  "password": "investor_pwd",
  "server": "ICMarketsDemo",
  "platform": "mt4",
  "propFirm": "FinProMax"
}

Response:
{
  "success": true,
  "accountId": "acc_123456789_1707000000000",
  "demo": false,
  "message": "Live-Verbindung"
}
```

#### 2. Account-Status abrufen
```bash
GET /api/mt/account/:accountId

Response:
{
  "accountId": "acc_123456789_1707000000000",
  "number": 123456789,
  "server": "ICMarketsDemo",
  "balance": 10000.00,
  "equity": 10500.00,
  "margin": 2000.00,
  "freeMargin": 8500.00,
  "marginLevel": 525
}
```

#### 3. Trades synchronisieren
```bash
POST /api/mt/sync-trades
Content-Type: application/json

{
  "accountId": "acc_123456789_1707000000000",
  "userId": "user-uuid"
}

Response:
{
  "success": true,
  "tradesSynced": 15,
  "newTrades": 3,
  "updatedTrades": 2
}
```

### Frontend Integration

#### Komponente: MetaTraderConnect.tsx
```tsx
import MetaTraderConnect from '@/pages/MetaTraderConnect';

// Nutze direkt in Router oder Navigation
<Route path="/settings/metatrader" element={<MetaTraderConnect />} />
```

#### Hook: useMetaTraderAccounts()
```tsx
const { accounts, loading, connect, disconnect } = useMetaTraderAccounts();

// Verbundene Accounts abrufen
accounts.map(acc => (
  <div key={acc.id}>
    {acc.platform.toUpperCase()} • {acc.account_number}
    Balance: {acc.balance}
  </div>
))
```

---

## 🔄 Automatische Synchronisierung

### Sync-Strategie

1. **Initial Sync** (nach Verbindung):
   - Lade letzte 100 geschlossene Trades
   - Lade alle offenen Positionen

2. **Daily Sync** (00:00 UTC):
   - Suche nach neuen Trades seit letztem Sync
   - Update offene Positionen
   - Berechne Statistiken neu

3. **Echtzeit Sync** (Pro-Plan):
   - Webhook bei neuen Trades
   - Update innerhalb 1 Minute
   - Live-Balance Updates

### Implementierung

#### Server: `server/mt-api-backend.js`

```javascript
// MT API mit MetaApi.cloud Token
const METAAPI_TOKEN = process.env.METAAPI_TOKEN;

// Demo-Modus (ohne Token)
if (!METAAPI_TOKEN) {
  console.log('⚠️ Demo-Modus - Nutze Trader.MT4');
}
```

#### Vercel Function: `api/mt/sync.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hole alle aktiven MT Accounts
  // 2. Verbinde zu jedem Account
  // 3. Lade neue Trades
  // 4. Speichere in Supabase
  // 5. Aktualisiere last_sync Timestamp
}
```

---

## 🛠 Troubleshooting

### Problem: "Konnte Account nicht verbinden"

**Ursache:** Falsche Anmeldedaten

**Lösung:**
1. Prüfe Kontonummer (keine Leerzeichen)
2. Nutze Investor-Passwort (nicht Master-Passwort)
3. Prüfe Server-Name (case-sensitive)
4. Test mit MT4/MT5 Terminal - funktioniert die Login dort?

### Problem: "Trades werden nicht synchronisiert"

**Ursache:** Backend läuft nicht oder API ist offline

**Lösung:**
```bash
# Check MT API Backend
curl http://localhost:3001/api/mt/status

# Falls offline, starten mit:
node server/mt-api-backend.js

# Mit MetaApi Token (Live-Modus):
METAAPI_TOKEN=your_token node server/mt-api-backend.js
```

### Problem: "Kontonummer existiert bereits"

**Ursache:** Account ist schon mit diesem User verbunden

**Lösung:**
1. Gehe zu Settings → MetaTrader
2. Trenne alten Account
3. Verbinde erneut

---

## 🔐 Sicherheit

### Passwort-Handling

✅ **Was wir tun:**
- Investor-Passwort wird verschlüsselt übertragen (HTTPS)
- Gespeichert nur bei MT API Backend (nicht in Supabase!)
- Keine Logs mit Passwort

❌ **Was wir NICHT tun:**
- Trader-Passwort speichern
- Trades ohne Authentifizierung abrufen
- Daten weitergeben an Dritte

### RLS Policies

Jeder User kann nur seine eigenen:
```sql
-- Nur eigene MT Accounts sehen
SELECT * FROM metatrader_accounts WHERE user_id = auth.uid();

-- Nur eigene Trades sehen
SELECT * FROM mt_trades WHERE user_id = auth.uid();
```

---

## 📊 Nächste Schritte

### Coming Soon:

- [ ] Automatische Daily Sync Cron-Job
- [ ] Real-time Webhook Integration
- [ ] Trade-Fehleranalyse
- [ ] Multi-Account Performance-Vergleich
- [ ] MT Broker-Datenbank (Auto-Server-Detection)
- [ ] Signal-Integration

### Für Nutzer:

1. Verbinde dein MT Account
2. Warte auf erste Sync (bis zu 1 Stunde)
3. Sehe deine Trades in Analytics
4. Nutze Cycle-Tracking für bessere Entscheidungen

---

## 📞 Support

Bei Fragen oder Problemen:
1. Schau in Troubleshooting oben
2. Kontaktiere Support: support@cyclewise.trades
3. Öffne Issue auf GitHub: github.com/ambi-00/cycle-wise-2-version

---

**Happy Trading! 📈**
