import { motion } from "framer-motion";
import { Shield, Database, Cookie, Lock, AlertTriangle, Scale, HeartPulse } from "lucide-react";

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
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-muted-foreground text-sm mt-1">
              According to GDPR (Regulation (EU) 2016/679) and BDSG (German Federal Data Protection Act)
            </p>
          </div>

          <div className="space-y-8">
            {/* Controller */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">1. Data Controller (Art. 13 GDPR)</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">CycleWise Trades</p>
                <p>[Your Full Name]</p>
                <p>[Street and Number]</p>
                <p>[ZIP Code, City], Germany</p>
                <p>Email: <a href="mailto:privacy@cyclewise-trades.com" className="underline hover:text-foreground">privacy@cyclewise-trades.com</a></p>
              </div>
            </section>

            {/* Special Category – Health Data WARNING */}
            <section className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-500/10 p-2.5">
                  <HeartPulse className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">2. Special Category Data – Cycle / Health Data (Art. 9 GDPR)</h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm">
                <p>
                  CycleWise Trades processes <strong className="text-foreground">menstrual cycle data and related health information</strong>.
                  Under Art. 9 GDPR, this constitutes <strong className="text-foreground">special category data</strong> (health data)
                  and is subject to the highest level of data protection.
                </p>
                <p>
                  <strong className="text-foreground">Legal basis for processing cycle/health data:</strong>{" "}
                  Art. 9 (2)(a) GDPR — your <strong className="text-foreground">explicit consent</strong>, given when you first use
                  the Cycle Tracker feature. You can withdraw consent at any time by deleting your account or contacting us.
                </p>
                <p>
                  Cycle data is stored exclusively in your Supabase account database and in your browser's local storage.
                  It is <strong className="text-foreground">never shared with third parties</strong> and is used solely to provide
                  the cycle-trading correlation analysis you requested.
                </p>
              </div>
            </section>

            {/* Legal Basis Table */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/10 p-2.5">
                  <Scale className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">3. Legal Basis for Data Processing (Art. 6 GDPR)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Purpose</th>
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 pr-4">Account creation &amp; authentication</td>
                      <td className="py-2">Art. 6 (1)(b) — contract performance</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Trade &amp; journal data</td>
                      <td className="py-2">Art. 6 (1)(b) — contract performance</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Cycle / health data</td>
                      <td className="py-2">Art. 9 (2)(a) — explicit consent</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Payment processing (Stripe)</td>
                      <td className="py-2">Art. 6 (1)(b) — contract performance</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Transactional emails (SendGrid)</td>
                      <td className="py-2">Art. 6 (1)(b) — contract performance</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Security &amp; fraud prevention</td>
                      <td className="py-2">Art. 6 (1)(f) — legitimate interests</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Data We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">4. Data We Collect</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-2">During registration:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email address</li>
                    <li>Username (optional)</li>
                    <li>Password (stored as a bcrypt hash — never in plaintext)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">During app usage:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Trading data (trades, strategies, journal entries)</li>
                    <li>
                      <strong className="text-orange-600">Cycle data (menstrual cycle length, phase, symptoms) — health data under Art. 9 GDPR</strong>
                    </li>
                    <li>App settings and preferences</li>
                    <li>XP / challenge progress</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Payment data (via Stripe):</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Subscription tier and billing status</li>
                    <li>Payment card data is processed exclusively by Stripe — we never see your card number</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Technical data (server logs):</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>IP address (retained max. 7 days for security purposes)</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Access timestamps</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Processors */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 p-2.5">
                  <Lock className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">5. Data Processors (Art. 28 GDPR)</h2>
              </div>
              <p className="text-muted-foreground mb-3 text-sm">
                We use the following service providers who process data on our behalf under a Data Processing Agreement (DPA):
              </p>
              <div className="space-y-3 text-muted-foreground">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="font-medium text-foreground">Supabase, Inc.</p>
                  <p className="text-sm">Purpose: Backend, authentication, database storage</p>
                  <p className="text-sm">Location: EU (Frankfurt) — GDPR-compliant</p>
                  <p className="text-sm">Privacy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/privacy</a></p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="font-medium text-foreground">Vercel Inc.</p>
                  <p className="text-sm">Purpose: Website hosting and deployment</p>
                  <p className="text-sm">Location: EU edge nodes available — SCCs in place</p>
                  <p className="text-sm">Privacy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">vercel.com/legal/privacy-policy</a></p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="font-medium text-foreground">Stripe, Inc.</p>
                  <p className="text-sm">Purpose: Payment processing for subscriptions</p>
                  <p className="text-sm">Location: EU — GDPR-compliant, SCCs in place</p>
                  <p className="text-sm">Privacy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">stripe.com/privacy</a></p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="font-medium text-foreground">Twilio SendGrid</p>
                  <p className="text-sm">Purpose: Transactional emails (account confirmation, notifications)</p>
                  <p className="text-sm">Location: USA — SCCs / Standard Contractual Clauses in place</p>
                  <p className="text-sm">Privacy: <a href="https://www.twilio.com/en-us/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">twilio.com/en-us/legal/privacy</a></p>
                </div>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Storage &amp; Retention</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Supabase database:</strong> Your account data is stored securely on Supabase
                  servers in Frankfurt (EU). Row-Level Security (RLS) ensures only you can access your own data.
                </p>
                <p>
                  <strong className="text-foreground">Browser local storage:</strong> Some data (e.g. prop firm accounts, app
                  preferences) is stored locally in your browser and never leaves your device.
                </p>
                <p>
                  <strong className="text-foreground">Retention period:</strong> Data is stored as long as your account is active.
                  After account deletion, all data is permanently removed within 30 days. Stripe billing records may be retained
                  for up to 10 years as required by German tax law (§ 147 AO).
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-500/10 p-2.5">
                  <Cookie className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">7. Cookies &amp; Local Storage</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground mb-1">Strictly necessary (no consent required):</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code>sb-*</code> — Supabase authentication session token</li>
                    <li><code>cw_cookie_consent</code> — your cookie consent choice</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Functional (require consent):</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>App preferences (theme, mode) stored in local storage</li>
                    <li>Prop firm account data stored locally</li>
                  </ul>
                </div>
                <p className="text-sm">
                  We currently use <strong className="text-foreground">no tracking or advertising cookies</strong>.
                  You can clear local storage at any time in your browser settings.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Your Rights (Art. 15–22 GDPR)</h2>
              <div className="space-y-2 text-muted-foreground">
                <ul className="space-y-2">
                  <li><strong className="text-foreground">Right of access (Art. 15):</strong> Request a copy of all data we hold about you.</li>
                  <li><strong className="text-foreground">Right to rectification (Art. 16):</strong> Correct inaccurate data in your profile or settings.</li>
                  <li><strong className="text-foreground">Right to erasure (Art. 17):</strong> Delete your account in Settings — all data is permanently removed.</li>
                  <li><strong className="text-foreground">Right to restrict processing (Art. 18):</strong> You may request we limit how we use your data.</li>
                  <li><strong className="text-foreground">Right to data portability (Art. 20):</strong> Export your trades and data via Settings → Export CSV.</li>
                  <li><strong className="text-foreground">Right to object (Art. 21):</strong> Object to processing based on legitimate interests.</li>
                  <li><strong className="text-foreground">Right to withdraw consent (Art. 7 (3)):</strong> Withdraw consent for cycle/health data at any time without affecting prior processing.</li>
                </ul>
                <p className="mt-4">
                  To exercise your rights, contact us at:{" "}
                  <a href="mailto:privacy@cyclewise-trades.com" className="underline hover:text-foreground">
                    privacy@cyclewise-trades.com
                  </a>. We respond within 30 days.
                </p>
              </div>
            </section>

            {/* Supervisory Authority */}
            <section className="rounded-xl border border-border bg-muted/30 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-destructive/10 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">9. Right to Lodge a Complaint (Art. 77 GDPR)</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                You have the right to lodge a complaint with a supervisory authority if you believe your data is being processed
                unlawfully. The competent authority in Germany is typically the Datenschutzbehörde of the federal state where you
                reside, for example:
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                <strong className="text-foreground">Landesbeauftragte für Datenschutz und Informationsfreiheit</strong><br />
                Website:{" "}
                <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="underline">
                  www.bfdi.bund.de
                </a>
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Data Security</h2>
              <p className="text-muted-foreground">
                We use TLS/HTTPS encryption for all data in transit, bcrypt password hashing, Supabase Row-Level Security (RLS)
                policies to isolate user data, and regular dependency updates. Despite these measures, no internet transmission
                is 100% secure.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy to reflect changes in law or app functionality. Material changes will be
                communicated via email. The current version with its effective date is always available on this page.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Contact &amp; Data Protection Inquiries</h2>
              <p className="text-muted-foreground">
                For all privacy-related questions or to exercise your rights:
              </p>
              <p className="text-muted-foreground mt-2">
                Email:{" "}
                <a href="mailto:privacy@cyclewise-trades.com" className="underline hover:text-foreground">
                  privacy@cyclewise-trades.com
                </a>
                <br />
                Response time: within 30 days as required by Art. 12 (3) GDPR
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

