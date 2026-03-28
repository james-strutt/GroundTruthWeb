import { Link } from 'react-router-dom';
import styles from './Legal.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.brand}>GroundTruth</Link>
        </nav>

        <article className={styles.article}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: 28 March 2026</p>

          <section className={styles.section}>
            <h2>1. Who We Are</h2>
            <p>
              GroundTruth is operated by GroundTruth AI Pty Ltd (ABN to be confirmed), a company registered in New South Wales, Australia.
              In this policy, &ldquo;we&rdquo;, &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to GroundTruth AI Pty Ltd.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. What Data We Collect</h2>
            <p>We collect the following categories of personal information:</p>
            <ul>
              <li><strong>Account information</strong> &mdash; email address, display name, and authentication credentials (hashed).</li>
              <li><strong>Property photos</strong> &mdash; images you capture or upload for AI analysis, including EXIF metadata (GPS coordinates, compass heading, timestamp).</li>
              <li><strong>Location data</strong> &mdash; GPS coordinates when you capture photos, record walk routes, or use map features. Background location is only collected during active walk sessions with your explicit consent.</li>
              <li><strong>AI analysis results</strong> &mdash; condition scores, defect assessments, comparable sale analyses, and other outputs generated from your photos.</li>
              <li><strong>Property data</strong> &mdash; addresses, notes, directories, and organisational data you create within the app.</li>
              <li><strong>Usage data</strong> &mdash; feature usage patterns, session frequency, and crash reports (collected via PostHog and Sentry).</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. How We Use Your Data</h2>
            <ul>
              <li><strong>AI analysis</strong> &mdash; photos are sent to OpenAI (GPT-4o Vision) and Google (Gemini) via Supabase Edge Functions for property analysis. Photos are not retained by these providers beyond the API request.</li>
              <li><strong>Spatial enrichment</strong> &mdash; GPS coordinates are used to query NSW Government spatial data services (planning controls, zoning, hazards, comparable sales) to enrich your property assessments.</li>
              <li><strong>Map display</strong> &mdash; coordinates are sent to Mapbox to render map tiles and geocode addresses.</li>
              <li><strong>Account management</strong> &mdash; email is used for authentication, password resets, and critical account notifications.</li>
              <li><strong>Product improvement</strong> &mdash; anonymised usage data helps us understand feature adoption and fix bugs.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Data Storage and Security</h2>
            <p>
              Your data is stored in Supabase (hosted on AWS in the Sydney, Australia region &mdash; ap-southeast-2).
              All data is encrypted in transit (TLS 1.2+) and at rest. Authentication uses PKCE flow with
              automatically refreshed JWTs. Row-level security (RLS) policies ensure you can only access your own data.
            </p>
            <p>
              Photos are stored in Supabase Storage with authenticated access only. Sensitive credentials on iOS
              are stored using the device Keychain via expo-secure-store.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Third-Party Services</h2>
            <p>We share data with the following third-party services, solely to provide the GroundTruth service:</p>
            <ul>
              <li><strong>Supabase</strong> (database, auth, storage, edge functions) &mdash; Sydney, Australia</li>
              <li><strong>OpenAI</strong> (GPT-4o Vision for property analysis) &mdash; United States</li>
              <li><strong>Google</strong> (Gemini for AI image editing) &mdash; United States</li>
              <li><strong>Mapbox</strong> (map tiles, geocoding) &mdash; United States</li>
              <li><strong>Sentry</strong> (crash reporting) &mdash; United States</li>
              <li><strong>PostHog</strong> (product analytics) &mdash; European Union</li>
              <li><strong>Vercel</strong> (web app hosting) &mdash; Global CDN</li>
            </ul>
            <p>
              Photos sent to OpenAI and Google for analysis are processed in the United States. These providers
              do not retain your photos beyond the API request processing time as per their data processing agreements.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Data Retention</h2>
            <p>
              Your data is retained for as long as your account is active. You can delete individual records
              (snaps, inspections, walk routes, etc.) at any time. When you delete your account, all associated
              data is permanently purged from our systems within 30 days.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Your Rights</h2>
            <p>Under the Australian Privacy Act 1988 and applicable laws, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> your data &mdash; use the &ldquo;Export my data&rdquo; feature in Settings.</li>
              <li><strong>Correct</strong> your data &mdash; edit any record directly within the app.</li>
              <li><strong>Delete</strong> your data &mdash; delete individual records or your entire account via Settings.</li>
              <li><strong>Withdraw consent</strong> &mdash; revoke location permissions or delete your account at any time.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>8. Location Data</h2>
            <p>
              GroundTruth requests location permission to geotag property photos and display your position on the map.
              Background location is only used during active Explore walk sessions with your explicit consent, and you
              can disable background tracking in the app settings. Walk route GPS data can be individually deleted from
              your walk history.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Children</h2>
            <p>
              GroundTruth is designed for property professionals and is not intended for use by children under 16.
              We do not knowingly collect data from children.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Material changes will be communicated via
              email or an in-app notification. Continued use of GroundTruth after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Contact</h2>
            <p>
              For privacy inquiries or to exercise your data rights, contact us at:
            </p>
            <p>
              <strong>GroundTruth AI Pty Ltd</strong><br />
              Email: privacy@groundtruth.ai<br />
              Sydney, NSW, Australia
            </p>
          </section>
        </article>

        <footer className={styles.footer}>
          <Link to="/terms" className={styles.footerLink}>Terms of Service</Link>
          <span className={styles.footerDot} />
          <Link to="/" className={styles.footerLink}>Home</Link>
        </footer>
      </div>
    </div>
  );
}
