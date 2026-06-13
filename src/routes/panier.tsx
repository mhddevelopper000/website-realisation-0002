import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { useCart } from '@/lib/cart';
import { formatDZD, isValidDzPhone, normalizePhone } from '@/data/algeria';
import { listWilayas } from '@/lib/wilayas.functions';
import { createCartOrder } from '@/lib/orders.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Minus, Plus, Trash2, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';

export const Route = createFileRoute('/panier')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Panier — Fragrance & Essencia' },
      { name: 'description', content: 'Votre panier · Paiement à la livraison en Algérie.' },
      { name: 'robots', content: 'noindex' },
    ],
    links: [{ rel: 'canonical', href: '/panier' }],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const wilayasFn = useServerFn(listWilayas);
  const createOrderFn = useServerFn(createCartOrder);
  const { data: wd } = useQuery({ queryKey: ['wilayas'], queryFn: () => wilayasFn() });
  const wilayas = wd?.wilayas ?? [];

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneAlt, setPhoneAlt] = useState('');
  const [wilayaCode, setWilayaCode] = useState<number | ''>('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'stopdesk'>('home');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wilaya = useMemo(() => wilayas.find((w) => w.code === wilayaCode) ?? null, [wilayas, wilayaCode]);
  const shippingFee = wilaya ? (deliveryType === 'home' ? wilaya.home_fee : wilaya.stopdesk_fee) : 0;
  const total = cart.subtotal + shippingFee;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) return toast.error('Votre panier est vide.');
    if (fullName.trim().length < 2) return toast.error('Nom requis.');
    const cleanPhone = normalizePhone(phone);
    if (!isValidDzPhone(cleanPhone)) return toast.error('Téléphone invalide (05/06/07).');
    const cleanAlt = phoneAlt ? normalizePhone(phoneAlt) : '';
    if (cleanAlt && !isValidDzPhone(cleanAlt)) return toast.error('Téléphone alt. invalide.');
    if (!wilaya) return toast.error('Sélectionnez une wilaya.');
    if (!commune.trim()) return toast.error('Commune requise.');

    setSubmitting(true);
    try {
      const res = await createOrderFn({
        data: {
          items: cart.items.map((i) => ({ productId: i.productId, variantLabel: i.variantLabel, quantity: i.quantity })),
          fullName: fullName.trim(), phone: cleanPhone, phoneAlt: cleanAlt,
          wilayaCode: wilaya.code, commune: commune.trim(), address: address.trim(),
          deliveryType, notes: notes.trim(),
        },
      });
      cart.clear();
      navigate({ to: '/confirmation/$orderNumber', params: { orderNumber: res.orderNumber } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la commande.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <p className="eyebrow mb-2">Panier</p>
        <h1 className="font-display text-3xl text-ink md:text-4xl">Votre panier</h1>

        {cart.items.length === 0 ? (
          <div className="mt-10 rounded-sm border border-dashed border-border p-16 text-center">
            <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Votre panier est vide.</p>
            <Link to="/" className="mt-6 inline-block rounded-sm border border-ink px-5 py-2 text-xs uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-background">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 md:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {cart.items.map((it) => (
                <div key={`${it.productId}-${it.variantLabel}`} className="flex gap-4 rounded-sm border border-border bg-card p-3">
                  <Link to="/produits/$slug" params={{ slug: it.slug }} className="h-24 w-24 flex-shrink-0 overflow-hidden bg-secondary">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="h-full w-full object-contain p-1" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-3xl text-accent/30">{it.name.charAt(0)}</div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to="/produits/$slug" params={{ slug: it.slug }} className="font-display text-base text-ink hover:underline">
                          {it.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{it.variantLabel}</p>
                      </div>
                      <button onClick={() => cart.remove(it.productId, it.variantLabel)} aria-label="Retirer" className="text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-sm border border-border">
                        <button onClick={() => cart.setQty(it.productId, it.variantLabel, it.quantity - 1)} className="px-2 py-1 hover:bg-secondary" aria-label="Moins">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{it.quantity}</span>
                        <button onClick={() => cart.setQty(it.productId, it.variantLabel, it.quantity + 1)} className="px-2 py-1 hover:bg-secondary" aria-label="Plus">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-ink">{formatDZD(it.price * it.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={cart.clear} className="text-xs text-muted-foreground underline hover:text-foreground">
                Vider le panier
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border bg-card p-5 text-sm md:p-6">
              <p className="eyebrow">Confirmation de commande</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="fullName" className="text-xs">Nom & Prénom *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Téléphone *</Label>
                  <Input id="phone" inputMode="tel" placeholder="0555 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phoneAlt" className="text-xs">Téléphone 2</Label>
                  <Input id="phoneAlt" inputMode="tel" value={phoneAlt} onChange={(e) => setPhoneAlt(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wilaya" className="text-xs">Wilaya *</Label>
                  <select id="wilaya" value={wilayaCode}
                    onChange={(e) => setWilayaCode(e.target.value ? Number(e.target.value) : '')}
                    className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm" required>
                    <option value="">— Sélectionner —</option>
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>{w.code.toString().padStart(2, '0')} — {w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="commune" className="text-xs">Commune *</Label>
                  <Input id="commune" value={commune} onChange={(e) => setCommune(e.target.value)} required maxLength={150} className="h-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Type de livraison *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setDeliveryType('home')}
                    className={`flex items-start gap-2 rounded-sm border p-3 text-left text-xs transition ${
                      deliveryType === 'home' ? 'border-ink bg-secondary/60' : 'border-border hover:border-ink/50'
                    }`}>
                    <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <div className="min-w-0">
                      <div className="font-medium">À domicile</div>
                      <div className="text-[11px] text-muted-foreground">{wilaya ? formatDZD(wilaya.home_fee) : '—'}</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => setDeliveryType('stopdesk')}
                    className={`flex items-start gap-2 rounded-sm border p-3 text-left text-xs transition ${
                      deliveryType === 'stopdesk' ? 'border-ink bg-secondary/60' : 'border-border hover:border-ink/50'
                    }`}>
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <div className="min-w-0">
                      <div className="font-medium">Stop-desk</div>
                      <div className="text-[11px] text-muted-foreground">{wilaya ? formatDZD(wilaya.stopdesk_fee) : '—'}</div>
                    </div>
                  </button>
                </div>
              </div>

              {deliveryType === 'home' && (
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-xs">Adresse</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} className="h-10" />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
              </div>

              <div className="space-y-1 rounded-sm bg-secondary/60 p-3 text-sm">
                <div className="flex justify-between"><span>Sous-total</span><span>{formatDZD(cart.subtotal)}</span></div>
                <div className="flex justify-between"><span>Livraison {wilaya ? `(${wilaya.name})` : ''}</span><span>{wilaya ? formatDZD(shippingFee) : '—'}</span></div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 font-display text-xl text-ink">
                  <span>Total</span><span>{formatDZD(total)}</span>
                </div>
              </div>

              <Button type="submit" disabled={submitting}
                className="h-12 w-full rounded-sm bg-ink text-xs font-medium uppercase tracking-[0.18em] text-background hover:bg-ink/90">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmer la commande
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Paiement à la livraison · Un conseiller vous appellera.
              </p>
            </form>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
