import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Download, Trash2, Shield, FileText, Loader2, Settings as SettingsIcon, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../supabaseClient';
import { buildUserDataExport } from '../services/userDataExportService';
import { PageHeader } from '../components/shared/PageHeader';
import { ConfirmModal } from '../components/shared/ConfirmModal';

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? supabaseKey}`,
    'apikey': supabaseKey,
  };
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { tier, isProOrAbove } = useSubscription();
  const toast = useToast();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleExportData() {
    if (!supabase || !user) {
      toast.error('You must be signed in to export your data.');
      return;
    }
    setIsExporting(true);
    try {
      const payload = await buildUserDataExport(supabase, user);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `groundtruth-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
      const headers = await getAuthHeaders();
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Deletion failed');
      }

      toast.success('Account deleted. Goodbye.');
      await signOut();
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div style={{ padding: 'var(--space-lg)' }}>
      <PageHeader icon={<SettingsIcon size={22} />} title="Settings" />

      {/* Profile */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <User size={16} />
          <h3 style={sectionTitleStyle}>Profile</h3>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Email</span>
          <span style={valueStyle}>{user?.email ?? '—'}</span>
        </div>
        <div style={{ ...fieldStyle, marginTop: '0.5rem' }}>
          <span style={labelStyle}>Subscription</span>
          <span style={{ ...valueStyle, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {isProOrAbove && <Crown size={13} style={{ color: 'var(--accent)' }} />}
            <span style={isProOrAbove ? { color: 'var(--accent)', fontWeight: 600 } : undefined}>
              {tier === 'enterprise' ? 'Enterprise' : tier === 'pro' ? 'Pro' : 'Free'}
            </span>
            {tier === 'free' && (
              <a href="/pricing" style={{ marginLeft: '0.5rem', color: 'var(--accent)', fontSize: '0.75rem', textDecoration: 'none' }}>
                Upgrade
              </a>
            )}
          </span>
        </div>
      </section>

      {/* Subscription */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Crown size={16} />
          <h3 style={sectionTitleStyle}>Subscription</h3>
        </div>
        <p style={descStyle}>
          {isProOrAbove
            ? `You're on the ${tier === 'enterprise' ? 'Enterprise' : 'Pro'} plan. View plan details and compare features.`
            : 'You\'re on the Free plan. Upgrade to unlock unlimited snaps, appraisals, monitoring, and more.'}
        </p>
        <Link to="/pricing" style={buttonStyle}>
          <Crown size={14} /> {isProOrAbove ? 'View plans' : 'View plans & upgrade'}
        </Link>
      </section>

      {/* Data */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Download size={16} />
          <h3 style={sectionTitleStyle}>Your Data</h3>
        </div>
        <p style={descStyle}>
          Download all your GroundTruth data (snaps, inspections, appraisals, walks, properties) as a JSON file.
        </p>
        <button style={buttonStyle} onClick={() => void handleExportData()} disabled={isExporting}>
          {isExporting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Exporting...</> : <><Download size={14} /> Export my data</>}
        </button>
      </section>

      {/* Legal */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <FileText size={16} />
          <h3 style={sectionTitleStyle}>Legal</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/privacy" style={linkStyle}><Shield size={14} /> Privacy Policy</Link>
          <Link to="/terms" style={linkStyle}><FileText size={14} /> Terms of Service</Link>
        </div>
      </section>

      {/* Danger Zone */}
      <section style={{ ...sectionStyle, borderColor: 'rgba(153, 27, 27, 0.2)' }}>
        <div style={sectionHeaderStyle}>
          <Trash2 size={16} style={{ color: 'var(--brick)' }} />
          <h3 style={{ ...sectionTitleStyle, color: 'var(--brick)' }}>Danger Zone</h3>
        </div>
        <p style={descStyle}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button style={dangerButtonStyle} onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
          <Trash2 size={14} /> Delete my account
        </button>
      </section>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete account?"
          message="This will permanently delete your account and all your data (snaps, inspections, appraisals, walks, directories, properties). This cannot be undone."
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete everything'}
          variant="danger"
          onConfirm={() => void handleDeleteAccount()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-lg)',
  marginBottom: 'var(--space-lg)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.75rem',
  color: 'var(--text-primary)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.95rem',
  margin: 0,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
};

const valueStyle: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-data)',
};

const descStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
  marginBottom: '0.75rem',
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: 'rgba(153, 27, 27, 0.3)',
  background: 'rgba(153, 27, 27, 0.1)',
  color: '#dc2626',
};

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem',
  textDecoration: 'none',
};
