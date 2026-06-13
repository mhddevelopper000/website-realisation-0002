import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return { settings: data };
});

export const updateSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      contact_email: z.string().max(255).optional().or(z.literal('')),
      contact_phone: z.string().max(50).optional().or(z.literal('')),
      contact_hours: z.string().max(200).optional().or(z.literal('')),
      instagram_url: z.string().max(500).optional().or(z.literal('')),
      tiktok_url: z.string().max(500).optional().or(z.literal('')),
      facebook_url: z.string().max(500).optional().or(z.literal('')),
      whatsapp_number: z.string().max(50).optional().or(z.literal('')),
      store_name: z.string().max(150).optional().or(z.literal('')),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    const payload = {
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      contact_hours: data.contact_hours || null,
      instagram_url: data.instagram_url || null,
      tiktok_url: data.tiktok_url || null,
      facebook_url: data.facebook_url || null,
      whatsapp_number: data.whatsapp_number || null,
      store_name: data.store_name || 'Fragrance & Essencia',
    };
    const { error } = await supabaseAdmin.from('settings').update(payload).eq('id', 1);
    if (error) throw error;
    return { ok: true };
  });
