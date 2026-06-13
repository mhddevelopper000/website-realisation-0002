import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listOrders, updateOrderStatus, adminStats, checkIsAdmin,
  listAllProducts, upsertProduct, deleteProduct,
} from '@/lib/admin.functions';
import { topClickedProducts } from '@/lib/products.functions';
import { listAllWilayas, updateWilaya } from '@/lib/wilayas.functions';
import { getSettings, updateSettings } from '@/lib/settings.functions';
import { listCategories } from '@/lib/categories.functions';
import { listProductMedia, uploadProductMedia, deleteProductMedia, setCoverMedia } from '@/lib/media.functions';
import { supabase } from '@/integrations/supabase/client';
import { formatDZD } from '@/data/algeria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, Plus, Pencil, Trash2, Star, Upload, X } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => ({ meta: [{ title: 'Admin — Fragrance & Essencia' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900', confirmed: 'bg-blue-100 text-blue-900',
  shipped: 'bg-purple-100 text-purple-900', delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-900',
};

function AdminPage() {
  const navigate = useNavigate();
  const checkFn = useServerFn(checkIsAdmin);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkFn().then((r) => { setIsAdmin(r.isAdmin); setReady(true); }).catch(() => setReady(true));
  }, [checkFn]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: '/auth' });
  }

  if (!ready) return <div className="p-12 text-center text-sm text-muted-foreground">Chargement…</div>;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-sm border border-border bg-card p-8 text-center">
          <h1 className="font-display text-2xl text-ink">Accès refusé</h1>
          <p className="mt-3 text-sm text-muted-foreground">Votre compte n'a pas les droits administrateur.</p>
          <Button variant="ghost" onClick={signOut} className="mt-6 w-full">Déconnexion</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg text-ink">Fragrance & Essencia · Admin</Link>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Déconnexion</Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="wilayas">Wilayas & Frais</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="wilayas"><WilayasTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DashboardTab() {
  const stats = useServerFn(adminStats);
  const top = useServerFn(topClickedProducts);
  const { data: sd } = useQuery({ queryKey: ['stats'], queryFn: () => stats() });
  const { data: td } = useQuery({ queryKey: ['top-clicks'], queryFn: () => top() });

  if (!sd) return <div className="text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Chiffre d'affaires" value={formatDZD(sd.revenue)} sub="Commandes livrées" />
        <StatCard title="Commandes" value={String(sd.total)} sub={`Taux conf. ${sd.confirmRate}%`} />
        <StatCard title="En attente" value={String(sd.byStatus.pending ?? 0)} sub="À confirmer" />
      </div>

      <div className="rounded-sm border border-border bg-card p-6">
        <h3 className="eyebrow mb-4">Top 3 produits (par clics · 30 derniers jours)</h3>
        {!td || td.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas encore de données de clics.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {td.top.map((p, i) => (
              <div key={p.id} className="flex gap-3 rounded-sm border border-border bg-background p-3">
                <div className="flex h-16 w-16 items-center justify-center bg-secondary font-display text-2xl text-accent">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div>
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.clicks} clic{p.clicks > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-6">
          <h3 className="eyebrow mb-4">Pipeline</h3>
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <div key={k} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
              <span>{l}</span><span className="font-medium">{sd.byStatus[k] ?? 0}</span>
            </div>
          ))}
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <h3 className="eyebrow mb-4">Top 5 wilayas</h3>
          {sd.topWilayas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : sd.topWilayas.map(([w, c]) => (
            <div key={w} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
              <span>{w}</span><span className="font-medium">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <p className="eyebrow">{title}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function OrdersTab() {
  const list = useServerFn(listOrders);
  const update = useServerFn(updateOrderStatus);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => list() });
  const updateMut = useMutation({
    mutationFn: (v: { orderId: string; status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' }) => update({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['stats'] }); toast.success('Statut mis à jour'); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Chargement…</div>;
  const orders = (data?.orders ?? []).filter((o) => filter === 'all' || o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider ${filter === s ? 'border-ink bg-ink text-background' : 'border-border bg-background'}`}>
            {s === 'all' ? 'Toutes' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Wilaya / Commune</th><th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Statut</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucune commande</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                <td className="px-4 py-3">{o.full_name}</td>
                <td className="px-4 py-3">{o.phone}{o.phone_alt ? ` / ${o.phone_alt}` : ''}</td>
                <td className="px-4 py-3 text-xs">{o.wilaya_name}<br /><span className="text-muted-foreground">{o.commune} · {o.delivery_type === 'home' ? 'Domicile' : 'Stop-desk'}</span></td>
                <td className="px-4 py-3 text-xs">
                  {(o.order_items ?? []).map((it: { product_name: string; variant_label: string; quantity: number }, i: number) => (
                    <div key={i}>{it.product_name} · {it.variant_label} × {it.quantity}</div>
                  ))}
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatDZD(Number(o.total))}</td>
                <td className="px-4 py-3">
                  <select value={o.status}
                    onChange={(e) => updateMut.mutate({ orderId: o.id, status: e.target.value as 'pending' })}
                    className={`rounded-sm border-0 px-2 py-1 text-xs ${STATUS_COLORS[o.status]}`}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  const list = useServerFn(listAllProducts);
  const del = useServerFn(deleteProduct);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => list() });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); qc.invalidateQueries({ queryKey: ['active-products'] }); toast.success('Produit supprimé'); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Chargement…</div>;
  const products = data?.products ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ProductDialog><Button className="rounded-sm bg-ink text-background hover:bg-ink/90"><Plus className="mr-2 h-4 w-4" />Nouveau parfum</Button></ProductDialog>
      </div>
      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Marque</th>
              <th className="px-4 py-3">Variantes</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Aucun produit. Créez votre premier parfum.</td></tr>}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3"><div className="font-medium">{p.name}</div><div className="font-mono text-xs text-muted-foreground">{p.slug}</div></td>
                <td className="px-4 py-3 text-xs">{p.brand ?? '—'}</td>
                <td className="px-4 py-3 text-xs">{(p.variants as Array<{ label: string; price: number }>).map((v) => `${v.label}: ${formatDZD(v.price)}`).join(' · ')}</td>
                <td className="px-4 py-3 text-xs">{p.is_active ? 'Actif' : 'Inactif'}{p.is_bestseller && ' · Best-seller'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <ProductDialog product={p}><Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button></ProductDialog>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('Supprimer ce produit ?')) delMut.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductDialog({ children, product }: { children: React.ReactNode; product?: any }) {
  const upsert = useServerFn(upsertProduct);
  const catsFn = useServerFn(listCategories);
  const { data: cd } = useQuery({ queryKey: ['categories'], queryFn: () => catsFn() });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? '');
  const [tagline, setTagline] = useState(product?.tagline ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [head, setHead] = useState((product?.notes_head ?? []).join(', '));
  const [heart, setHeart] = useState((product?.notes_heart ?? []).join(', '));
  const [base, setBase] = useState((product?.notes_base ?? []).join(', '));
  const [variants, setVariants] = useState<Array<{ label: string; price: number; old_price?: number | null }>>(
    product?.variants ?? [{ label: '50ml', price: 4500, old_price: null }],
  );
  const [active, setActive] = useState(product?.is_active ?? true);
  const [best, setBest] = useState(product?.is_bestseller ?? false);
  const [savedId, setSavedId] = useState<string | undefined>(product?.id);

  const mut = useMutation({
    mutationFn: () => upsert({
      data: {
        id: savedId,
        slug: slug.toLowerCase().trim(),
        name: name.trim(),
        brand,
        category_id: categoryId || null,
        tagline, description,
        notes_head: head.split(',').map((s: string) => s.trim()).filter(Boolean),
        notes_heart: heart.split(',').map((s: string) => s.trim()).filter(Boolean),
        notes_base: base.split(',').map((s: string) => s.trim()).filter(Boolean),
        variants: variants.map(v => ({ label: v.label, price: Number(v.price), old_price: v.old_price ? Number(v.old_price) : null })),
        is_active: active, is_bestseller: best,
      },
    }),
    onSuccess: (r) => {
      setSavedId(r.id);
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['active-products'] });
      toast.success('Produit enregistré');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  function updateVariant(i: number, field: 'label' | 'price' | 'old_price', value: string) {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [field]: field === 'label' ? value : (value ? Number(value) : null) } : v));
  }
  function addVariant() { setVariants([...variants, { label: '', price: 0, old_price: null }]); }
  function removeVariant(i: number) { setVariants(variants.filter((_, idx) => idx !== i)); }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? 'Modifier le parfum' : 'Nouveau parfum'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Nom *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Slug (url) *</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="essence-noire" /></div>
            <div><Label>Marque</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
            <div>
              <Label>Catégorie</Label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm">
                <option value="">—</option>
                {(cd?.categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><Label>Accroche</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Notes de tête</Label><Input value={head} onChange={(e) => setHead(e.target.value)} placeholder="Bergamote, citron" /></div>
            <div><Label>Notes de cœur</Label><Input value={heart} onChange={(e) => setHeart(e.target.value)} /></div>
            <div><Label>Notes de fond</Label><Input value={base} onChange={(e) => setBase(e.target.value)} /></div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Variantes (contenance & prix)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addVariant}><Plus className="mr-1 h-3 w-3" />Ajouter</Button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-3" placeholder="50ml" value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)} />
                  <Input className="col-span-4" type="number" placeholder="Prix actuel (DA)" value={v.price || ''} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                  <Input className="col-span-4" type="number" placeholder="Prix avant réduction (optionnel)" value={v.old_price ?? ''} onChange={(e) => updateVariant(i, 'old_price', e.target.value)} />
                  <Button className="col-span-1" size="sm" variant="ghost" onClick={() => removeVariant(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />Actif</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={best} onChange={(e) => setBest(e.target.checked)} />Best-seller</label>
          </div>

          {savedId && <MediaManager productId={savedId} />}
          {!savedId && <p className="rounded-sm bg-secondary p-3 text-xs text-muted-foreground">💡 Enregistrez d'abord le produit pour pouvoir ajouter des photos et vidéos.</p>}
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="rounded-sm bg-ink text-background hover:bg-ink/90">
            {mut.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaManager({ productId }: { productId: string }) {
  const mediaFn = useServerFn(listProductMedia);
  const uploadFn = useServerFn(uploadProductMedia);
  const delFn = useServerFn(deleteProductMedia);
  const coverFn = useServerFn(setCoverMedia);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({ queryKey: ['media', productId], queryFn: () => mediaFn({ data: { productId } }) });
  const media = data?.media ?? [];

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const idx = result.indexOf(',');
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} dépasse 20 Mo`);
        const base64 = await fileToBase64(file);
        await uploadFn({ data: { productId, fileName: file.name, mimeType: file.type || 'application/octet-stream', base64 } });
      }
      qc.invalidateQueries({ queryKey: ['media', productId] });
      qc.invalidateQueries({ queryKey: ['active-products'] });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`${files.length} fichier(s) ajouté(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de l\'upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }


  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', productId] }),
  });
  const coverMut = useMutation({
    mutationFn: (id: string) => coverFn({ data: { id, productId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', productId] }),
  });

  return (
    <div className="rounded-sm border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <Label>Photos & vidéos (1re = couverture)</Label>
        <label className="cursor-pointer">
          <input type="file" multiple accept="image/*,video/*" onChange={handleFiles} disabled={uploading} className="hidden" />
          <span className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs hover:border-ink">
            <Upload className="h-3 w-3" />{uploading ? 'Upload…' : 'Ajouter'}
          </span>
        </label>
      </div>
      {media.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun média. La 1re image uploadée devient la couverture automatiquement.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
          {media.map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden border border-border">
              {m.media_type === 'video' ? (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-2xl">▶</div>
              ) : (
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
              {m.is_cover && <span className="absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-[0.55rem] text-background">Couv.</span>}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition group-hover:opacity-100">
                {!m.is_cover && (
                  <button onClick={() => coverMut.mutate(m.id)} className="rounded-full bg-background p-1.5" title="Définir couverture">
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => { if (confirm('Supprimer ?')) delMut.mutate(m.id); }} className="rounded-full bg-background p-1.5">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WilayasTab() {
  const list = useServerFn(listAllWilayas);
  const upd = useServerFn(updateWilaya);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-wilayas'], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: { code: number; home_fee: number; stopdesk_fee: number; is_active: boolean }) => upd({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wilayas'] }); qc.invalidateQueries({ queryKey: ['wilayas'] }); toast.success('Tarif mis à jour'); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Chargement…</div>;
  const wilayas = data?.wilayas ?? [];

  return (
    <div className="rounded-sm border border-border bg-card">
      <p className="border-b border-border p-4 text-sm text-muted-foreground">
        Modifiez les frais de livraison par wilaya. Modifications enregistrées au clic sur "Enregistrer".
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Wilaya</th>
              <th className="px-4 py-3">Domicile (DA)</th><th className="px-4 py-3">Stop-desk (DA)</th>
              <th className="px-4 py-3">Active</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {wilayas.map((w) => <WilayaRow key={w.code} wilaya={w} onSave={(v) => mut.mutate(v)} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WilayaRow({ wilaya, onSave }: {
  wilaya: { code: number; name: string; home_fee: number; stopdesk_fee: number; is_active: boolean };
  onSave: (v: { code: number; home_fee: number; stopdesk_fee: number; is_active: boolean }) => void;
}) {
  const [home, setHome] = useState(wilaya.home_fee);
  const [sd, setSd] = useState(wilaya.stopdesk_fee);
  const [active, setActive] = useState(wilaya.is_active);
  const dirty = home !== wilaya.home_fee || sd !== wilaya.stopdesk_fee || active !== wilaya.is_active;
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2 font-mono text-xs">{wilaya.code}</td>
      <td className="px-4 py-2">{wilaya.name}</td>
      <td className="px-4 py-2"><Input type="number" value={home} onChange={(e) => setHome(Number(e.target.value))} className="h-8 w-28" /></td>
      <td className="px-4 py-2"><Input type="number" value={sd} onChange={(e) => setSd(Number(e.target.value))} className="h-8 w-28" /></td>
      <td className="px-4 py-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /></td>
      <td className="px-4 py-2 text-right">
        <Button size="sm" disabled={!dirty} onClick={() => onSave({ code: wilaya.code, home_fee: home, stopdesk_fee: sd, is_active: active })}>
          Enregistrer
        </Button>
      </td>
    </tr>
  );
}

function SettingsTab() {
  const getFn = useServerFn(getSettings);
  const updFn = useServerFn(updateSettings);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => getFn() });
  const [form, setForm] = useState({
    contact_email: '', contact_phone: '', contact_hours: '',
    instagram_url: '', tiktok_url: '', facebook_url: '', whatsapp_number: '', store_name: '',
  });

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm({
        contact_email: s.contact_email ?? '', contact_phone: s.contact_phone ?? '',
        contact_hours: s.contact_hours ?? '', instagram_url: s.instagram_url ?? '',
        tiktok_url: s.tiktok_url ?? '', facebook_url: s.facebook_url ?? '',
        whatsapp_number: s.whatsapp_number ?? '', store_name: s.store_name ?? '',
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => updFn({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Paramètres enregistrés'); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="max-w-2xl space-y-6 rounded-sm border border-border bg-card p-6">
      <div><Label>Nom de la boutique</Label><Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} /></div>

      <div className="border-t border-border pt-6">
        <h3 className="mb-3 font-display text-lg">Contact (page Contact)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div><Label>Téléphone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Horaires</Label><Input value={form.contact_hours} onChange={(e) => setForm({ ...form, contact_hours: e.target.value })} placeholder="Lun – Sam · 9h – 19h" /></div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="mb-3 font-display text-lg">Réseaux sociaux (icônes page Contact)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Instagram (URL)</Label><Input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/…" /></div>
          <div><Label>TikTok (URL)</Label><Input value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} placeholder="https://tiktok.com/@…" /></div>
          <div><Label>Facebook (URL)</Label><Input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/…" /></div>
          <div><Label>WhatsApp (numéro)</Label><Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+213555000000" /></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Le numéro WhatsApp ouvrira une discussion via wa.me.</p>
      </div>

      <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="rounded-sm bg-ink text-background hover:bg-ink/90">
        {mut.isPending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </Button>
    </div>
  );
}
