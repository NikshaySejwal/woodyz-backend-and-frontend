import Link from 'next/link';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import LoadingScreen from '../ui/LoadingScreen';

const NAV_ITEMS = [
  { href: '/admin', key: 'inventory', icon: 'ph:cube-bold', label: 'Inventory' },
  { href: '/admin/analytics', key: 'analytics', icon: 'ph:chart-line-up-bold', label: 'Analytics' },
  { href: '/admin/support', key: 'support', icon: 'ph:chat-circle-dots-bold', label: 'Support' },
  { href: '/admin/manufacturing-quotes', key: 'manufacturing-quotes', icon: 'ph:factory-bold', label: 'Manufacturing Quotes' },
  { href: '/admin/users', key: 'users', icon: 'ph:users-bold', label: 'Users' },
  { href: '/admin/coupons', key: 'coupons', icon: 'ph:ticket-bold', label: 'Coupons' },
  { href: '/admin/config', key: 'config', icon: 'ph:gear-bold', label: 'Config' },
];

/**
 * Shared layout wrapper for all admin pages.
 * Handles admin auth guard, loading state, and the sidebar navigation.
 * Eliminates ~180 lines of duplicated sidebar code (60 lines × 3 pages).
 *
 * @param {string} activeTab - Which nav item to highlight ('inventory' | 'analytics' | 'support')
 * @param {string} loadingMessage - Custom loading text
 * @param {boolean} isReady - Whether page-specific data is loaded
 * @param {React.ReactNode} children - Page content
 */
export default function AdminLayout({
  activeTab,
  loadingMessage = 'Securing Dashboard...',
  isReady = true,
  children,
}) {
  const { isReady: authReady } = useAuthGuard({ requiredRole: 'ADMIN', redirectTo: '/' });

  if (!authReady || !isReady) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r-4 border-charcoal p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-cedar border-2 border-charcoal rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#3A322B]">
            <iconify-icon icon="ph:gear-six-bold" class="text-white text-xl"></iconify-icon>
          </div>
          <span className="font-display text-2xl font-black tracking-tighter">
            WOODYZ Admin
          </span>
        </div>

        <nav className="flex-grow space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeTab;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-4 p-4 border-2 rounded-2xl font-black text-xs uppercase tracking-widest no-underline transition-all ${
                  isActive
                    ? 'bg-cedar text-white border-charcoal shadow-[4px_4px_0px_0px_#3A322B]'
                    : 'border-transparent text-charcoal/60 hover:bg-cream hover:border-charcoal hover:text-charcoal'
                }`}
              >
                <iconify-icon icon={item.icon} class="text-xl"></iconify-icon>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t-2 border-charcoal/5">
          <Link
            href="/"
            className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-charcoal/40 hover:text-cedar no-underline"
          >
            <iconify-icon icon="ph:arrow-left-bold"></iconify-icon>
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 lg:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
