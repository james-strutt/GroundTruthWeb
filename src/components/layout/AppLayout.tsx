/**
 * Authenticated app shell — sidebar navigation + content area.
 * Responsive: sidebar on desktop, bottom nav on mobile.
 */

import { type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AddressSearch } from './AddressSearch';
import {
  LayoutDashboard,
  FolderOpen,
  Building,
  Camera,
  ClipboardCheck,
  BarChart3,
  Eye,
  Footprints,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { findPropertyByAddress } from '../../services/propertyService';
import { DailyQuota } from '../shared/DailyQuota';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { InstallPrompt } from '../shared/InstallPrompt';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
  secondary?: boolean;
  proGated?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/directories', icon: <FolderOpen size={18} />, label: 'Directories' },
  { to: '/app/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/app/walks', icon: <Footprints size={18} />, label: 'Walks', proGated: true },
  { to: '/app/properties', icon: <Building size={18} />, label: 'Properties', secondary: true },
  { to: '/app/snaps', icon: <Camera size={18} />, label: 'Snaps', secondary: true },
  { to: '/app/inspections', icon: <ClipboardCheck size={18} />, label: 'Inspections', secondary: true },
  { to: '/app/appraisals', icon: <BarChart3 size={18} />, label: 'Appraisals', secondary: true, proGated: true },
  { to: '/app/monitor', icon: <Eye size={18} />, label: 'Monitor', secondary: true, proGated: true },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: '/app', icon: <LayoutDashboard size={22} />, label: 'Map', end: true },
  { to: '/app/directories', icon: <FolderOpen size={22} />, label: 'Directories' },
  { to: '/app/chat', icon: <MessageSquare size={22} />, label: 'Chat' },
  { to: '/app/properties', icon: <Building size={22} />, label: 'Properties' },
];

function useRouteAnnouncer() {
  const location = useLocation();
  const path = location.pathname.replace('/app/', '').replace('/app', 'Dashboard');
  const segment = path.split('/')[0] ?? 'Dashboard';
  const label = segment.charAt(0).toUpperCase() + segment.slice(1);
  return `Navigated to ${label}`;
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { isProOrAbove } = useSubscription();
  const navigate = useNavigate();
  const routeAnnouncement = useRouteAnnouncer();

  function handleAddressSelect(address: string) {
    void findPropertyByAddress(address).then((prop) => {
      if (prop) {
        navigate(`/app/properties/${prop.id}`);
      } else {
        navigate('/app/properties');
      }
    });
  }

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <nav className={styles.sidebar} aria-label="Main navigation">
        <div className={styles.brand}>
          <span className={styles.brandText}>GroundTruth</span>
        </div>

        <AddressSearch onSelect={handleAddressSelect} />

        <div className={styles.navItems}>
          {NAV_ITEMS.filter((item) => !item.secondary).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.proGated && !isProOrAbove && <span className={styles.proBadge}>Pro</span>}
            </NavLink>
          ))}

          <div className={styles.navDivider} />

          {NAV_ITEMS.filter((item) => item.secondary).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${styles.navItemSecondary} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.proGated && !isProOrAbove && <span className={styles.proBadge}>Pro</span>}
            </NavLink>
          ))}
        </div>

        <div className={styles.userSection}>
          <DailyQuota />
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email ?? ''}</span>
          </div>
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              `${styles.navItem} ${styles.navItemSecondary} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}><Settings size={18} /></span>
            <span className={styles.navLabel}>Settings</span>
          </NavLink>
          <button className={styles.signOutButton} onClick={() => void signOut()}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </nav>

      <header className={styles.mobileHeader}>
        <span className={styles.mobileHeaderBrand}>GroundTruth</span>
        <button
          className={styles.mobileHeaderAction}
          onClick={() => void signOut()}
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main id="main-content" className={styles.content}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </div>

      <InstallPrompt />

      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={`mobile-${item.label}`}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
            }
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
