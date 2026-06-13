import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const listActiveProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, slug, name, tagline, image_url, variants, is_bestseller, category_id, brand, product_media(url, media_type, is_cover, sort_order)')
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const products = (data ?? []).map((p) => {
    const media = ((p as { product_media?: Array<{ url: string; media_type: string; is_cover: boolean; sort_order: number }> }).product_media ?? [])
      .filter((m) => m.media_type === 'image')
      .sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order);
    return { ...p, image_url: p.image_url ?? media[0]?.url ?? null };
  });
  return { products };
});

export const getProductBySlug = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, product_media(id, url, media_type, sort_order, is_cover)')
      .eq('slug', data.slug)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return { product };
  });

export const getOrderByNumber = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => z.object({ orderNumber: z.string().min(1).max(50) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, full_name, phone, wilaya_name, commune, delivery_type, shipping_fee, subtotal, total, status, order_items(product_name, variant_label, quantity, unit_price, line_total)')
      .eq('order_number', data.orderNumber)
      .maybeSingle();
    if (error) throw error;
    return { order };
  });

export const trackProductClick = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({
    productId: z.string().uuid(),
    sessionId: z.string().max(64).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('product_clicks').insert({
      product_id: data.productId,
      session_id: data.sessionId ?? null,
    });
    return { ok: true };
  });

export const topClickedProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: clicks } = await supabaseAdmin
    .from('product_clicks')
    .select('product_id')
    .gte('created_at', since);
  const counts: Record<string, number> = {};
  for (const c of clicks ?? []) counts[c.product_id] = (counts[c.product_id] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return { top: [] };
  const ids = top.map(([id]) => id);
  const { data: prods } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, image_url')
    .in('id', ids);
  return {
    top: top.map(([id, count]) => ({
      ...((prods ?? []).find((p) => p.id === id) ?? { id, name: '—', slug: '', image_url: null }),
      clicks: count,
    })),
  };
});
