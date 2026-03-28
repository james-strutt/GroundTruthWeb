import { Link } from 'react-router-dom';
import styles from './Legal.module.css';

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.brand}>GroundTruth</Link>
        </nav>

        <article className={styles.article}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.updated}>Last updated: 28 March 2026</p>

          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By creating an account or using GroundTruth (&ldquo;the Service&rdquo;), you agree to these Terms of Service.
              The Service is operated by GroundTruth AI Pty Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;). If you do not agree to these terms,
              do not use the Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. AI Disclaimer</h2>
            <p>
              <strong>AI analysis is indicative only and does not constitute professional property advice.</strong>
            </p>
            <p>
              All condition scores, defect assessments, comparable sale analyses, price estimates, streetscape scores,
              and other AI-generated outputs are produced by artificial intelligence models based on the photos you provide.
              These outputs are estimates only and must not be relied upon as a substitute for:
            </p>
            <ul>
              <li>A professional building inspection (as per AS 4349.1-2007)</li>
              <li>A formal property valuation by a Certified Practising Valuer (CPV)</li>
              <li>Professional planning advice from a qualified town planner</li>
              <li>Structural engineering assessment</li>
            </ul>
            <p>
              The AI may misidentify materials, overlook defects, produce inaccurate observations, or generate
              incorrect price estimates. Always verify critical findings with a qualified professional before making
              any property, financial, or development decisions.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Data Disclaimer</h2>
            <p>
              Spatial data displayed in GroundTruth (including zoning codes, floor space ratios, height controls,
              bushfire prone land, flood data, heritage listings, and development applications) is sourced from
              NSW Government agencies and is provided for general guidance only.
            </p>
            <p>
              Data may be incomplete, out of date, or contain inaccuracies. Always verify planning and regulatory
              information with the relevant council or NSW Planning Portal before making development or purchase decisions.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Valuation Disclaimer</h2>
            <p>
              Price indications and comparable sale analyses provided by GroundTruth are estimates only. They do
              not constitute a formal valuation under Australian Property Institute (API) standards or the Land
              Acquisition (Just Terms Compensation) Act 1991 (NSW). Sale prices shown are as recorded by the
              NSW Valuer General and may not reflect adjustments for chattels, special conditions, or related-party transactions.
            </p>
            <p>
              For any transaction, financing, insurance, or legal purpose, engage a Certified Practising Valuer (CPV).
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activity that occurs under your account. You must provide accurate information when creating your account.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorised access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use automated tools to scrape, harvest, or extract data from the Service</li>
              <li>Reverse-engineer the AI models or prompts used by the Service</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>7. Data Ownership</h2>
            <p>
              You retain ownership of all photos, notes, and data you create within GroundTruth.
              By using the Service, you grant us a limited licence to process your data solely to provide
              the Service (including sending photos to AI providers for analysis).
            </p>
            <p>
              You can export all your data at any time using the &ldquo;Export my data&rdquo; feature, and you can
              delete your account and all associated data at any time.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Subscription and Billing</h2>
            <p>
              GroundTruth offers free and paid subscription tiers. Paid subscriptions are billed monthly or annually
              as selected at the time of purchase. You may cancel your subscription at any time; access continues
              until the end of the current billing period.
            </p>
            <p>
              We reserve the right to change pricing with 30 days&rsquo; notice. Price changes do not affect
              the current billing period.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GroundTruth AI Pty Ltd accepts no liability for:
            </p>
            <ul>
              <li>Decisions made in reliance on AI-generated analyses or data displayed in the Service</li>
              <li>Financial losses arising from property transactions informed by the Service</li>
              <li>Inaccuracies in spatial data sourced from third-party government agencies</li>
              <li>Service interruptions, data loss, or security breaches beyond our reasonable control</li>
            </ul>
            <p>
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without
              warranties of any kind, whether express or implied.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Governing Law</h2>
            <p>
              These terms are governed by the laws of New South Wales, Australia. Any disputes arising from
              these terms or your use of the Service shall be subject to the exclusive jurisdiction of the
              courts of New South Wales.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated via email or
              an in-app notification at least 14 days before taking effect. Continued use of the Service after
              changes take effect constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Contact</h2>
            <p>
              For questions about these terms, contact us at:
            </p>
            <p>
              <strong>GroundTruth AI Pty Ltd</strong><br />
              Email: legal@groundtruth.ai<br />
              Sydney, NSW, Australia
            </p>
          </section>
        </article>

        <footer className={styles.footer}>
          <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          <span className={styles.footerDot} />
          <Link to="/" className={styles.footerLink}>Home</Link>
        </footer>
      </div>
    </div>
  );
}
