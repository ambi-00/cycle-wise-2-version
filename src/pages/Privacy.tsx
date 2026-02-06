import { motion } from "framer-motion";
import { Shield, Database, Cookie, Lock } from "lucide-react";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl p-4 lg:p-8"
      >
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Datenschutzerklärung</h1>
            <p className="text-muted-foreground">Stand: {new Date().toLocaleDateString('de-DE')}</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Einleitung</h2>
              </div>
              <p className="text-muted-foreground">
                Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Diese Datenschutzerklärung 
                informiert Sie darüber, welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.
              </p>
            </section>

            {/* Responsible Party */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Verantwortliche Stelle</h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">CycleWise Trades</p>
                <p>[Ihr Name / Firmenname]</p>
                <p>[Adresse]</p>
                <p>E-Mail: [Datenschutz E-Mail]</p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/10 p-2.5">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Erhobene Daten</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Bei Registrierung:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>E-Mail-Adresse</li>
                    <li>Benutzername (optional)</li>
                    <li>Passwort (verschlüsselt gespeichert)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Bei Nutzung der App:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Trading-Daten (Trades, Journal-Einträge)</li>
                    <li>Zyklusdaten (Periodenlänge, Symptome)</li>
                    <li>Nutzungsstatistiken (zur Verbesserung der App)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Technische Daten:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>IP-Adresse (nur zur Sicherheit und Fehleranalyse)</li>
                    <li>Browser-Typ und -Version</li>
                    <li>Betriebssystem</li>
                    <li>Zugriffszeitpunkte</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 p-2.5">
                  <Lock className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Verwendung der Daten</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>Wir verwenden Ihre Daten ausschließlich für folgende Zwecke:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bereitstellung und Verbesserung unserer Dienste</li>
                  <li>Personalisierung Ihrer Erfahrung (AI Insights, Cycle Tracking)</li>
                  <li>Kommunikation (wichtige Updates, Support)</li>
                  <li>Sicherheit und Betrugsprävention</li>
                  <li>Analyse und Optimierung der App-Performance</li>
                </ul>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Datenspeicherung</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Supabase (Backend):</strong> Ihre Daten werden sicher auf 
                  Servern von Supabase gespeichert, die den europäischen Datenschutzstandards entsprechen.
                </p>
                <p>
                  <strong className="text-foreground">LocalStorage (Browser):</strong> Einige Daten werden lokal 
                  in Ihrem Browser gespeichert und verlassen niemals Ihr Gerät.
                </p>
                <p>
                  <strong className="text-foreground">Speicherdauer:</strong> Ihre Daten werden gespeichert, 
                  solange Ihr Konto aktiv ist. Nach Löschung Ihres Kontos werden alle Daten innerhalb von 30 Tagen 
                  vollständig entfernt.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-500/10 p-2.5">
                  <Cookie className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
              </div>
              <p className="text-muted-foreground">
                Wir verwenden Cookies, um Ihre Anmeldung zu speichern und die App-Funktionalität zu gewährleisten. 
                Sie können Cookies in Ihren Browser-Einstellungen deaktivieren, jedoch kann dies die Funktionalität 
                der App beeinträchtigen.
              </p>
            </section>

            {/* Third Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Drittanbieter-Dienste</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Wir nutzen folgende Drittanbieter:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong className="text-foreground">Supabase:</strong> Backend, Authentifizierung, Datenbank</li>
                  <li><strong className="text-foreground">Vercel:</strong> Hosting und Deployment</li>
                </ul>
                <p className="mt-2">
                  Diese Dienste haben eigene Datenschutzerklärungen und verarbeiten Daten gemäß DSGVO.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Ihre Rechte</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Sie haben folgende Rechte:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong className="text-foreground">Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
                  <li><strong className="text-foreground">Berichtigungsrecht:</strong> Falsche Daten können korrigiert werden</li>
                  <li><strong className="text-foreground">Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
                  <li><strong className="text-foreground">Widerspruchsrecht:</strong> Sie können der Datenverarbeitung widersprechen</li>
                  <li><strong className="text-foreground">Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem gängigen Format exportieren</li>
                </ul>
                <p className="mt-4">
                  Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter: [Datenschutz E-Mail]
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Datensicherheit</h2>
              <p className="text-muted-foreground">
                Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten vor 
                Verlust, Manipulation oder unbefugtem Zugriff zu schützen. Dazu gehören Verschlüsselung, 
                sichere Server und regelmäßige Sicherheitsupdates.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Änderungen dieser Datenschutzerklärung</h2>
              <p className="text-muted-foreground">
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslage oder 
                geänderte Funktionen anzupassen. Die aktuelle Version finden Sie stets auf dieser Seite.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Kontakt</h2>
              <p className="text-muted-foreground">
                Bei Fragen zum Datenschutz erreichen Sie uns unter:
              </p>
              <p className="text-muted-foreground mt-2">
                E-Mail: [Datenschutz E-Mail]<br />
                Adresse: [Ihre Adresse]
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
