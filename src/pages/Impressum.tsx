import { motion } from "framer-motion";
import { Building2, Mail, MapPin } from "lucide-react";

export default function Impressum() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl p-4 lg:p-8"
      >
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Impressum</h1>
            <p className="text-muted-foreground">Angaben gemäß § 5 TMG</p>
          </div>

          <div className="space-y-8">
            {/* Company Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Unternehmensangaben</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">CycleWise Trades</p>
                <p>[Ihr Name / Firmenname]</p>
                <p>[Straße und Hausnummer]</p>
                <p>[PLZ und Ort]</p>
                <p>[Land]</p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/10 p-2.5">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Kontakt</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>Telefon: [Ihre Telefonnummer]</p>
                <p>E-Mail: [Ihre E-Mail-Adresse]</p>
                <p>Website: cyclewise-trades.com</p>
              </div>
            </section>

            {/* Optional: Business Registration */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 p-2.5">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Registereintrag (falls zutreffend)</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>Registergericht: [Gericht]</p>
                <p>Registernummer: [Nummer]</p>
                <p>Umsatzsteuer-ID: [USt-IdNr.]</p>
              </div>
            </section>

            {/* Responsible Content */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>[Ihr Name]</p>
                <p>[Adresse]</p>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Haftungsausschluss</h2>
              <div className="space-y-4 text-muted-foreground text-sm">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Haftung für Inhalte</h3>
                  <p>
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                    Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Haftung für Links</h3>
                  <p>
                    Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
                    Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Trading Disclaimer</h3>
                  <p>
                    CycleWise Trades ist ein Trading-Journal-Tool und bietet keine Finanzberatung. 
                    Der Handel mit Finanzinstrumenten birgt Risiken und ist nicht für jeden Anleger geeignet. 
                    Vergangene Ergebnisse sind keine Garantie für zukünftige Erfolge.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
