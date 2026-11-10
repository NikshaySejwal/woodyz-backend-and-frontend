import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t-4 border-charcoal pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link href="/" id="footer-logo" className="flex items-center gap-3 no-underline">
              <div className="w-12 h-12 bg-cedar border-2 border-charcoal rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#3A322B]">
                <iconify-icon icon="ph:horse-bold" class="text-white text-3xl"></iconify-icon>
              </div>
              <span className="font-display text-4xl font-black tracking-tighter text-charcoal">WOODYZ</span>
            </Link>
            <p className="text-charcoal/60 font-bold leading-relaxed">
              Wooden toys and products for curious little explorers.
            </p>
            <div className="flex gap-4">
              <a href="mailto:hello@woodyz.in" id="footer-social-ig" className="w-12 h-12 bg-cream border-2 border-charcoal rounded-2xl flex items-center justify-center btn-pop" aria-label="Email WOODYZ">
                <iconify-icon icon="ph:envelope-bold" class="text-xl"></iconify-icon>
              </a>
              <Link href="/products" id="footer-social-pi" className="w-12 h-12 bg-cream border-2 border-charcoal rounded-2xl flex items-center justify-center btn-pop" aria-label="Browse the product range">
                <iconify-icon icon="ph:storefront-bold" class="text-xl"></iconify-icon>
              </Link>
              <Link href="/ai" id="footer-social-fb" className="w-12 h-12 bg-cream border-2 border-charcoal rounded-2xl flex items-center justify-center btn-pop" aria-label="Read about the brand">
                <iconify-icon icon="ph:info-bold" class="text-xl"></iconify-icon>
              </Link>
            </div>
          </div>

          {/* Shop Collection */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-cedar">Shop Collection</h4>
            <ul className="space-y-4 font-black text-sm uppercase tracking-widest list-none p-0">
              <li><Link href="/products" id="foot-shop-1" className="hover:text-cedar text-charcoal no-underline">All Products</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-cedar">About</h4>
            <ul className="space-y-4 font-black text-sm uppercase tracking-widest list-none p-0">
              <li><Link href="/ai" id="foot-story-1" className="hover:text-cedar text-charcoal no-underline">About WOODYZ</Link></li>
              <li><Link href="/manufacturing" id="foot-story-manufacturing" className="hover:text-cedar text-charcoal no-underline">Custom manufacturing</Link></li>
              <li><Link href="/privacy-policy" id="foot-story-3" className="hover:text-cedar text-charcoal no-underline">Privacy Policy</Link></li>
              <li><Link href="/sitemap" id="foot-story-4" className="hover:text-cedar text-charcoal no-underline">Site Map</Link></li>
              <li><Link href="/terms-and-conditions" id="foot-story-5" className="hover:text-cedar text-charcoal no-underline">Terms</Link></li>
            </ul>
          </div>

          {/* Studio Info */}
          <div className="bg-cream border-4 border-charcoal rounded-[40px] p-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-cedar">Contact WOODYZ</h4>
            <p className="font-black text-sm mb-4">WOODYZ Studio<br />Bengaluru, India</p>
            <a href="mailto:hello@woodyz.in" className="font-black text-sm text-sage no-underline hover:underline">hello@woodyz.in</a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t-2 border-charcoal/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">&copy; 2025 WOODYZ. Handcrafted memories for curious little minds.</p>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest opacity-40">
            <Link href="/privacy-policy" id="foot-legal-1" className="hover:opacity-100 transition-opacity text-charcoal no-underline">Privacy Policy</Link>
            <Link href="/terms-and-conditions" id="foot-legal-2" className="hover:opacity-100 transition-opacity text-charcoal no-underline">Terms and Conditions</Link>
            <Link href="/sitemap" id="foot-legal-3" className="hover:opacity-100 transition-opacity text-charcoal no-underline">Site Map</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
