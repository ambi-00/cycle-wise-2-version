import { motion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Terms() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl p-4 lg:p-8"
      >
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Allgemeine Geschäftsbedingungen (AGB)
            </h1>
            <p className="text-muted-foreground">Stand: {new Date().toLocaleDateString('de-DE')}</p>
          </div>

          <div className="space-y-8">
            {/* Scope */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">1. Geltungsbereich</h2>
              </div>
              <p className="text-muted-foreground">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der CycleWise Trades Plattform. 
                Mit der Registrierung und Nutzung unserer Dienste akzeptieren Sie diese Bedingungen.
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Leistungen</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>CycleWise Trades bietet folgende Dienste:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Trading-Journal mit AI-gestützten Insights</li>
                  <li>Zyklustracking und Cycle-Phase-Analyse</li>
                  <li>Performance-Statistiken und Trading-Analytics</li>
                  <li>Prop-Firm-Account-Management (optional)</li>
                  <li>Strategie-Management und -Optimierung</li>
                </ul>
                <p className="mt-4">
                  Die Plattform ist als Tool zur Selbstorganisation gedacht und bietet keine Finanzberatung.
                </p>
              </div>
            </section>

            {/* Registration & Account */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Registrierung und Nutzerkonto</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">3.1 Registrierung:</strong> Zur Nutzung der Plattform ist 
                  eine Registrierung mit gültiger E-Mail-Adresse erforderlich.
                </p>
                <p>
                  <strong className="text-foreground">3.2 Zugangsdaten:</strong> Sie sind verpflichtet, Ihre 
                  Zugangsdaten vertraulich zu behandeln und vor unbefugtem Zugriff zu schützen.
                </p>
                <p>
                  <strong className="text-foreground">3.3 Kontosperrung:</strong> Wir behalten uns das Recht vor, 
                  Konten bei Missbrauch oder Verstoß gegen diese AGB zu sperren.
                </p>
              </div>
            </section>

            {/* Pricing & Payment */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Preise und Zahlung (optional)</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">4.1 Kostenlose Nutzung:</strong> Aktuell ist die Plattform 
                  kostenlos nutzbar.
                </p>
                <p>
                  <strong className="text-foreground">4.2 Zukünftige Preise:</strong> Wir behalten uns vor, 
                  zukünftig Premium-Funktionen gegen Gebühr anzubieten. Bestehende Nutzer werden rechtzeitig informiert.
                </p>
              </div>
            </section>

            {/* Usage Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">5. Nutzungsrechte</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">5.1 Erlaubte Nutzung:</strong> Sie erhalten ein nicht-exklusives, 
                  nicht übertragbares Recht zur Nutzung der Plattform für persönliche Zwecke.
                </p>
                <p>
                  <strong className="text-foreground">5.2 Verbotene Nutzung:</strong> Folgendes ist untersagt:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Reverse Engineering oder Dekompilierung der Software</li>
                  <li>Automatisierte Datenabfragen (Scraping)</li>
                  <li>Weitergabe von Zugangsdaten an Dritte</li>
                  <li>Nutzung für illegale Zwecke</li>
                </ul>
              </div>
            </section>

            {/* Data & Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Daten und Datenschutz</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">6.1 Ihre Daten:</strong> Sie behalten alle Rechte an den von 
                Ihnen eingegebenen Trading- und Zyklusdaten.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong className="text-foreground">6.2 Datenschutz:</strong> Die Verarbeitung personenbezogener 
                Daten erfolgt gemäß unserer Datenschutzerklärung.
              </p>
            </section>

            {/* Liability */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-500/10 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">7. Haftung und Disclaimer</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">7.1 Keine Finanzberatung:</strong> CycleWise Trades bietet 
                  keine Anlageberatung. Alle Trading-Entscheidungen treffen Sie eigenverantwortlich.
                </p>
                <p>
                  <strong className="text-foreground">7.2 Trading-Risiken:</strong> Der Handel mit Finanzinstrumenten 
                  birgt erhebliche Verlustrisiken. Sie erkennen an, dass Sie diese Risiken verstehen und akzeptieren.
                </p>
                <p>
                  <strong className="text-foreground">7.3 Technische Verfügbarkeit:</strong> Wir bemühen uns um 
                  hohe Verfügbarkeit, können jedoch keine 100%ige Uptime garantieren.
                </p>
                <p>
                  <strong className="text-foreground">7.4 Haftungsbeschränkung:</strong> Wir haften nur für Vorsatz 
                  und grobe Fahrlässigkeit, soweit gesetzlich zulässig.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Kündigung</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">8.1 Ihre Kündigung:</strong> Sie können Ihr Konto jederzeit 
                  in den Einstellungen löschen.
                </p>
                <p>
                  <strong className="text-foreground">8.2 Unsere Kündigung:</strong> Wir können Ihr Konto bei 
                  schwerwiegenden Verstößen gegen diese AGB fristlos kündigen.
                </p>
                <p>
                  <strong className="text-foreground">8.3 Datenexport:</strong> Vor Kontolöschung können Sie 
                  Ihre Daten exportieren.
                </p>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Änderungen der AGB</h2>
              <p className="text-muted-foreground">
                Wir behalten uns vor, diese AGB anzupassen. Wesentliche Änderungen werden Ihnen per E-Mail 
                mitgeteilt. Wenn Sie den Änderungen nicht zustimmen, können Sie Ihr Konto kündigen.
              </p>
            </section>

            {/* Applicable Law */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Anwendbares Recht</h2>
              <p className="text-muted-foreground">
                Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist [Ihr Standort], 
                soweit gesetzlich zulässig.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Salvatorische Klausel</h2>
              <p className="text-muted-foreground">
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen 
                Bestimmungen unberührt.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Kontakt</h2>
              <p className="text-muted-foreground">
                Bei Fragen zu diesen AGB erreichen Sie uns unter:
              </p>
              <p className="text-muted-foreground mt-2">
                E-Mail: [Support E-Mail]<br />
                Adresse: [Ihre Adresse]
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
