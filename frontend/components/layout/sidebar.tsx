'use client';

import { LayoutDashboard, CheckSquare, Shield, LogOut, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/components/providers/theme-provider';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
];

const S = {
  aside: {
    width: 220, flexShrink: 0, height: '100vh', position: 'sticky' as const, top: 0,
    display: 'flex', flexDirection: 'column' as const,
    background: 'hsl(var(--surface))',
    borderRight: '1px solid hsl(var(--border))',
  },
  logoArea: {
    padding: '18px 16px 16px', borderBottom: '1px solid hsl(var(--border))',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoMark: {
    width: 28, height: 28, borderRadius: 7,
    background: 'hsl(var(--accent))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: { fontSize: 14, fontWeight: 600, color: 'hsl(var(--text))', letterSpacing: '-0.01em' },
  nav: { flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column' as const, gap: 2 },
  navLink: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', borderRadius: 7, fontSize: 13, fontWeight: 500,
    textDecoration: 'none', transition: 'background .12s, color .12s',
    background: active ? 'hsl(var(--surface-elevated))' : 'transparent',
    color: active ? 'hsl(var(--text))' : 'hsl(var(--text-muted))',
  }),
  bottom: { padding: 8, borderTop: '1px solid hsl(var(--border))' },
  userBox: {
    padding: '8px 10px', borderRadius: 7, marginBottom: 4,
    background: 'hsl(var(--surface-elevated))',
  },
  btn: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
    borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    background: 'transparent', color: 'hsl(var(--text-muted))', width: '100%',
    textAlign: 'left' as const, fontFamily: 'inherit', transition: 'background .12s, color .12s',
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside style={S.aside}>
      <div style={S.logoArea}>
        <div style={S.logoMark}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 14H2L8 2Z" fill="white" />
          </svg>
        </div>
        <span style={S.logoText}>TaskFlow</span>
      </div>

      <nav style={S.nav}>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} style={S.navLink(pathname === href)}>
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
        {user?.role === 'admin' && (
          <Link href="/admin" style={S.navLink(pathname === '/admin')}>
            <Shield size={15} strokeWidth={1.75} />
            Admin
          </Link>
        )}
      </nav>

      <div style={S.bottom}>
        {user && (
          <div style={S.userBox}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--text))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </p>
            <p style={{ fontSize: 11, color: 'hsl(var(--text-dim))', marginTop: 1, textTransform: 'capitalize' }}>{user.role}</p>
          </div>
        )}

        <button id="theme-toggle" onClick={toggleTheme} style={S.btn}
          onMouseEnter={e => { (e.currentTarget).style.background = 'hsl(var(--surface-elevated))'; (e.currentTarget).style.color = 'hsl(var(--text))'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'hsl(var(--text-muted))'; }}
        >
          {theme === 'dark' ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button id="logout-btn" onClick={logout} style={S.btn}
          onMouseEnter={e => { (e.currentTarget).style.background = 'hsl(var(--danger) / 0.08)'; (e.currentTarget).style.color = 'hsl(var(--danger))'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'hsl(var(--text-muted))'; }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  );
}
