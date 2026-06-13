import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getSettings } from '@/lib/settings.functions';

export function SiteFooter() {
  const fn = useServerFn(getSettings);
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => fn() });
  const s = data?.settings;

  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl text-ink">{s?.store_name ?? 'Fragrance & Essencia'}</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Parfumerie de niche — Essences premium, livrées partout en Algérie.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Service Client</p>
          {s?.contact_hours && <p className="text-sm text-muted-foreground">{s.contact_hours}</p>}
          {s?.contact_phone && <p className="text-sm text-muted-foreground">{s.contact_phone}</p>}
          <Link to="/contact" className="mt-2 inline-block text-sm text-ink underline-offset-4 hover:underline">
            Nous contacter
          </Link>
        </div>
        <div>
          <p className="eyebrow mb-3">Livraison</p>
          <p className="text-sm text-muted-foreground">69 wilayas · Domicile ou stop-desk</p>
          <p className="text-sm text-muted-foreground">Paiement à la livraison</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {s?.store_name ?? 'Fragrance & Essencia'}. Tous droits réservés.
      </div>
    </footer>
  );
}
