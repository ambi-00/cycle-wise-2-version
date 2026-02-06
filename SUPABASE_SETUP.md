# 🚀 Supabase Backend Setup Guide

## Schritt 1: SQL Schema ausführen

1. **Gehe zu deinem Supabase Dashboard**: https://app.supabase.com
2. **Wähle dein Projekt** aus
3. **Navigiere zu**: SQL Editor (linke Sidebar)
4. **Erstelle eine neue Query**
5. **Kopiere den gesamten Inhalt** aus `supabase/migrations/001_initial_schema.sql`
6. **Füge ihn in den SQL Editor ein**
7. **Klicke auf "Run"** ▶️

**Was passiert:**
- ✅ 6 Tabellen werden erstellt: `profiles`, `trades`, `strategies`, `cycle_logs`, `prop_firm_accounts`, `ai_insights`
- ✅ Row Level Security (RLS) wird aktiviert - jeder User sieht nur seine eigenen Daten
- ✅ Storage Bucket für Trade-Screenshots wird erstellt
- ✅ Automatische Triggers für `updated_at` timestamps
- ✅ Automatische Profil-Erstellung bei User-Registrierung

## Schritt 2: TypeScript Types generieren

### Option A: Automatisch (empfohlen)

```bash
# Installiere Supabase CLI
npm install -g supabase

# Login bei Supabase
supabase login

# Link dein Projekt (finde Project ID im Dashboard unter Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Generiere Types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Option B: Manuell

Ich habe bereits aktualisierte Types vorbereitet - du kannst sie direkt verwenden (siehe unten).

## Schritt 3: Environment Variables checken

Stelle sicher, dass in `.env.local` folgendes steht:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Diese Werte findest du in: Supabase Dashboard → Settings → API

## Schritt 4: Storage für Bilder konfigurieren (Optional)

Falls du Trade-Screenshots hochladen möchtest:

1. **Gehe zu**: Storage → Buckets
2. **Prüfe**: Ob `trade-images` Bucket erstellt wurde
3. **Optional**: Füge CORS-Regeln hinzu für localhost:
   - Allowed Origins: `http://localhost:8080,http://localhost:5173`

## 🎯 Was kannst du jetzt tun?

Nach dem Setup kannst du:

### ✅ Trades speichern & synchronisieren
```typescript
import { supabase } from '@/integrations/supabase/client';

// Trade speichern
const { data, error } = await supabase
  .from('trades')
  .insert({
    date: '2026-02-04',
    instrument: 'EUR/USD',
    direction: 'long',
    entry_price: 1.0850,
    // ... weitere Felder
  });
```

### ✅ Strategies in DB speichern
```typescript
const { data, error } = await supabase
  .from('strategies')
  .insert({
    name: 'ICT Silver Bullet',
    markets: ['Forex', 'Indices'],
    timeframes: ['1H', '15M'],
    confirmations: ['Market structure', 'FVG'],
  });
```

### ✅ Zyklus-Daten tracken
```typescript
const { data, error } = await supabase
  .from('cycle_logs')
  .upsert({
    date: '2026-02-04',
    has_period: true,
    mood: 7,
    confidence: 8,
  });
```

### ✅ Bilder hochladen
```typescript
const file = event.target.files[0];
const userId = (await supabase.auth.getUser()).data.user?.id;
const filePath = `${userId}/${Date.now()}_${file.name}`;

const { data, error } = await supabase.storage
  .from('trade-images')
  .upload(filePath, file);

// URL zum Bild:
const { data: { publicUrl } } = supabase.storage
  .from('trade-images')
  .getPublicUrl(filePath);
```

## 📊 Nächste Schritte

1. ✅ SQL ausführen (Schritt 1)
2. ✅ Types generieren (Schritt 2)
3. 🔄 LocalStorage-Logik zu Supabase migrieren
4. 🚀 Multi-Device Support aktiviert!

## 🔐 Sicherheit

- **Row Level Security (RLS)** ist aktiv - jeder User sieht nur seine Daten
- **PropFirm-Passwörter** sollten verschlüsselt werden (nutze `investor_password_encrypted`)
- **Storage** ist privat - nur der User kann seine Bilder sehen

## 🐛 Troubleshooting

**Error: "relation does not exist"**
→ SQL Migration noch nicht ausgeführt

**Error: "new row violates row-level security policy"**
→ User ist nicht eingeloggt oder `user_id` fehlt

**Error: "column does not exist"**
→ Types neu generieren mit `supabase gen types`

## 📚 Nützliche Links

- Supabase Dashboard: https://app.supabase.com
- Supabase Docs: https://supabase.com/docs
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

---

**Bereit zum Coden? Führe jetzt Schritt 1 aus und sag mir Bescheid!** 🚀
