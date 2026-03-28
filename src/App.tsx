import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { PhoneFrame } from './components/phone/PhoneFrame';
import {
  HomeScreen,
  SnapCardScreen,
  InspectScreen,
  AppraiseScreen,
  MonitorScreen,
  ExploreScreen,
} from './components/phone/screens';
import { insertWaitlistEmail, getWaitlistCount } from './supabaseClient';
import styles from './App.module.css';

const FEATURES = [
  {
    id: 'snap',
    title: 'Snap',
    tagline: 'Capture and analyse in under 60 seconds',
    description: 'Aim your camera at any property and get an instant AI assessment. Condition scoring, hazard overlays, and planning controls — no paperwork, no delays.',
    Screen: SnapCardScreen,
  },
  {
    id: 'inspect',
    title: 'Inspect',
    tagline: 'Never miss a defect again',
    description: 'Capture tagged photos for every angle and let AI score each shot in real-time. Walk away with a complete property report before you leave the site.',
    Screen: InspectScreen,
  },
  {
    id: 'appraise',
    title: 'Appraise',
    tagline: 'Data-backed valuations you can trust',
    description: 'Go beyond desktop valuations. Drive past comparable sales, snap a photo, and let AI adjust for condition differences you can see with your own eyes.',
    Screen: AppraiseScreen,
  },
  {
    id: 'monitor',
    title: 'Monitor',
    tagline: 'Catch changes before they become problems',
    description: 'Track properties over time with AI-powered change detection. Spot structural shifts, vegetation removal, and new development — cross-referenced against DA records.',
    Screen: MonitorScreen,
  },
  {
    id: 'explore',
    title: 'Explore',
    tagline: 'Walk scores and insights, hands-free',
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
      <SocialProof />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── Navigation ────────────────── */

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleKey); };
  }, [menuOpen, closeMenu]);

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <a href="#" className={styles.navBrand}>GroundTruth</a>
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="/login" className={styles.navCta}>Sign in</a>
        </div>
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={`${styles.hamburgerBar} ${menuOpen ? styles.hamburgerOpen : ''}`} />
        </button>
      </div>
      {menuOpen && (
        <>
          <div className={styles.mobileOverlay} onClick={closeMenu} />
          <div className={styles.mobileMenu}>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="/pricing" onClick={closeMenu}>Pricing</a>
            <a href="/login" className={styles.mobileCta} onClick={closeMenu}>Get early access</a>
          </div>
        </>
      )}
    </nav>
  );
}

/* ── Hero ──────────────────────── */

function useWaitlistCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getWaitlistCount().then((c) => {
      if (!cancelled && c !== null && c >= 10) setCount(c);
    });
    return () => { cancelled = true; };
  }, []);

  return count;
}

function Hero() {
  const waitlistCount = useWaitlistCount();

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroBg} />

      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <span className={styles.heroBadge}>Coming soon to iOS</span>
          <h1 className={`${styles.heroTitle} fade-up`}>
            See what others miss.<br />From the field.
          </h1>
          <p className={`${styles.heroSub} fade-up delay-1`}>
            Point your camera at any property and get instant AI-powered condition scoring, hazard overlays, comparable sales, and planning data — no office required.
          </p>
          {waitlistCount !== null && (
            <p className={`${styles.heroWaitlistCount} fade-up delay-1`}>
              Join {waitlistCount}+ NSW property professionals
            </p>
          )}
          <div className={`${styles.heroCtas} fade-up delay-2`}>
            <a href="#waitlist" className={styles.heroCtaBtn}>Get early access</a>
            <a href="#features" className={styles.heroCtaSecondary}>See how it works</a>
          </div>
          <WaitlistForm className="fade-up delay-3" />
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

      <div className={styles.featureTabs} role="tablist" aria-label="Feature modes">
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={i === activeIdx}
            aria-controls={`feature-panel-${f.id}`}
            id={`feature-tab-${f.id}`}
            className={`${styles.featureTabBtn} ${i === activeIdx ? styles.featureTabBtnActive : ''}`}
            onClick={() => setActiveIdx(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setActiveIdx((i + 1) % FEATURES.length);
              if (e.key === 'ArrowLeft') setActiveIdx((i - 1 + FEATURES.length) % FEATURES.length);
            }}
          >
            {f.title}
          </button>
        ))}
      </div>

      <div className={styles.featurePanel} key={feature.id} role="tabpanel" id={`feature-panel-${feature.id}`} aria-labelledby={`feature-tab-${feature.id}`}>
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

/* ── Social proof ──────────────── */

const TESTIMONIALS = [
  { quote: 'Replaced two hours of desktop research with a 60-second photo from the kerb.', name: 'Sarah L.', role: 'Residential Valuer, Sydney' },
  { quote: 'The DA cross-referencing alone has saved my team countless hours each week.', name: 'Marcus T.', role: 'Buyers\u2019 Agent, Northern Beaches' },
  { quote: 'I finally have a field tool that thinks the way inspectors actually work.', name: 'Priya K.', role: 'Building Inspector, Western Sydney' },
] as const;

const TRUST_BADGES = ['AI-Powered', 'NSW Data', 'Field-Grade Tools', 'Bank-Level Security'] as const;

function SocialProof() {
  return (
    <section className={styles.socialProof}>
      <p className={styles.socialProofText}>
        Trusted by property professionals across NSW
      </p>

      <div className={styles.testimonials}>
        {TESTIMONIALS.map((t) => (
          <blockquote key={t.name} className={styles.testimonial}>
            <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
            <footer className={styles.testimonialAuthor}>
              <span className={styles.testimonialName}>{t.name}</span>
              <span className={styles.testimonialRole}>{t.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>

      <div className={styles.socialProofMarkers}>
        {TRUST_BADGES.map((badge, i) => (
          <span key={badge}>
            {i > 0 && <span className={styles.socialProofDot} />}
            <span className={styles.socialProofMarker}>{badge}</span>
          </span>
        ))}
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
        <h2 className={styles.sectionTitle}>Four steps to field intelligence</h2>
      </div>
      <div className={styles.stepsGrid}>
        <Step num="1" title="Point your camera" desc="Open GroundTruth, aim at any property, and tap the shutter. GPS and compass auto-tag the shot." time="2 seconds" />
        <Step num="2" title="AI does the heavy lifting" desc="AI analyses the photo against NSW spatial data — planning controls, hazards, comparable sales, and condition." time="Under 60 seconds" />
        <Step num="3" title="Review and refine" desc="Edit AI findings inline, add voice notes, and re-analyse with a tap. Your expertise stays in the loop." time="Instant" />
        <Step num="4" title="Act with confidence" desc="Share reports, track changes over time, verify valuations from the field, and explore neighbourhoods on foot." time="Ongoing" />
      </div>
      <p className={`${styles.stepsFootnote} fade-up`}>
        What used to take hours of desktop research now happens on-site, in minutes.
      </p>
    </section>
  );
}

function Step({ num, title, desc, time }: { num: string; title: string; desc: string; time?: string }) {
  return (
    <div className={`${styles.step} fade-up delay-${num}`}>
      <div className={styles.stepNum}>{num}</div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{desc}</p>
      {time && <span className={styles.stepTime}>{time}</span>}
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
        <div className={styles.footerLinks}>
          <a href="/pricing">Pricing</a>
          <span className={styles.footerDot} />
          <a href="/privacy">Privacy</a>
          <span className={styles.footerDot} />
          <a href="/terms">Terms</a>
        </div>
        <p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} GroundTruth AI Pty Ltd</p>
      </div>
    </footer>
  );
}

/* ── Waitlist form ─────────────── */

export function WaitlistForm({ className = '' }: { className?: string }) {
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
        aria-label="Email address for early access"
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
