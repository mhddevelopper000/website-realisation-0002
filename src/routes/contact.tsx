import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getSettings } from '@/lib/settings.functions';
import { Mail, Phone, Clock, Instagram, Facebook } from 'lucide-react';

const settingsQuery = queryOptions({ queryKey: ['settings'], queryFn: () => getSettings() });

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Contact — Fragrance & Essencia' },
      { name: 'description', content: 'Contactez Fragrance & Essencia : téléphone, email, réseaux sociaux et WhatsApp.' },
      { property: 'og:title', content: 'Contact — Fragrance & Essencia' },
      { property: 'og:description', content: 'Service client à votre écoute, 6j/7.' },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: ContactPage,
  errorComponent: () => <div className="p-12 text-center">Erreur de chargement.</div>,
  notFoundComponent: () => <div className="p-12 text-center">Introuvable.</div>,
});

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 19.07 5a9.84 9.84 0 0 0-7.03-3zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23a7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.12.16 1.76 2.68 4.27 3.77.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}

function ContactPage() {
  const { data } = useSuspenseQuery(settingsQuery);
  const s = data.settings;
  const wa = (s?.whatsapp_number ?? '').replace(/\D/g, '');
  const waUrl = wa ? `https://wa.me/${wa}` : '#';

  const socials = [
    { name: 'Instagram', url: s?.instagram_url, Icon: Instagram, color: 'hover:text-[#E4405F]' },
    { name: 'TikTok', url: s?.tiktok_url, Icon: TikTokIcon, color: 'hover:text-ink' },
    { name: 'Facebook', url: s?.facebook_url, Icon: Facebook, color: 'hover:text-[#1877F2]' },
    { name: 'WhatsApp', url: wa ? waUrl : null, Icon: WhatsAppIcon, color: 'hover:text-[#25D366]' },
  ].filter((x) => x.url);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="eyebrow mb-3">Nous joindre</p>
        <h1 className="font-display text-4xl text-ink md:text-5xl">Contactez-nous</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Notre équipe est à votre écoute. Choisissez le canal qui vous convient.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {s?.contact_phone && (
            <a href={`tel:${s.contact_phone.replace(/\s/g, '')}`} className="group flex items-start gap-4 rounded-sm border border-border bg-card p-6 transition hover:border-ink">
              <Phone className="mt-1 h-5 w-5 text-accent" />
              <div>
                <p className="eyebrow mb-1">Téléphone</p>
                <p className="font-display text-lg text-ink">{s.contact_phone}</p>
              </div>
            </a>
          )}
          {s?.contact_email && (
            <a href={`mailto:${s.contact_email}`} className="group flex items-start gap-4 rounded-sm border border-border bg-card p-6 transition hover:border-ink">
              <Mail className="mt-1 h-5 w-5 text-accent" />
              <div>
                <p className="eyebrow mb-1">Email</p>
                <p className="font-display text-lg text-ink break-all">{s.contact_email}</p>
              </div>
            </a>
          )}
          {s?.contact_hours && (
            <div className="flex items-start gap-4 rounded-sm border border-border bg-card p-6 sm:col-span-2">
              <Clock className="mt-1 h-5 w-5 text-accent" />
              <div>
                <p className="eyebrow mb-1">Horaires</p>
                <p className="text-base text-ink">{s.contact_hours}</p>
              </div>
            </div>
          )}
        </div>

        {socials.length > 0 && (
          <div className="mt-16">
            <p className="eyebrow mb-6 text-center">Suivez-nous</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {socials.map(({ name, url, Icon, color }) => (
                <a key={name} href={url ?? '#'} target="_blank" rel="noopener noreferrer"
                  className={`flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition ${color} hover:border-current`}
                  aria-label={name}>
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
