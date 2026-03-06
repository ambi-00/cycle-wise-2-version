// Debug Script für localStorage - Im Browser Console ausführen
console.log('=== CycleWise Trades - localStorage Debug ===\n');

// 1. Alle localStorage Keys anzeigen
console.log('📋 Alle localStorage Keys:');
const allKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) allKeys.push(key);
}
console.log(allKeys.filter(k => k.startsWith('cw_')));

// 2. Alle Journal-Einträge finden
console.log('\n📊 Journal-Einträge (cw_journal_*):');
const journalKeys = allKeys.filter(k => k.startsWith('cw_journal_'));
console.log(`Gefunden: ${journalKeys.length} Journal-Einträge`);

let totalTrades = 0;
journalKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    const tradeCount = data?.trades?.length || 0;
    totalTrades += tradeCount;
    if (tradeCount > 0) {
      console.log(`  ${key}: ${tradeCount} Trade(s)`);
      console.log('    Beispiel-Trade:', data.trades[0]);
    }
  } catch (e) {
    console.error(`  ❌ Fehler beim Parsen von ${key}:`, e);
  }
});

console.log(`\n✅ Gesamt: ${totalTrades} Trades in localStorage`);

// 3. App Mode prüfen
console.log('\n🎮 App Mode:');
console.log('  cw_app_mode:', localStorage.getItem('cw_app_mode'));

// 4. loadTradesFromLocalStorage simulieren
console.log('\n🔍 Simuliere loadTradesFromLocalStorage():');
const allTrades = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.startsWith('cw_journal_')) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data.trades && Array.isArray(data.trades)) {
        allTrades.push(...data.trades);
      }
    } catch (e) {
      console.warn(`Failed to parse ${key}:`, e);
    }
  }
}
console.log(`Geladene Trades: ${allTrades.length}`);
if (allTrades.length > 0) {
  console.log('Beispiel-Trade (erster):', allTrades[0]);
  console.log('Felder:', Object.keys(allTrades[0]));
}

// 5. Prüfe, ob Trades die richtigen Felder haben
if (allTrades.length > 0) {
  console.log('\n🔧 Feld-Analyse:');
  const firstTrade = allTrades[0];
  console.log('  symbol:', firstTrade.symbol || '❌ FEHLT');
  console.log('  instrument:', firstTrade.instrument || '❌ fehlt');
  console.log('  r_multiple:', firstTrade.r_multiple !== undefined ? firstTrade.r_multiple : '❌ FEHLT');
  console.log('  rMultiple:', firstTrade.rMultiple !== undefined ? firstTrade.rMultiple : '❌ fehlt');
  console.log('  result:', firstTrade.result || '❌ FEHLT');
  console.log('  pnl:', firstTrade.pnl !== undefined ? firstTrade.pnl : '❌ fehlt');
  console.log('  date:', firstTrade.date || '❌ FEHLT');
}

console.log('\n=== Debug Ende ===');
