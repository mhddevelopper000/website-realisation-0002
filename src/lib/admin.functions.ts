import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export const listOrders = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return { orders: data ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(ORDER_STATUSES),
      adminNotes: z.string().max(1000).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');

    const patch = data.adminNotes !== undefined
      ? { status: data.status, admin_notes: data.adminNotes }
      : { status: data.status };
    const { error } = await supabaseAdmin.from('orders').update(patch).eq('id', data.orderId);
    if (error) throw error;
    return { ok: true };
  });

export const adminStats = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');

    const { data: orders } = await supabaseAdmin.from('orders').select('status, total, wilaya_name');
    const all = orders ?? [];
    const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<string, number>;
    let revenue = 0;
    const wilayaCount: Record<string, number> = {};
    for (const o of all) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.status === 'delivered') revenue += Number(o.total);
      wilayaCount[o.wilaya_name] = (wilayaCount[o.wilaya_name] || 0) + 1;
    }
    const topWilayas = Object.entries(wilayaCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const confirmRate = all.length ? Math.round(((byStatus.confirmed + byStatus.shipped + byStatus.delivered) / all.length) * 100) : 0;
    return { byStatus, revenue, topWilayas, total: all.length, confirmRate };
  });

// First-time admin claim: works only when NO admin exists yet
export const claimFirstAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { count } = await supabaseAdmin
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if ((count ?? 0) > 0) throw new Error('Un administrateur existe déjà.');

    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: context.userId, role: 'admin' });
    if (error) throw error;
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    const { count } = await supabaseAdmin.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    return { isAdmin: !!data, hasAnyAdmin: (count ?? 0) > 0 };
  });

// Product management
const variantSchema = z.object({
  label: z.string().min(1).max(50),
  price: z.number().positive(),
  old_price: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(150),
  brand: z.string().max(100).optional().or(z.literal('')),
  category_id: z.string().uuid().nullable().optional(),
  tagline: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  notes_head: z.array(z.string().max(50)).max(20).default([]),
  notes_heart: z.array(z.string().max(50)).max(20).default([]),
  notes_base: z.array(z.string().max(50)).max(20).default([]),
  image_url: z.string().url().or(z.literal('')).optional(),
  variants: z.array(variantSchema).min(1).max(10),
  is_active: z.boolean().default(true),
  is_bestseller: z.boolean().default(false),
});

export const upsertProduct = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');

    const payload = {
      slug: data.slug,
      name: data.name,
      brand: data.brand || null,
      category_id: data.category_id ?? null,
      tagline: data.tagline || null,
      description: data.description || null,
      notes_head: data.notes_head,
      notes_heart: data.notes_heart,
      notes_base: data.notes_base,
      image_url: data.image_url || null,
      variants: data.variants,
      is_active: data.is_active,
      is_bestseller: data.is_bestseller,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from('products').update(payload).eq('id', data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    } else {
      const { data: created, error } = await supabaseAdmin.from('products').insert(payload).select('id').single();
      if (error) throw error;
      return { ok: true, id: created.id };
    }
  });

export const deleteProduct = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    const { error } = await supabaseAdmin.from('products').delete().eq('id', data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listAllProducts = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    const { data, error } = await supabaseAdmin.from('products').select('*').order('sort_order').order('created_at', { ascending: false });
    if (error) throw error;
    return { products: data ?? [] };
  });
