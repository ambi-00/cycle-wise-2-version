# 🚀 Server-Side Loading für Vite + React

## Problem
- Normaler Client-Side Load → **Flackern** (first free, then premium)
- Upsell-Screen sichtbar bevor der richtige Tier geladen ist
- User sieht Lock, dann freigeschaltet → Schlechte UX

## Lösung: Server-Side-ähnliches Loading

Für Vite/React (nicht Next.js) nutzen wir:
- **useServerSideData Hook** - Lädt User + Tier BEVOR Komponente rendert
- **Blank Screen während Loading** - Kein sichtbares Flackern
- **Garantierter Tier beim Render** - Keine Conditionals auf Loading

## Usage

### Option 1: Hook (einfach)

```tsx
import { useServerSideData } from '@/lib/serverSideLoad';

export default function AIInsights() {
  const { data, loading } = useServerSideData();

  // Loading: blank screen (kein Flackern!)
  if (loading || !data) {
    return <div className="min-h-screen bg-background" />;
  }

  const { user, tier } = data;

  // Tier ist jetzt GARANTIERT geladen
  return (
    <div>
      {tier === 'pro' && <ProFeatures />}
      {tier === 'premium' && <PremiumFeatures />}
      {tier === 'free' && <UpgradePrompt />}
    </div>
  );
}
```

### Option 2: HOC (für mehrere Pages)

```tsx
import { withServerSideLoad } from '@/lib/serverSideLoad';

function MyPageComponent({ tier }: { tier: 'free' | 'premium' | 'pro' }) {
  // tier ist IMMER gesetzt, kein Loading State nötig
  return (
    <div>
      {tier === 'pro' && <ProFeatures />}
    </div>
  );
}

export default withServerSideLoad(MyPageComponent);
```

## Vorher vs Nachher

### VORHER (Client-Side, Flackern):
```
1. User sieht Lock (free tier default)
2. Component rendert
3. useSubscription lädt...
4. tier aktualisiert sich
5. Lock verschwindet → FLACKERN! 😞
```

### NACHHER (Server-Side Loading):
```
1. Blank Screen (während Loading)
2. User + Tier werden geladen (nicht sichtbar)
3. Component rendert MIT tier bereits gesetzt
4. Kein Flackern, kein Lock → Smooth! ✅
```

## Performance

- **Loading Zeit**: Same (Daten müssen geladen werden)
- **UX**: Much Better (kein Flackern, kein Redirect jiggle)
- **Perceived Performance**: Better (blank → full page besser als flickering)

## Wo nutzen?

Alle Pages die tier-dependent sind:
- `/insights` - Pro only
- `/strategies` - Premium+
- `/statistics` - Premium+
- `/cycle` - Premium+

## Code in serverSideLoad.ts

```tsx
export function useServerSideData() {
  const [data, setData] = useState<...>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const user = await supabase.auth.getUser();
      const subscription = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      setData({ user, tier: subscription.tier });
    };
    load();
  }, []);

  return { data, loading };
}
```

## Next.js Alternative

Wenn du zu Next.js migrieren willst, könntest du dann echtes SSR nutzen:

```tsx
export async function getServerSideProps(ctx) {
  const supabase = createServerSupabaseClient(ctx);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { redirect: { destination: "/login" } };
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', session.user.id)
    .single();

  return { props: { tier: subscription.tier } };
}
```

Aber für Vite reicht das Hook-Pattern völlig aus! ✅
