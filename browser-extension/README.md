# CycleWise Trades - Safety Mode Browser Extension

Diese Browser-Extension blockiert automatisch deine Trading-Plattformen, wenn Safety Mode in CycleWise Trades aktiviert ist.

## Installation

### Chrome / Edge / Brave
1. Öffne `chrome://extensions/`
2. Aktiviere "Entwicklermodus" oben rechts
3. Klicke auf "Entpackte Erweiterung laden"
4. Wähle den `browser-extension` Ordner aus
5. Fertig! 🎉

### Firefox
1. Öffne `about:debugging#/runtime/this-firefox`
2. Klicke auf "Temporäres Add-on laden..."
3. Wähle die `manifest.json` Datei im `browser-extension` Ordner
4. Fertig! 🎉

## Wie es funktioniert

1. Die Extension synchronisiert automatisch mit deiner CycleWise App
2. Wenn du Safety Mode aktivierst, werden deine Trading-URLs blockiert
3. Versuchst du eine blockierte Seite zu öffnen, siehst du eine Warnseite
4. Deaktivierst du Safety Mode, sind die Seiten wieder erreichbar

## Einstellungen

Alle Einstellungen werden über die CycleWise Web-App verwaltet:
- Gehe zu Settings → Safety Mode - Website Blocker
- Gib deine Trading-Plattform URL ein
- Die Extension synchronisiert automatisch alle 30 Sekunden

## Support

Bei Problemen öffne ein Issue auf GitHub oder kontaktiere den Support.
