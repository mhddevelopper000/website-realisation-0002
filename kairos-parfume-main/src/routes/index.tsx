import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { listActiveProducts } from '@/lib/products.functions';
import { listCategories } from '@/lib/categories.functions';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { formatDZD } from '@/data/algeria';
import { Truck, ShieldCheck, PackageCheck, Phone } from 'lucide-react';

const productsQuery = queryOptions({
  queryKey: ['active-products'],
  queryFn: () => listActiveProducts(),
});
const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Fragrance & Essencia — Parfums de niche · Algérie' },
      { name: 'description', content: "Essences premium et parfums de niche. Livraison dans toute l'Algérie · Paiement à la livraison (COD)." },
      { name: 'keywords', content: 'parfum algerie, parfum de niche, fragrance essencia, parfum femme algerie, parfum homme algerie, livraison parfum dz' },
      { property: 'og:title', content: 'Fragrance & Essencia — Parfums de niche · Algérie' },
      { property: 'og:description', content: 'Essences premium. Livraison dans toute l\'Algérie, paiement à la livraison.' },
      { property: 'og:url', content: '/' },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'canonical', href: '/' }],
    scripts: [{
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Fragrance & Essencia',
        inLanguage: 'fr-DZ',
      }),
    }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]);
  },
  component: Home,
  errorComponent: () => <div className="p-12 text-center">Erreur de chargement.</div>,
  notFoundComponent: () => <div className="p-12 text-center">Introuvable.</div>,
});

function Home() {
  const { data: pd } = useSuspenseQuery(productsQuery);
  const { data: cd } = useSuspenseQuery(categoriesQuery);
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!active) return pd.products;
    const cat = cd.categories.find((c) => c.slug === active);
    if (!cat) return pd.products;
    return pd.products.filter((p) => (p as { category_id?: string | null }).category_id === cat.id);
  }, [pd.products, cd.categories, active]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Catégories — directement en haut */}
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-6">
          <p className="eyebrow mr-4 hidden md:block">Catégories</p>
          <button
            onClick={() => setActive(null)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
              !active ? 'border-ink bg-ink text-background' : 'border-border text-muted-foreground hover:border-ink/40 hover:text-ink'
            }`}
          >
            Tout
          </button>
          {cd.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.slug)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
                active === c.slug ? 'border-ink bg-ink text-background' : 'border-border text-muted-foreground hover:border-ink/40 hover:text-ink'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Grille produits — direct */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">La boutique</p>
            <h1 className="font-display text-3xl text-ink md:text-4xl">
              {active ? cd.categories.find((c) => c.slug === active)?.name : 'Toutes nos essences'}
            </h1>
          </div>
          <p className="hidden text-xs uppercase tracking-widest text-muted-foreground md:block">
            {filtered.length} produit{filtered.length > 1 ? 's' : ''}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-16 text-center text-muted-foreground">
            Aucun produit dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10">
            {filtered.map((p) => {
              const variants = (p.variants as Array<{ label: string; price: number; old_price?: number | null }>) || [];
              const v = variants[0];
              const discount = v?.old_price && v.old_price > v.price
                ? Math.round(((v.old_price - v.price) / v.old_price) * 100)
                : 0;
              return (
                <Link key={p.id} to="/produits/$slug" params={{ slug: p.slug }} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-7xl text-accent/20">{p.name.charAt(0)}</span>
                      </div>
                    )}
                    {p.is_bestseller && (
                      <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[0.6rem] uppercase tracking-widest text-background">
                        Best-seller
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="absolute right-3 top-3 bg-accent px-2 py-1 text-[0.65rem] font-medium text-background">
                        −{discount}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="font-display text-lg text-ink">{p.name}</h3>
                    {p.tagline && <p className="text-xs text-muted-foreground">{p.tagline}</p>}
                    {v && (
                      <p className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-sm font-medium text-ink">{formatDZD(v.price)}</span>
                        {v.old_price && v.old_price > v.price && (
                          <span className="text-xs text-muted-foreground line-through">{formatDZD(v.old_price)}</span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust bar — déplacée plus bas, plus discrète */}
      <section className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
          {[
            { Icon: Truck, t: 'Livraison 69 wilayas', s: 'Yalidine · Zr Express' },
            { Icon: PackageCheck, t: 'Vérification du colis', s: 'Avant paiement' },
            { Icon: ShieldCheck, t: 'Paiement à la livraison', s: 'Aucun risque' },
            { Icon: Phone, t: 'Service client', s: 'Lun–Sam · 9h–19h' },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <div className="text-sm font-medium text-ink">{t}</div>
                <div className="text-xs text-muted-foreground">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
