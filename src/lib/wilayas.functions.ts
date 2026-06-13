import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const listWilayas = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin
    .from('wilayas')
    .select('code, name, home_fee, stopdesk_fee, is_active')
    .eq('is_active', true)
    .order('code');
  if (error) throw error;
  return { wilayas: data ?? [] };
});

export const listAllWilayas = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    const { data, error } = await supabaseAdmin.from('wilayas').select('*').order('code');
    if (error) throw error;
    return { wilayas: data ?? [] };
  });

export const updateWilaya = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      code: z.number().int().min(1).max(99),
      home_fee: z.number().int().min(0).max(10000),
      stopdesk_fee: z.number().int().min(0).max(10000),
      is_active: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const isAdmin = await supabaseAdmin.from('user_roles').select('id').eq('user_id', context.userId).eq('role', 'admin').maybeSingle();
    if (!isAdmin.data) throw new Error('Accès refusé.');
    const { error } = await supabaseAdmin
      .from('wilayas')
      .update({ home_fee: data.home_fee, stopdesk_fee: data.stopdesk_fee, is_active: data.is_active })
      .eq('code', data.code);
    if (error) throw error;
    return { ok: true };
  });
