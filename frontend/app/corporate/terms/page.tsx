import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | OriginBI Corporate Integration",
  description:
    "Terms of Service for OriginBI's Corporate Integration platform governing your use of the Service and third-party app connections.",
};

export default function TermsOfServicePage() {
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
          <span className="text-sm text-gray-500">Terms of Service</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d1a11] to-[#193d22] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 border border-white/10">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Legal Document
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Terms of Service</h1>
          <p className="text-white/60 text-base">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            Please read these Terms of Service ("Terms") carefully before using the OriginBI Corporate Integration
            platform operated by <strong>OriginBI Mind Works Pvt. Ltd.</strong> ("OriginBI", "we", "us", or "our").
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part
            of the Terms, you may not access the Service.
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account, connecting an integration, or otherwise using the Service, you confirm that:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>You are at least 18 years of age</li>
            <li>You are authorized to act on behalf of the corporate entity you represent</li>
            <li>Your use of the Service will comply with these Terms and all applicable laws</li>
            <li>You have read and agree to our <Link href="/corporate/policy" className="text-green-700 underline font-medium">Privacy Policy</Link></li>
          </ul>
        </Section>

        <Section title="2. Description of Service">
          <p>
            OriginBI Corporate Integration is a Software-as-a-Service (SaaS) platform that allows corporate
            organizations to:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>Connect and manage third-party application integrations (e.g., Google Drive, Slack, Jira)</li>
            <li>Synchronize candidate assessment data, workflow actions, and analytics</li>
            <li>Manage employee registrations, assessment sessions, and hiring pipelines</li>
            <li>Access talent intelligence and workforce analytics dashboards</li>
          </ul>
        </Section>

        <Section title="3. Third-Party Integrations & OAuth Authorization">
          <SubSection title="3.1 OAuth Authorization">
            When you authorize OriginBI to connect to a third-party service (e.g., Google Drive), you grant OriginBI
            a limited, revocable license to access your third-party account solely for the purposes described in
            these Terms and in accordance with the scopes you approve during the authorization process.
          </SubSection>
          <SubSection title="3.2 Scope of Access">
            OriginBI requests only the minimum scopes necessary to provide the requested integration functionality.
            We do not request or store access to data beyond what is required for the Service.
          </SubSection>
          <SubSection title="3.3 Third-Party Service Terms">
            Your use of third-party services connected through OriginBI is also governed by the respective
            terms of service of those providers (e.g.,{" "}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">
              Google Terms of Service
            </a>). OriginBI is not responsible for the practices or content of third-party services.
          </SubSection>
          <SubSection title="3.4 Revoking Access">
            You may revoke OriginBI's access to any third-party account at any time by either:
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Using the "Disconnect" feature within the OriginBI integration settings</li>
              <li>Revoking access directly through your third-party provider's account security settings</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree <strong>not</strong> to use the Service to:</p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>Violate any applicable laws or regulations</li>
            <li>Transmit or store any unlawful, harmful, or offensive content</li>
            <li>Attempt to gain unauthorized access to any systems or data</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
            <li>Use automated tools to scrape, crawl, or extract data from the Service without permission</li>
            <li>Impersonate any person or entity</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
          </ul>
        </Section>

        <Section title="5. Account Responsibilities">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account. You agree to:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>Immediately notify us of any unauthorized use of your account</li>
            <li>Ensure that all users with access to your corporate account comply with these Terms</li>
            <li>Maintain accurate and complete account information</li>
          </ul>
        </Section>

        <Section title="6. Data Ownership and License">
          <SubSection title="6.1 Your Data">
            You retain full ownership of all data you provide to the Service or that is accessed through
            authorized integrations. OriginBI does not claim ownership of your data.
          </SubSection>
          <SubSection title="6.2 License to OriginBI">
            You grant OriginBI a limited, non-exclusive, worldwide license to process and use your data
            solely to provide and improve the Service as described in these Terms and our Privacy Policy.
          </SubSection>
          <SubSection title="6.3 Data Export">
            You may export your data at any time through the Service. Upon account termination, we will
            delete your data within 30 days unless retention is required by law.
          </SubSection>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            The Service, including its content, features, and functionality, is owned by OriginBI Mind Works
            Pvt. Ltd. and is protected by intellectual property laws. You may not copy, modify, distribute,
            sell, or lease any part of the Service without our prior written permission.
          </p>
        </Section>

        <Section title="8. Fees and Payment">
          <p>
            Certain features of the Service may require payment. Pricing details, billing cycles, and
            cancellation policies are described in your subscription agreement or the Service dashboard.
            All fees are non-refundable unless stated otherwise. We reserve the right to modify pricing
            with 30 days' advance notice.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-900 text-sm">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. ORIGINBI DOES NOT WARRANT THAT THE SERVICE WILL
            BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </div>
        </Section>

        <Section title="10. Limitation of Liability">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-900 text-sm">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ORIGINBI SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA,
            OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE
            POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO
            ORIGINBI IN THE 12 MONTHS PRECEDING THE CLAIM.
          </div>
        </Section>

        <Section title="11. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless OriginBI, its officers, directors, employees,
            and agents from any claims, damages, losses, liabilities, and expenses (including legal fees)
            arising from your use of the Service, your violation of these Terms, or your violation of any
            third-party rights.
          </p>
        </Section>

        <Section title="12. Termination">
          <p>
            We may suspend or terminate your account and access to the Service at our discretion, with or
            without cause, and with or without notice. Upon termination:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>All OAuth connections will be severed and tokens deleted</li>
            <li>Your right to access the Service immediately ceases</li>
            <li>Provisions of these Terms that by their nature should survive will remain in effect</li>
          </ul>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>,
            without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive
            jurisdiction of the courts located in <strong>Chennai, Tamil Nadu, India</strong>.
          </p>
        </Section>

        <Section title="14. Changes to Terms">
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material changes
            by email or through a notice on the Service at least 14 days before the changes take effect.
            Continued use of the Service after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="15. Contact Information">
          <p>For questions about these Terms, please contact us:</p>
          <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1 text-gray-700">
            <p><strong>OriginBI Mind Works Pvt. Ltd.</strong></p>
            <p>Email: <a href="mailto:legal@originbi.com" className="text-green-700 underline">legal@originbi.com</a></p>
            <p>Website: <a href="https://mind.originbi.com" className="text-green-700 underline">mind.originbi.com</a></p>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} OriginBI Mind Works Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/corporate/policy" className="text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/corporate/terms" className="text-green-700 font-semibold">Terms of Service</Link>
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
