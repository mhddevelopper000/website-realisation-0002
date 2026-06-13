import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const uploadProductMedia = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      productId: z.string().uuid(),
      fileName: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      base64: z.string().min(1).max(30_000_000),
      isCover: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');

    const ext = (data.fileName.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
    const path = `${data.productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(data.base64, 'base64');
    if (buffer.byteLength > 20 * 1024 * 1024) throw new Error('Fichier trop volumineux (max 20 Mo).');

    const { error: upErr } = await supabaseAdmin.storage
      .from('product-media')
      .upload(path, buffer, { contentType: data.mimeType, upsert: false });
    if (upErr) throw upErr;

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('product-media')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !signed) throw signErr ?? new Error('URL signée indisponible');

    const mediaType: 'image' | 'video' = data.mimeType.startsWith('video') ? 'video' : 'image';

    const { data: existing } = await supabaseAdmin
      .from('product_media')
      .select('id, is_cover')
      .eq('product_id', data.productId);
    const list = existing ?? [];
    const hasCover = list.some((m) => m.is_cover);
    const nextSort = list.length;
    const isCover = data.isCover ?? !hasCover;
    if (isCover && hasCover) {
      await supabaseAdmin.from('product_media').update({ is_cover: false }).eq('product_id', data.productId);
    }
    const { error: insErr } = await supabaseAdmin.from('product_media').insert({
      product_id: data.productId,
      url: signed.signedUrl,
      media_type: mediaType,
      sort_order: nextSort,
      is_cover: isCover,
    });
    if (insErr) throw insErr;
    if (isCover && mediaType === 'image') {
      await supabaseAdmin.from('products').update({ image_url: signed.signedUrl }).eq('id', data.productId);
    }
    return { ok: true, url: signed.signedUrl };
  });



export const listProductMedia = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: media, error } = await supabaseAdmin
      .from('product_media')
      .select('id, url, media_type, sort_order, is_cover')
      .eq('product_id', data.productId)
      .order('is_cover', { ascending: false })
      .order('sort_order');
    if (error) throw error;
    return { media: media ?? [] };
  });

export const addProductMedia = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      productId: z.string().uuid(),
      url: z.string().url().max(1000),
      mediaType: z.enum(['image', 'video']),
      isCover: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');

    // Get next sort_order and check if cover exists
    const { data: existing } = await supabaseAdmin
      .from('product_media')
      .select('id, is_cover, sort_order')
      .eq('product_id', data.productId);
    const list = existing ?? [];
    const hasCover = list.some((m) => m.is_cover);
    const nextSort = list.length;
    const isCover = data.isCover ?? !hasCover;

    if (isCover && hasCover) {
      await supabaseAdmin.from('product_media').update({ is_cover: false }).eq('product_id', data.productId);
    }

    const { error } = await supabaseAdmin.from('product_media').insert({
      product_id: data.productId,
      url: data.url,
      media_type: data.mediaType,
      sort_order: nextSort,
      is_cover: isCover,
    });
    if (error) throw error;

    // Mirror cover to products.image_url for legacy compat
    if (isCover && data.mediaType === 'image') {
      await supabaseAdmin.from('products').update({ image_url: data.url }).eq('id', data.productId);
    }
    return { ok: true };
  });

export const deleteProductMedia = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    const { error } = await supabaseAdmin.from('product_media').delete().eq('id', data.id);
    if (error) throw error;
    return { ok: true };
  });

export const setCoverMedia = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), productId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    await supabaseAdmin.from('product_media').update({ is_cover: false }).eq('product_id', data.productId);
    const { data: m, error } = await supabaseAdmin
      .from('product_media')
      .update({ is_cover: true })
      .eq('id', data.id)
      .select('url, media_type')
      .single();
    if (error) throw error;
    if (m && m.media_type === 'image') {
      await supabaseAdmin.from('products').update({ image_url: m.url }).eq('id', data.productId);
    }
    return { ok: true };
  });
