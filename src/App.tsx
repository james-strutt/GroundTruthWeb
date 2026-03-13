import { useState, type FormEvent } from 'react';
import { PhoneFrame } from './components/phone/PhoneFrame';
import {
  HomeScreen,
  SnapCardScreen,
  InspectScreen,
  AppraiseScreen,
  MonitorScreen,
  ExploreScreen,
} from './components/phone/screens';
import styles from './App.module.css';

const FEATURES = [
  {
    id: 'snap',
    title: 'Snap',
    tagline: 'Point. Shoot. Know.',
    description: 'Aim your camera at any property and get an instant AI assessment — condition scoring, hazard overlays, comparable sales, and planning controls in seconds.',
    Screen: SnapCardScreen,
  },
  {
    id: 'inspect',
    title: 'Inspect',
    tagline: 'Structured multi-photo inspections',
    description: 'Capture tagged photos for every angle — frontage, boundaries, vegetation, defects. AI scores each shot in real-time and builds a complete property report.',
    Screen: InspectScreen,
  },
  {
    id: 'appraise',
    title: 'Appraise',
    tagline: 'Photo-verified comparable sales',
    description: 'Go beyond desktop valuations. Drive past comparable sales, snap a photo, and let AI adjust for condition differences. Build confidence in your price estimate.',
    Screen: AppraiseScreen,
  },
  {
    id: 'monitor',
    title: 'Monitor',
    tagline: 'AI-powered change detection',
    description: 'Track properties over time. Revisit, photograph, and let AI detect structural changes, vegetation removal, and new development — with DA cross-referencing.',
    Screen: MonitorScreen,
  },
  {
    id: 'explore',
    title: 'Explore',
    tagline: 'Walk. Observe. Score.',
    description: 'Hit the pavement and let AI observe the neighbourhood in real-time. Get walkability, streetscape, amenity, and safety scores as you move through an area.',
    Screen: ExploreScreen,
  },
] as const;

function App() {
  return (
    <div>
      <Nav />
      <Hero />
      <TrustBar />
      <FeaturesSection />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── Navigation ────────────────── */

function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <a href="#" className={styles.navBrand}>GroundTruth</a>
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#waitlist" className={styles.navCta}>Join the waitlist</a>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ──────────────────────── */

function Hero() {
  return (
    <section className={styles.hero} id="hero">
      {/* Background topo pattern */}
      <div className={styles.heroBg} />

      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <span className={styles.heroBadge}>Coming soon to iOS</span>
          <h1 className={`${styles.heroTitle} fade-up`}>
            AI-powered property<br />field intelligence
          </h1>
          <p className={`${styles.heroSub} fade-up delay-1`}>
            Point your camera at any property. Get instant condition scoring, hazard overlays, comparable sales, and planning data — all from the field.
          </p>
          <WaitlistForm className="fade-up delay-2" />
        </div>

        <div className={`${styles.heroPhone} fade-up delay-2`}>
          <PhoneFrame>
            <HomeScreen />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

/* ── Trust bar ─────────────────── */

function TrustBar() {
  return (
    <section className={styles.trustBar}>
      <div className={`${styles.trustInner} fade-up`}>
        <TrustItem icon="layers" label="NSW spatial data" detail="Real-time planning, zoning & hazard layers" />
        <TrustItem icon="brain" label="AI vision analysis" detail="Condition scoring & defect detection" />
        <TrustItem icon="shield" label="Local-first storage" detail="Your data stays on your device" />
        <TrustItem icon="target" label="GPS-verified" detail="Geotagged photos with compass bearing" />
      </div>
    </section>
  );
}

function TrustItem({ icon, label, detail }: { icon: string; label: string; detail: string }) {
  return (
    <div className={styles.trustItem}>
      <div className={styles.trustIcon}>
        {icon === 'layers' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
            <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
            <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
          </svg>
        )}
        {icon === 'brain' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
          </svg>
        )}
        {icon === 'shield' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        )}
        {icon === 'target' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        )}
      </div>
      <div>
        <div className={styles.trustLabel}>{label}</div>
        <div className={styles.trustDetail}>{detail}</div>
      </div>
    </div>
  );
}

/* ── Features ──────────────────── */

function FeaturesSection() {
  return (
    <section className={styles.features} id="features">
      <div className={`${styles.sectionHeader} fade-up`}>
        <span className={styles.sectionTag}>Five modes, one app</span>
        <h2 className={styles.sectionTitle}>Everything you need in the field</h2>
        <p className={styles.sectionSub}>
          GroundTruth combines AI vision, spatial data, and field-grade tools into five purpose-built modes.
        </p>
      </div>

      {FEATURES.map((feature, i) => (
        <div
          key={feature.id}
          className={`${styles.featureRow} ${i % 2 !== 0 ? styles.featureRowReverse : ''} fade-up`}
        >
          <div className={styles.featurePhone}>
            <PhoneFrame>
              <feature.Screen />
            </PhoneFrame>
          </div>
          <div className={styles.featureContent}>
            <span className={styles.featureTag}>{feature.id.toUpperCase()}</span>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureTagline}>{feature.tagline}</p>
            <p className={styles.featureDesc}>{feature.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ── How it works ──────────────── */

function HowItWorks() {
  return (
    <section className={styles.howSection} id="how-it-works">
      <div className={`${styles.sectionHeader} fade-up`}>
        <span className={styles.sectionTag}>How it works</span>
        <h2 className={styles.sectionTitle}>Three steps to field intelligence</h2>
      </div>
      <div className={styles.stepsGrid}>
        <Step num="1" title="Point your camera" desc="Open GroundTruth, aim at any property, and tap the shutter. GPS and compass auto-tag the shot." />
        <Step num="2" title="AI does the heavy lifting" desc="In seconds, AI analyses the photo against NSW spatial data — planning controls, hazards, comparable sales, and condition." />
        <Step num="3" title="Act with confidence" desc="Share reports, track changes over time, verify valuations from the field, and explore neighbourhoods on foot." />
      </div>
    </section>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className={`${styles.step} fade-up delay-${num}`}>
      <div className={styles.stepNum}>{num}</div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{desc}</p>
    </div>
  );
}

/* ── Final CTA ─────────────────── */

function FinalCTA() {
  return (
    <section className={styles.ctaSection} id="waitlist">
      <div className={styles.ctaBg} />
      <div className={`${styles.ctaInner} fade-up`}>
        <h2 className={styles.ctaTitle}>Be first in the field</h2>
        <p className={styles.ctaSub}>
          GroundTruth is launching soon for iOS. Join the waitlist to get early access and shape the product.
        </p>
        <WaitlistForm variant="dark" />
      </div>
    </section>
  );
}

/* ── Footer ────────────────────── */

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>GroundTruth</span>
          <p className={styles.footerTagline}>AI-powered property field intelligence</p>
        </div>
        <div className={styles.footerMeta}>
          <p>&copy; {new Date().getFullYear()} LandIQ Labs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Waitlist form ─────────────── */

function WaitlistForm({ className = '', variant = 'light' }: { className?: string; variant?: 'light' | 'dark' }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: hook up to Supabase / API
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={`${styles.formSuccess} ${className}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sage-bright)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span>You're on the list. We'll be in touch.</span>
      </div>
    );
  }

  return (
    <form
      className={`${styles.waitlistForm} ${variant === 'dark' ? styles.waitlistDark : ''} ${className}`}
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.emailInput}
      />
      <button type="submit" className={styles.submitBtn}>
        Join the waitlist
      </button>
    </form>
  );
}

export default App;
