import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { getOrderByNumber } from '@/lib/products.functions';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { formatDZD } from '@/data/algeria';
import { CheckCircle2 } from 'lucide-react';

const orderQuery = (orderNumber: string) =>
  queryOptions({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrderByNumber({ data: { orderNumber } }),
  });

export const Route = createFileRoute('/confirmation/$orderNumber')({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(orderQuery(params.orderNumber));
    if (!res.order) throw notFound();
    return res;
  },
  head: () => ({
    meta: [
      { title: 'Commande confirmée — Fragrance & Essencia' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Confirmation,
  errorComponent: () => <div className="p-12 text-center">Erreur.</div>,
  notFoundComponent: () => <div className="p-12 text-center">Commande introuvable.</div>,
});

function Confirmation() {
  const { data } = useSuspenseQuery(orderQuery(Route.useParams().orderNumber));
  const o = data.order!;
  const items = o.order_items ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
          <p className="eyebrow mt-6">Commande confirmée</p>
          <h1 className="mt-3 font-display text-4xl text-ink">Merci pour votre confiance.</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Un conseiller va vous appeler dans les prochaines heures pour confirmer votre adresse et lancer l'expédition.
          </p>
        </div>

        <div className="mt-10 rounded-sm border border-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="eyebrow">N° de commande</span>
            <span className="font-mono text-sm text-ink">{o.order_number}</span>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Nom" value={o.full_name} />
            <Row label="Téléphone" value={o.phone} />
            <Row label="Wilaya" value={o.wilaya_name} />
            <Row label="Commune" value={o.commune} />
            <Row label="Livraison" value={o.delivery_type === 'home' ? 'À domicile' : 'Stop-desk'} />
          </dl>

          <div className="mt-6 border-t border-border pt-4">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between py-1 text-sm">
                <span>{it.product_name} · {it.variant_label} × {it.quantity}</span>
                <span>{formatDZD(Number(it.line_total))}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between text-sm"><span>Sous-total</span><span>{formatDZD(Number(o.subtotal))}</span></div>
            <div className="flex justify-between text-sm"><span>Livraison</span><span>{formatDZD(Number(o.shipping_fee))}</span></div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 font-display text-xl text-ink">
              <span>Total</span><span>{formatDZD(Number(o.total))}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">← Retour à la collection</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
