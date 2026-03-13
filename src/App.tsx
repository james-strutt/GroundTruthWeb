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
import { insertWaitlistEmail } from './supabaseClient';
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
      <Divider />
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
          <PhoneFrame size="large">
            <HomeScreen />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

/* ── Divider ───────────────────── */

function Divider() {
  return <div className={styles.divider} />;
}

/* ── Features (tabbed) ────────── */

function FeaturesSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const feature = FEATURES[activeIdx];

  return (
    <section className={styles.features} id="features">
      <div className={`${styles.sectionHeader} fade-up`}>
        <span className={styles.sectionTag}>Five modes, one app</span>
        <h2 className={styles.sectionTitle}>Everything you need in the field</h2>
        <p className={styles.sectionSub}>
          GroundTruth combines AI vision, spatial data, and field-grade tools into five purpose-built modes.
        </p>
      </div>

      <div className={styles.featureTabs}>
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            className={`${styles.featureTabBtn} ${i === activeIdx ? styles.featureTabBtnActive : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            {f.title}
          </button>
        ))}
      </div>

      <div className={styles.featurePanel} key={feature.id}>
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
        <WaitlistForm />
      </div>
    </section>
  );
}

/* ── Footer ────────────────────── */

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerLogo}>GroundTruth</span>
        <p className={styles.footerTagline}>AI-powered property field intelligence</p>
      </div>
    </footer>
  );
}

/* ── Waitlist form ─────────────── */

function WaitlistForm({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === 'submitting') return;
    setStatus('submitting');
    const { error } = await insertWaitlistEmail(email);
    if (error) {
      if (error.code === '23505') {
        setStatus('success');
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } else {
      setStatus('success');
    }
  }

  if (status === 'success') {
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
      className={`${styles.waitlistForm} ${className}`}
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
      <button type="submit" className={styles.submitBtn} disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Joining...' : status === 'error' ? 'Try again' : 'Join the waitlist'}
      </button>
    </form>
  );
}

export default App;
