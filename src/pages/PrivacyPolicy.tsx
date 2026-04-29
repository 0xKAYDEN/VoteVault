import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => { document.title = "Privacy Policy — VoteVault"; }, []);

  return (
    <div className="container py-12 max-w-3xl">
      <Helmet>
        <title>Privacy Policy — VoteVault</title>
        <meta name="description" content="VoteVault Privacy Policy" />
      </Helmet>

      <div className="flex items-center gap-3 mb-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-8 space-y-8 text-sm leading-relaxed text-muted-foreground">

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong className="text-foreground">Account information:</strong> Email address, username, password (hashed), and optional profile details (display name, avatar, bio).</li>
            <li><strong className="text-foreground">Usage data:</strong> Pages visited, votes cast, reviews submitted, and API requests made.</li>
            <li><strong className="text-foreground">Payment data:</strong> Cryptocurrency transaction hashes submitted for subscription verification. We do not store wallet private keys or payment card data.</li>
            <li><strong className="text-foreground">Technical data:</strong> IP address, browser type, and device information collected automatically when you use the Service.</li>
            <li><strong className="text-foreground">Communications:</strong> Messages sent through our contact form or support channels.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>To provide and maintain the Service.</li>
            <li>To authenticate your identity and secure your account.</li>
            <li>To process subscription payments and activate plans.</li>
            <li>To send transactional emails (verification, password reset, subscription notifications).</li>
            <li>To enforce our Terms of Service and prevent abuse.</li>
            <li>To improve the Service through aggregated analytics.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong className="text-foreground">Service providers:</strong> Email delivery services (SMTP) used to send transactional emails.</li>
            <li><strong className="text-foreground">Blockchain networks:</strong> Transaction hashes are verified against public blockchain APIs (TronScan, BSCScan). These are public by nature.</li>
            <li><strong className="text-foreground">Legal requirements:</strong> We may disclose information if required by law or to protect the rights and safety of our users.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. Cookies and Tracking</h2>
          <p>
            We use an HttpOnly session cookie (<code className="text-primary bg-primary/10 px-1 rounded">auth_token</code>) to
            maintain your login session. This cookie is not accessible to JavaScript and is used solely for authentication.
            We do not use third-party tracking cookies or advertising cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">5. Data Retention</h2>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Account data is retained until you delete your account.</li>
            <li>Server logs are retained for 7–14 days and then automatically deleted.</li>
            <li>Payment records are retained for accounting purposes as required by applicable law.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong className="text-foreground">Correction:</strong> Update your profile information at any time from your account settings.</li>
            <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and associated data.</li>
            <li><strong className="text-foreground">Portability:</strong> Export your vote history from your dashboard.</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:votevaultsupport@gmail.com" className="text-primary hover:underline">votevaultsupport@gmail.com</a>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">7. Security</h2>
          <p>
            We implement industry-standard security measures including password hashing (bcrypt),
            HttpOnly cookies, HTTPS enforcement in production, and rate limiting on all endpoints.
            However, no system is completely secure — please use a strong, unique password.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">8. Children's Privacy</h2>
          <p>
            The Service is not directed at children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with personal
            information, please contact us immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">9. International Users</h2>
          <p>
            VoteVault is operated from servers that may be located outside your country. By using
            the Service, you consent to the transfer of your information to these servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via email or a notice on the platform. Continued use of the Service after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">11. Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at{" "}
            <a href="mailto:votevaultsupport@gmail.com" className="text-primary hover:underline">
              votevaultsupport@gmail.com
            </a>
            {" "}or through our{" "}
            <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
