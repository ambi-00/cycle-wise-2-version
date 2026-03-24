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
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US')}</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Introduction</h2>
              </div>
              <p className="text-muted-foreground">
                Protecting your personal data is important to us. This Privacy Policy informs you about what data we collect, how we use it, and what rights you have.
              </p>
            </section>

            {/* Responsible Party */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Data Controller</h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">CycleWise Trades</p>
                <p>[Your Name / Company Name]</p>
                <p>[Address]</p>
                <p>Email: [Privacy Email]</p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/10 p-2.5">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Data We Collect</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-2">During registration:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email address</li>
                    <li>Username (optional)</li>
                    <li>Password (stored encrypted)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">During app usage:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Trading data (trades, journal entries)</li>
                    <li>Cycle data (cycle length, symptoms)</li>
                    <li>Usage statistics (to improve the app)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Technical data:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>IP address (for security and error analysis only)</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Access timestamps</li>
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
                <h2 className="text-xl font-semibold text-foreground">How We Use Your Data</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>We use your data exclusively for the following purposes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Providing and improving our services</li>
                  <li>Personalizing your experience (AI insights, cycle tracking)</li>
                  <li>Communication (important updates, support)</li>
                  <li>Security and fraud prevention</li>
                  <li>App performance analysis and optimization</li>
                </ul>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Data Storage</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Supabase (Backend):</strong> Your data is securely stored on Supabase servers that comply with European data protection standards.
                </p>
                <p>
                  <strong className="text-foreground">LocalStorage (Browser):</strong> Some data is stored locally in your browser and never leaves your device.
                </p>
                <p>
                  <strong className="text-foreground">Retention period:</strong> Your data is stored as long as your account is active. After account deletion, all data is fully removed within 30 days.
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
                We use cookies to store your login session and ensure app functionality. You can disable cookies in your browser settings, but this may affect app functionality.
              </p>
            </section>

            {/* Third Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Third-Party Services</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>We use the following third-party providers:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong className="text-foreground">Supabase:</strong> Backend, authentication, database</li>
                  <li><strong className="text-foreground">Vercel:</strong> Hosting and deployment</li>
                </ul>
                <p className="mt-2">
                  These services have their own privacy policies and process data in accordance with GDPR.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Your Rights</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>You have the following rights:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong className="text-foreground">Right of access:</strong> You can request information about your stored data</li>
                  <li><strong className="text-foreground">Right to rectification:</strong> Incorrect data can be corrected</li>
                  <li><strong className="text-foreground">Right to erasure:</strong> You can request deletion of your data</li>
                  <li><strong className="text-foreground">Right to object:</strong> You can object to data processing</li>
                  <li><strong className="text-foreground">Data portability:</strong> You can export your data in a common format</li>
                </ul>
                <p className="mt-4">
                  To exercise your rights, please contact us at: [Privacy Email]
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground">
                We implement technical and organizational security measures to protect your data from loss, manipulation, or unauthorized access. These include encryption, secure servers, and regular security updates.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Changes to this Privacy Policy</h2>
              <p className="text-muted-foreground">
                We reserve the right to update this Privacy Policy to reflect changes in law or app functionality. The current version will always be available on this page.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Contact</h2>
              <p className="text-muted-foreground">
                For privacy-related questions, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: [Privacy Email]<br />
                Address: [Your Address]
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
