import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Pricing.module.css';

interface Tier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  href: string;
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Get started with basic property snaps and inspections.',
    features: [
      '5 snaps per month',
      '2 inspections per month',
      'AI condition analysis',
      'Map dashboard',
      'Walk mode (3 per month)',
    ],
    cta: 'Get started',
    href: '/login',
  },
  {
    name: 'Pro',
    monthlyPrice: 29,
    annualPrice: 24,
    description: 'Unlimited access for working property professionals.',
    features: [
      'Unlimited snaps & inspections',
      'Unlimited appraisals with comps',
      'Property monitoring & alerts',
      'Unlimited walk sessions',
      'Directory organisation',
      'DA overlay & spatial layers',
      'PDF report export',
      'Priority AI processing',
    ],
    cta: 'Start free trial',
    popular: true,
    href: '/login',
  },
  {
    name: 'Enterprise',
    monthlyPrice: -1,
    annualPrice: -1,
    description: 'For firms and agencies needing team features and branding.',
    features: [
      'Everything in Pro',
      'Team workspaces & sharing',
      'Custom report branding',
      'White-label reports',
      'Bulk CSV/Excel export',
      'API access',
      'Dedicated support',
      'SSO integration',
    ],
    cta: 'Contact us',
    href: 'mailto:hello@groundtruth.com.au',
  },
];

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. You can cancel your subscription at any time from your account settings. You\'ll retain access until the end of your billing period.',
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer: 'Your data is never deleted. If you downgrade to Free, you\'ll still see all your existing snaps, inspections, and appraisals — you just won\'t be able to create new ones beyond the free limits.',
  },
  {
    question: 'Is there a team plan?',
    answer: 'Enterprise includes team workspaces where you can share directories and collaborate. Contact us to discuss your team\'s needs and pricing.',
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes — Pro includes a 14-day free trial with full access. No credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards via Stripe. Enterprise customers can pay by invoice.',
  },
];

function PricingCard({ tier, annual }: { tier: Tier; annual: boolean }) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const isEnterprise = price < 0;
  const showSaveBadge = annual && tier.popular;

  return (
    <div className={`${styles.card} ${tier.popular ? styles.cardPopular : ''}`}>
      {tier.popular && <span className={styles.popularBadge}>Most popular</span>}
      <span className={styles.tierName}>{tier.name}</span>
      <div className={styles.priceRow}>
        <span className={styles.price}>{isEnterprise ? 'Custom' : price === 0 ? '$0' : `$${price}`}</span>
        {!isEnterprise && price > 0 && <span className={styles.period}>/mo</span>}
        {showSaveBadge && <span className={styles.saveBadge}>2 months free</span>}
      </div>
      <p className={styles.cardDesc}>{tier.description}</p>
      <ul className={styles.features}>
        {tier.features.map((f) => (
          <li key={f}>
            <Check size={16} color="var(--accent)" />
            {f}
          </li>
        ))}
      </ul>
      {tier.href.startsWith('mailto:') ? (
        <a href={tier.href} className={`${styles.cardCta} ${styles.ctaSecondary}`}>{tier.cta}</a>
      ) : (
        <Link to={tier.href} className={`${styles.cardCta} ${tier.popular ? styles.ctaPrimary : styles.ctaSecondary}`}>
          {tier.cta}
        </Link>
      )}
    </div>
  );
}

function FaqItem({ entry }: { entry: FaqEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.faqItem}>
      <button className={styles.faqQuestion} onClick={() => setOpen(!open)} aria-expanded={open}>
        {entry.question}
        <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <p className={styles.faqAnswer}>{entry.answer}</p>}
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { isAuthenticated } = useAuth();
  const backTo = isAuthenticated ? '/app' : '/';
  const backLabel = isAuthenticated ? 'Back to dashboard' : 'Back to home';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={backTo} className={styles.backLink}>
          <ArrowLeft size={16} /> {backLabel}
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>Simple, transparent pricing</h1>
          <p className={styles.subtitle}>
            Start free. Upgrade when you need unlimited access to AI analysis, appraisals, monitoring, and team features.
          </p>
          <div className={styles.toggle}>
            <span className={`${styles.toggleLabel} ${!annual ? styles.toggleLabelActive : ''}`}>Monthly</span>
            <button
              className={styles.toggleSwitch}
              data-active={annual}
              onClick={() => setAnnual(!annual)}
              aria-label="Toggle annual billing"
            >
              <span className={styles.toggleKnob} />
            </button>
            <span className={`${styles.toggleLabel} ${annual ? styles.toggleLabelActive : ''}`}>Annual</span>
          </div>
        </header>

        <div className={styles.cards}>
          {TIERS.map((tier) => (
            <PricingCard key={tier.name} tier={tier} annual={annual} />
          ))}
        </div>

        <section className={styles.faq}>
          <h2 className={styles.faqTitle}>Frequently asked questions</h2>
          {FAQ_ITEMS.map((entry) => (
            <FaqItem key={entry.question} entry={entry} />
          ))}
        </section>
      </div>
    </div>
  );
}
