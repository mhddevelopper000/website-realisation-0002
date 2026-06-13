import { Link } from '@tanstack/react-router';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl tracking-wide text-ink">
          Fragrance <span className="text-accent">&</span> Essencia
        </Link>
        <nav className="hidden gap-8 text-xs uppercase tracking-[0.2em] text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: 'text-foreground' }}>
            Boutique
          </Link>
          <Link to="/contact" className="hover:text-foreground" activeProps={{ className: 'text-foreground' }}>
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
