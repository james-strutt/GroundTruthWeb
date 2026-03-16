/**
 * Authenticated app shell — sidebar navigation + content area.
 * Responsive: sidebar on desktop, bottom nav on mobile.
 */

import { type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
  secondary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/directories', icon: <FolderOpen size={18} />, label: 'Directories' },
  { to: '/app/walks', icon: <Footprints size={18} />, label: 'Walks' },
  { to: '/app/properties', icon: <Building size={18} />, label: 'Properties', secondary: true },
  { to: '/app/snaps', icon: <Camera size={18} />, label: 'Snaps', secondary: true },
  { to: '/app/inspections', icon: <ClipboardCheck size={18} />, label: 'Inspections', secondary: true },
  { to: '/app/appraisals', icon: <BarChart3 size={18} />, label: 'Appraisals', secondary: true },
  { to: '/app/monitor', icon: <Eye size={18} />, label: 'Monitor', secondary: true },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: '/app', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
  { to: '/app/directories', icon: <FolderOpen size={20} />, label: 'Directories' },
  { to: '/app/walks', icon: <Footprints size={20} />, label: 'Walks' },
  { to: '/app', icon: <User size={20} />, label: 'Profile' },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleAddressSelect(address: string) {
    navigate(`/app/properties/${encodeURIComponent(address.toLowerCase().trim())}`);
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
            </NavLink>
          ))}
        </div>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email ?? ''}</span>
          </div>
          <button className={styles.signOutButton} onClick={() => void signOut()}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </nav>

      <main id="main-content" className={styles.content}>
        <Outlet />
      </main>

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
