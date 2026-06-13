import { createServerFn } from '@tanstack/react-start';

export const listCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, slug, name, sort_order')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return { categories: data ?? [] };
});
