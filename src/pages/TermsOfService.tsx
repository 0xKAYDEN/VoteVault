import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const TermsOfService = () => {
  useEffect(() => { document.title = "Terms of Service — VoteVault"; }, []);

  return (
    <div className="container py-12 max-w-3xl">
      <Helmet>
        <title>Terms of Service — VoteVault</title>
        <meta name="description" content="VoteVault Terms of Service" />
      </Helmet>

      <div className="flex items-center gap-3 mb-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-8 space-y-8 text-sm leading-relaxed text-muted-foreground">

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using VoteVault ("the Service"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
          <p>
            VoteVault is a server listing and voting platform for online game servers. Users can list servers,
            vote for servers, leave reviews, and interact with the community. Server owners can purchase
            subscription plans to boost their server's visibility.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. User Accounts</h2>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>You must be at least 13 years old to create an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must provide accurate information when registering.</li>
            <li>One account per person. Multiple accounts may result in suspension.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Manipulate votes through bots, scripts, or coordinated abuse.</li>
            <li>Post false, misleading, or fraudulent server listings.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Attempt to gain unauthorized access to the Service or other accounts.</li>
            <li>Use the Service for any illegal purpose.</li>
            <li>Scrape or harvest data from the Service without permission.</li>
            <li>Post content that infringes on intellectual property rights.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">5. Payments and Subscriptions</h2>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>All payments are processed in USDT (TRC20 or BEP20) cryptocurrency.</li>
            <li>Subscription fees are non-refundable once a plan is activated.</li>
            <li>We reserve the right to change pricing with 30 days' notice.</li>
            <li>Fraudulent payment submissions will result in immediate account termination.</li>
            <li>Subscriptions do not auto-renew — you must manually renew before expiry.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">6. Content Policy</h2>
          <p>
            You retain ownership of content you submit. By submitting content, you grant VoteVault a
            non-exclusive, worldwide license to display and distribute that content on the platform.
            We reserve the right to remove any content that violates these terms or our community guidelines.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">7. API Usage</h2>
          <p>
            API access is subject to rate limits based on your subscription plan. Abuse of the API,
            including exceeding rate limits or using the API to scrape data, may result in API key
            revocation or account suspension.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">8. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms, at our
            sole discretion, with or without notice. You may delete your account at any time from
            your account settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. We do not guarantee
            uninterrupted access, accuracy of listings, or that the Service will meet your requirements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">10. Limitation of Liability</h2>
          <p>
            VoteVault shall not be liable for any indirect, incidental, or consequential damages
            arising from your use of the Service, including loss of data or revenue.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">11. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the Service after changes
            constitutes acceptance of the new terms. We will notify users of significant changes
            via email or a notice on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">12. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
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

export default TermsOfService;
