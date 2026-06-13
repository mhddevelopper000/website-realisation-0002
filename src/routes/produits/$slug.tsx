import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { getProductBySlug, trackProductClick } from '@/lib/products.functions';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CodOrderForm } from '@/components/CodOrderForm';
import { formatDZD } from '@/data/algeria';
import { useCart } from '@/lib/cart';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute('/produits/$slug')({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!res.product) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — Fragrance & Essencia` : 'Parfum — Fragrance & Essencia';
    const desc = p?.tagline || p?.description?.slice(0, 155) || 'Parfum de niche premium · livraison en Algérie · paiement à la livraison.';
    const url = `/produits/${params.slug}`;
    const variants = (p?.variants as Array<{ price: number }> | undefined) ?? [];
    const price = variants[0]?.price;
    return {
      meta: [
        { title }, { name: 'description', content: desc },
        { property: 'og:title', content: title }, { property: 'og:description', content: desc },
        { property: 'og:url', content: url }, { property: 'og:type', content: 'product' },
        ...(p?.image_url ? [
          { property: 'og:image', content: p.image_url },
          { name: 'twitter:image', content: p.image_url },
        ] : []),
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: p ? [{
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: desc,
          brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
          image: p.image_url ?? undefined,
          offers: price ? {
            '@type': 'Offer',
            priceCurrency: 'DZD',
            price: String(price),
            availability: 'https://schema.org/InStock',
          } : undefined,
        }),
      }] : [],
    };
  },
  component: ProductPage,
  errorComponent: () => <div className="p-12 text-center">Erreur de chargement.</div>,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <p className="font-display text-3xl">Parfum introuvable</p>
      <Link to="/" className="mt-4 inline-block text-sm underline">Retour à la collection</Link>
    </div>
  ),
});

type Media = { id: string; url: string; media_type: 'image' | 'video'; sort_order: number; is_cover: boolean };

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const p = data.product!;
  const variants = (p.variants as Array<{ label: string; price: number; old_price?: number | null }>) ?? [];
  const rawMedia = (p.product_media as Media[] | undefined) ?? [];
  const media: Media[] = rawMedia.length > 0
    ? [...rawMedia].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order)
    : p.image_url
      ? [{ id: 'fallback', url: p.image_url, media_type: 'image', sort_order: 0, is_cover: true }]
      : [];

  const cart = useCart();
  const trackFn = useServerFn(trackProductClick);
  useEffect(() => {
    const key = `tracked_${p.id}`;
    if (typeof window === 'undefined' || sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    let sid = localStorage.getItem('fe_sid');
    if (!sid) { sid = Math.random().toString(36).slice(2, 14); localStorage.setItem('fe_sid', sid); }
    trackFn({ data: { productId: p.id, sessionId: sid } }).catch(() => {});
  }, [p.id, trackFn]);

  const [idx, setIdx] = useState(0);
  const current = media[idx];
  const prev = () => setIdx((i) => (i - 1 + media.length) % media.length);
  const next = () => setIdx((i) => (i + 1) % media.length);

  // Horizontal-only swipe — vertical scrolling stays free
  const touchRef = useRef<{ x: number; y: number; locked: 'h' | 'v' | null } | null>(null);
  const touchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, locked: null };
  };
  const touchMove = (e: React.TouchEvent) => {
    const s = touchRef.current;
    if (!s || s.locked) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - s.x);
    const dy = Math.abs(t.clientY - s.y);
    if (dx < 8 && dy < 8) return;
    s.locked = dx > dy ? 'h' : 'v';
  };
  const touchEnd = (e: React.TouchEvent) => {
    const s = touchRef.current;
    if (s && s.locked === 'h') {
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    }
    touchRef.current = null;
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <Link to="/" className="eyebrow mb-8 inline-block hover:text-foreground">← Collection</Link>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div
              className="relative aspect-[3/4] touch-pan-y select-none overflow-hidden bg-secondary"
              onTouchStart={touchStart}
              onTouchMove={touchMove}
              onTouchEnd={touchEnd}
            >
              {current ? (
                current.media_type === 'video' ? (
                  <video src={current.url} controls className="h-full w-full object-contain" />
                ) : (
                  <img src={current.url} alt={p.name} className="h-full w-full object-contain p-4" />
                )
              ) : (
                <div className="flex h-full items-center justify-center font-display text-[10rem] text-accent/20">
                  {p.name.charAt(0)}
                </div>
              )}
              {media.length > 1 && (
                <>
                  <button onClick={prev} aria-label="Précédent"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow hover:bg-background">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={next} aria-label="Suivant"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow hover:bg-background">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs">
                    {idx + 1} / {media.length}
                  </div>
                </>
              )}
            </div>
            {media.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {media.map((m, i) => (
                  <button key={m.id} onClick={() => setIdx(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden border-2 bg-secondary ${i === idx ? 'border-ink' : 'border-transparent'}`}>
                    {m.media_type === 'video' ? (
                      <div className="flex h-full w-full items-center justify-center bg-secondary text-xs">▶</div>
                    ) : (
                      <img src={m.url} alt="" className="h-full w-full object-contain p-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {p.brand && <p className="eyebrow mb-2">{p.brand}</p>}
            {p.is_bestseller && <p className="eyebrow mb-3 text-accent">Best-seller</p>}
            <h1 className="font-display text-4xl text-ink md:text-5xl">{p.name}</h1>
            {p.tagline && <p className="mt-2 text-base italic text-muted-foreground">{p.tagline}</p>}

            {variants[0] && (
              <p className="mt-6 font-display text-3xl text-ink">
                {formatDZD(variants[0].price)}
                {variants[0].old_price ? (
                  <span className="ml-3 text-base text-muted-foreground line-through">{formatDZD(variants[0].old_price)}</span>
                ) : null}
              </p>
            )}

            {variants[0] && (
              <button
                type="button"
                onClick={() => {
                  cart.add({
                    productId: p.id, slug: p.slug, name: p.name, image: p.image_url ?? null,
                    variantLabel: variants[0].label, price: variants[0].price,
                  });
                  toast.success('Ajouté au panier', { description: `${p.name} · ${variants[0].label}` });
                }}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-sm border border-ink bg-background px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-ink transition hover:bg-ink hover:text-background"
              >
                <ShoppingBag className="h-4 w-4" /> Ajouter au panier
              </button>
            )}

            {p.description && <p className="mt-6 text-sm leading-relaxed text-foreground/80">{p.description}</p>}

            <div className="mt-10 space-y-4">
              {[
                { label: 'Notes de tête', notes: p.notes_head },
                { label: 'Notes de cœur', notes: p.notes_heart },
                { label: 'Notes de fond', notes: p.notes_base },
              ].map((row) =>
                row.notes && row.notes.length > 0 ? (
                  <div key={row.label} className="border-t border-border pt-4">
                    <p className="eyebrow mb-2">{row.label}</p>
                    <p className="text-sm text-foreground">{row.notes.join(' · ')}</p>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow mb-3 text-center">Commande express</p>
            <h2 className="mb-8 text-center font-display text-3xl text-ink md:text-4xl">Acheter maintenant</h2>
            <CodOrderForm productId={p.id} variants={variants} />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
