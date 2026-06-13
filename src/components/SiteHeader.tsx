import { Link } from '@tanstack/react-router';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl tracking-wide text-ink">
          Fragrance <span className="text-accent">&</span> Essencia
        </Link>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/" className="hidden hover:text-foreground md:inline" activeOptions={{ exact: true }} activeProps={{ className: 'text-foreground' }}>
            Boutique
          </Link>
          <Link to="/contact" className="hidden hover:text-foreground md:inline" activeProps={{ className: 'text-foreground' }}>
            Contact
          </Link>
          <Link to="/panier" className="relative inline-flex items-center gap-2 text-ink hover:opacity-80" activeProps={{ className: 'text-foreground' }} aria-label="Panier">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-background">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
