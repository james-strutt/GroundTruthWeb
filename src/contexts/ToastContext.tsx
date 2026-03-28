import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error'), [addToast]),
    info: useCallback((msg: string) => addToast(msg, 'info'), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const COLOUR_MAP = {
  success: { bg: 'rgba(63, 98, 18, 0.15)', border: 'rgba(63, 98, 18, 0.3)', icon: '#65a30d' },
  error: { bg: 'rgba(153, 27, 27, 0.15)', border: 'rgba(153, 27, 27, 0.3)', icon: '#dc2626' },
  info: { bg: 'rgba(168, 162, 158, 0.15)', border: 'rgba(168, 162, 158, 0.3)', icon: '#a8a29e' },
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICON_MAP[toast.type];
  const colours = COLOUR_MAP[toast.type];

  return (
    <div
      role="alert"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem',
        background: colours.bg, border: `1px solid ${colours.border}`,
        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)', fontSize: '0.85rem', pointerEvents: 'auto',
        backdropFilter: 'blur(12px)', minWidth: '280px', maxWidth: '420px',
        animation: 'fadeUp 0.3s ease both',
      }}
    >
      <Icon size={16} style={{ color: colours.icon, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: '2px', flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
