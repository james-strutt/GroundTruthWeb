import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '2rem', textAlign: 'center', background: 'var(--page-bg)',
    }}>
      <h1 style={{ fontFamily: 'var(--font-brand)', color: 'var(--text-primary)', fontSize: '3rem', marginBottom: '0.5rem' }}>
        404
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Page not found
      </p>
      <Link
        to="/app"
        style={{
          padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)',
          background: 'var(--terracotta)', color: '#fff', fontFamily: 'var(--font-body)',
          textDecoration: 'none',
        }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
