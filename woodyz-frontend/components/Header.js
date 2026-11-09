import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount, clearCart } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-cream border-b-4 border-charcoal px-6 lg:px-12 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" id="nav-logo-link" className="flex items-center gap-3 group no-underline" aria-label="WOODYZ Home">
          <div className="w-12 h-12 bg-cedar border-2 border-charcoal rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[4px_4px_0px_0px_#3A322B]">
            <iconify-icon icon="ph:horse-bold" class="text-white text-3xl"></iconify-icon>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl font-black leading-none tracking-tighter text-charcoal">WOODYZ</span>
            <span className="text-[8px] font-bold tracking-[0.3em] uppercase opacity-60">Sustainable Play</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-10 font-black text-xs uppercase tracking-widest list-none">
          <li>
            <Link href="/products" id="nav-shop-all" className="hover:text-cedar transition-colors border-b-2 border-transparent hover:border-cedar pb-1 no-underline text-charcoal">
              Shop All
            </Link>
          </li>
          <li>
            <Link href="/#categories" id="nav-categories" className="hover:text-cedar transition-colors border-b-2 border-transparent hover:border-cedar pb-1 no-underline text-charcoal">
              Categories
            </Link>
          </li>
          <li>
            <Link href="/#impact" id="nav-about" className="hover:text-cedar transition-colors border-b-2 border-transparent hover:border-cedar pb-1 no-underline text-charcoal">
              Impact
            </Link>
          </li>
          <li>
            <Link href="/ai" id="nav-journal" className="hover:text-cedar transition-colors border-b-2 border-transparent hover:border-cedar pb-1 no-underline text-charcoal">
              Brand Info
            </Link>
          </li>
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Search products">
            <iconify-icon icon="ph:magnifying-glass-bold" class="text-xl"></iconify-icon>
          </button>
          <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative no-underline text-charcoal" aria-label={`Shopping cart, ${cartCount} items`}>
            <iconify-icon icon="ph:shopping-bag-bold" class="text-xl"></iconify-icon>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-maple border-2 border-charcoal w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">{cartCount}</span>
            )}
          </Link>
          {user ? (
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2 hover:text-cedar transition-colors no-underline text-charcoal">
                <div className="w-8 h-8 bg-maple rounded-lg border-2 border-charcoal flex items-center justify-center text-white text-xs font-black">
                  {user.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="font-bold text-[10px] uppercase tracking-widest">
                  {user.username || 'Explorer'}
                </span>
              </Link>
              <button
                onClick={() => {
                  clearCart();
                  logout();
                }}
                className="btn-pop bg-white text-charcoal border-2 border-charcoal px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest no-underline"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              id="nav-cta-btn"
              className="hidden sm:block btn-pop bg-cedar text-white border-2 border-charcoal px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest no-underline"
            >
              Join Club
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <iconify-icon icon={mobileMenuOpen ? 'ph:x-bold' : 'ph:list-bold'} class="text-xl"></iconify-icon>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t-2 border-charcoal/10 pt-4">
          <ul className="flex flex-col gap-4 font-black text-sm uppercase tracking-widest list-none p-0">
            <li>
              <Link href="/products" className="block py-2 hover:text-cedar transition-colors text-charcoal no-underline" onClick={() => setMobileMenuOpen(false)}>
                Shop All
              </Link>
            </li>
            <li>
              <Link href="/#categories" className="block py-2 hover:text-cedar transition-colors text-charcoal no-underline" onClick={() => setMobileMenuOpen(false)}>
                Categories
              </Link>
            </li>
            <li>
              <Link href="/#impact" className="block py-2 hover:text-cedar transition-colors text-charcoal no-underline" onClick={() => setMobileMenuOpen(false)}>
                Impact
              </Link>
            </li>
            <li>
              <Link href="/ai" className="block py-2 hover:text-cedar transition-colors text-charcoal no-underline" onClick={() => setMobileMenuOpen(false)}>
                Brand Info
              </Link>
            </li>
            <li>
              <Link href="/auth/register" className="inline-block mt-2 btn-pop bg-cedar text-white border-2 border-charcoal px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest no-underline" onClick={() => setMobileMenuOpen(false)}>
                Join Club
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
