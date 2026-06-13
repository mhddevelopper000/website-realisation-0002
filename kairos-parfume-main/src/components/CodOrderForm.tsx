import { useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { formatDZD, isValidDzPhone, normalizePhone } from '@/data/algeria';
import { createOrder } from '@/lib/orders.functions';
import { listWilayas } from '@/lib/wilayas.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Truck } from 'lucide-react';

interface Variant { label: string; price: number; old_price?: number | null }
interface Props { productId: string; variants: Variant[] }

export function CodOrderForm({ productId, variants }: Props) {
  const navigate = useNavigate();
  const createOrderFn = useServerFn(createOrder);
  const wilayasFn = useServerFn(listWilayas);
  const { data: wd } = useQuery({ queryKey: ['wilayas'], queryFn: () => wilayasFn() });
  const wilayas = wd?.wilayas ?? [];

  const [variantLabel, setVariantLabel] = useState(variants[0]?.label ?? '');
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneAlt, setPhoneAlt] = useState('');
  const [wilayaCode, setWilayaCode] = useState<number | ''>('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'stopdesk'>('home');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const variant = useMemo(() => variants.find((v) => v.label === variantLabel) ?? variants[0], [variantLabel, variants]);
  const wilaya = useMemo(() => wilayas.find((w) => w.code === wilayaCode) ?? null, [wilayas, wilayaCode]);
  const shippingFee = wilaya ? (deliveryType === 'home' ? wilaya.home_fee : wilaya.stopdesk_fee) : 0;
  const subtotal = (variant?.price ?? 0) * quantity;
  const total = subtotal + shippingFee;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variant) return;
    if (!fullName.trim() || fullName.trim().length < 2) return toast.error('Nom et prénom requis.');
    const cleanPhone = normalizePhone(phone);
    if (!isValidDzPhone(cleanPhone)) return toast.error('Numéro de téléphone algérien invalide (05/06/07).');
    const cleanAlt = phoneAlt ? normalizePhone(phoneAlt) : '';
    if (cleanAlt && !isValidDzPhone(cleanAlt)) return toast.error('Numéro alternatif invalide.');
    if (!wilaya) return toast.error('Sélectionnez une wilaya.');
    if (!commune.trim()) return toast.error('Saisissez votre commune.');

    setSubmitting(true);
    try {
      const res = await createOrderFn({
        data: {
          productId, variantLabel: variant.label, quantity,
          fullName: fullName.trim(), phone: cleanPhone, phoneAlt: cleanAlt,
          wilayaCode: wilaya.code, commune: commune.trim(),
          address: address.trim(), deliveryType, notes: notes.trim(),
        },
      });
      navigate({ to: '/confirmation/$orderNumber', params: { orderNumber: res.orderNumber } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la commande.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border bg-card p-4 text-[13px] md:space-y-6 md:p-8 md:text-sm">
      <div>
        <p className="eyebrow mb-2 md:mb-3">Contenance</p>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {variants.map((v) => (
            <button type="button" key={v.label} onClick={() => setVariantLabel(v.label)}
              className={`rounded-sm border px-3 py-1.5 text-xs transition md:px-4 md:py-2 md:text-sm ${
                variantLabel === v.label ? 'border-ink bg-ink text-background' : 'border-border bg-background hover:border-ink'
              }`}>
              {v.label} — {formatDZD(v.price)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-xs">Nom & Prénom *</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} className="h-9 md:h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="qty" className="text-xs">Quantité</Label>
          <Input id="qty" type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-9 md:h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-xs">Téléphone * (05/06/07)</Label>
          <Input id="phone" inputMode="tel" placeholder="0555 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-9 md:h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phoneAlt" className="text-xs">Téléphone 2 (optionnel)</Label>
          <Input id="phoneAlt" inputMode="tel" value={phoneAlt} onChange={(e) => setPhoneAlt(e.target.value)} className="h-9 md:h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wilaya" className="text-xs">Wilaya *</Label>
          <select id="wilaya" value={wilayaCode}
            onChange={(e) => setWilayaCode(e.target.value ? Number(e.target.value) : '')}
            className="h-9 w-full rounded-sm border border-input bg-background px-3 text-xs md:h-10 md:text-sm" required>
            <option value="">— Sélectionner —</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>{w.code.toString().padStart(2, '0')} — {w.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="commune" className="text-xs">Commune *</Label>
          <Input id="commune" value={commune} onChange={(e) => setCommune(e.target.value)}
            placeholder="Votre commune" required maxLength={150} className="h-9 md:h-10" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Type de livraison *</Label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDeliveryType('home')}
            className={`flex items-start gap-2 rounded-sm border p-2.5 text-left text-xs transition md:p-3 md:text-sm ${
              deliveryType === 'home' ? 'border-ink bg-secondary/60' : 'border-border hover:border-ink/50'
            }`}>
            <Truck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent md:h-4 md:w-4" />
            <div className="min-w-0">
              <div className="font-medium">À domicile</div>
              <div className="text-[11px] text-muted-foreground md:text-xs">{wilaya ? formatDZD(wilaya.home_fee) : '—'}</div>
            </div>
          </button>
          <button type="button" onClick={() => setDeliveryType('stopdesk')}
            className={`flex items-start gap-2 rounded-sm border p-2.5 text-left text-xs transition md:p-3 md:text-sm ${
              deliveryType === 'stopdesk' ? 'border-ink bg-secondary/60' : 'border-border hover:border-ink/50'
            }`}>
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent md:h-4 md:w-4" />
            <div className="min-w-0">
              <div className="font-medium">Stop-desk</div>
              <div className="text-[11px] text-muted-foreground md:text-xs">{wilaya ? formatDZD(wilaya.stopdesk_fee) : '—'}</div>
            </div>
          </button>
        </div>
      </div>

      {deliveryType === 'home' && (
        <div className="space-y-1">
          <Label htmlFor="address" className="text-xs">Adresse</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} placeholder="Rue, numéro, repères…" className="h-9 md:h-10" />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs">Notes (optionnel)</Label>
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="text-xs md:text-sm" />
      </div>

      <div className="space-y-1 rounded-sm bg-secondary/60 p-3 text-xs md:p-4 md:text-sm">
        <div className="flex justify-between"><span>Sous-total</span><span>{formatDZD(subtotal)}</span></div>
        <div className="flex justify-between"><span>Livraison {wilaya ? `(${wilaya.name})` : ''}</span><span>{wilaya ? formatDZD(shippingFee) : '—'}</span></div>
        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-display text-lg text-ink md:mt-2 md:pt-2 md:text-xl">
          <span>Total</span><span>{formatDZD(total)}</span>
        </div>
      </div>

      <Button type="submit" disabled={submitting}
        className="h-11 w-full rounded-sm bg-ink text-xs font-medium uppercase tracking-[0.15em] text-background hover:bg-ink/90 md:h-14 md:text-base md:tracking-[0.18em]">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Confirmer · Payer à la livraison
      </Button>
      <p className="text-center text-[11px] text-muted-foreground md:text-xs">
        Un conseiller vous appellera pour confirmer avant expédition.
      </p>
    </form>
  );
}
