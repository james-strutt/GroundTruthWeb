/**
 * Authenticated app shell — sidebar navigation + content area.
 * Responsive: sidebar on desktop, bottom nav on mobile.
 */

import { type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  Camera,
  ClipboardCheck,
  BarChart3,
  Eye,
  Footprints,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/properties', icon: <Building size={18} />, label: 'Properties' },
  { to: '/app/snaps', icon: <Camera size={18} />, label: 'Snaps' },
  { to: '/app/inspections', icon: <ClipboardCheck size={18} />, label: 'Inspections' },
  { to: '/app/appraisals', icon: <BarChart3 size={18} />, label: 'Appraisals' },
  { to: '/app/monitor', icon: <Eye size={18} />, label: 'Monitor' },
  { to: '/app/walks', icon: <Footprints size={18} />, label: 'Walks' },
];

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandText}>GroundTruth</span>
        </div>

        <div className={styles.navItems}>
          {NAV_ITEMS.map((item) => (
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

      <main className={styles.content}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
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
