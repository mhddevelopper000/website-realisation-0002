import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { PHONE_REGEX } from '@/data/algeria';

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().regex(PHONE_REGEX, 'Numéro algérien invalide').optional().or(z.literal('')),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  subject: z.string().trim().max(150).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(2000),
});

export const sendContactMessage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('contact_messages').insert({
      full_name: data.fullName,
      phone: data.phone || null,
      email: data.email || null,
      subject: data.subject || null,
      message: data.message,
    });
    if (error) throw new Error('Échec envoi message.');
    return { ok: true };
  });
