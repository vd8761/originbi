import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | OriginBI Corporate Integration",
  description:
    "Privacy Policy for OriginBI's Corporate Integration platform, covering how we collect, use, and protect your data when connecting third-party applications.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 26, 2026";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/corporate/login" className="flex items-center gap-3">
            <img src="/Origin-BI-Logo-01.png" alt="OriginBI" className="h-8 w-auto" />
            <span className="text-base font-bold text-gray-900">OriginBI</span>
          </Link>
          <span className="text-sm text-gray-500">Privacy Policy</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d1a11] to-[#193d22] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 border border-white/10">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Legal Document
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Privacy Policy</h1>
          <p className="text-white/60 text-base">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            This Privacy Policy describes how <strong>OriginBI Mind Works Pvt. Ltd.</strong> ("OriginBI", "we", "us", or "our")
            collects, uses, and shares information about you when you use the OriginBI Corporate Integration platform,
            including when you connect third-party services such as Google Drive, Slack, and other authorized applications
            (collectively, the "Service"). By using the Service, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <SubSection title="1.1 Account Information">
            When you create a corporate account or connect an integration, we collect information such as your name,
            corporate email address, company name, job title, and other account details you provide.
          </SubSection>
          <SubSection title="1.2 OAuth Authorization Data">
            When you authorize OriginBI to connect to a third-party application (e.g., Google Drive) using OAuth 2.0,
            we collect:
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>The email address of the authorized third-party account</li>
              <li>Your display name and profile picture URL from the third-party provider</li>
              <li>OAuth access tokens and refresh tokens (stored encrypted)</li>
              <li>Token expiry timestamps</li>
            </ul>
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2 border border-amber-100">
              ⚠️ We <strong>never</strong> collect or store your password for any third-party service. All access is governed by the OAuth 2.0 standard.
            </p>
          </SubSection>
          <SubSection title="1.3 Usage Data">
            We automatically collect certain information when you access the Service, including IP addresses, browser type,
            operating system, pages viewed, and timestamps of actions.
          </SubSection>
          <SubSection title="1.4 Data Accessed via Integrations">
            Depending on the integration you authorize, OriginBI may access limited data from your third-party account
            as permitted by the scopes you approve. For example, Google Drive integration may access only specific
            files designated for use with OriginBI (using <code className="bg-gray-100 px-1 rounded text-sm">drive.file</code> scope — not your entire Drive).
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>Operate, maintain, and improve the Service</li>
            <li>Authenticate you and manage your integration connections</li>
            <li>Sync data between OriginBI and authorized third-party services</li>
            <li>Send administrative notifications about your account or integrations</li>
            <li>Detect, prevent, and address security issues or unauthorized access</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-4 font-semibold text-gray-800">
            We do <strong>not</strong> sell your personal data. We do <strong>not</strong> use your data for advertising purposes.
          </p>
        </Section>

        <Section title="3. Google API Services — Limited Use Disclosure">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-blue-900">
            <p>
              OriginBI's use of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Google API Services User Data Policy
              </a>
              , including the <strong>Limited Use requirements</strong>.
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
              <li>We only use Google data to provide the features you explicitly request</li>
              <li>We do not use Google data to serve ads</li>
              <li>We do not allow humans to read your Google data except with your explicit permission or for security purposes</li>
              <li>We do not transfer Google data to third parties except as necessary to provide the service</li>
            </ul>
          </div>
        </Section>

        <Section title="4. Data Sharing and Disclosure">
          <p>We do not share your personal information with third parties except in these circumstances:</p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li><strong>Service Providers:</strong> Trusted partners who help us operate the Service (e.g., cloud hosting), under strict data processing agreements</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
            <li><strong>Your Consent:</strong> With your explicit permission</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your data for as long as your account is active or as needed to provide the Service.
            OAuth tokens are deleted immediately when you disconnect an integration. You may request deletion
            of your account data at any time by contacting us at{" "}
            <a href="mailto:privacy@originbi.com" className="text-green-700 underline font-medium">privacy@originbi.com</a>.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>All OAuth tokens are stored <strong>encrypted at rest</strong> using AES-256 encryption</li>
            <li>All data in transit is protected using <strong>TLS 1.2+</strong></li>
            <li>Access to production systems is restricted and audited</li>
            <li>Regular security assessments are conducted</li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data (right to be forgotten)</li>
            <li>Revoke OAuth authorizations at any time via your third-party provider's settings</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@originbi.com" className="text-green-700 underline font-medium">privacy@originbi.com</a>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use essential cookies to maintain your login session. We do not use tracking or advertising cookies.
            You can disable cookies in your browser settings, but this may affect the functionality of the Service.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes
            by email or by posting a prominent notice on the Service. Continued use of the Service after
            such changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
          <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1 text-gray-700">
            <p><strong>OriginBI Mind Works Pvt. Ltd.</strong></p>
            <p>Email: <a href="mailto:privacy@originbi.com" className="text-green-700 underline">privacy@originbi.com</a></p>
            <p>Website: <a href="https://mind.originbi.com" className="text-green-700 underline">mind.originbi.com</a></p>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} OriginBI Mind Works Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/corporate/policy" className="text-green-700 font-semibold">Privacy Policy</Link>
            <Link href="/corporate/terms" className="text-gray-500 hover:text-gray-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ───
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}
