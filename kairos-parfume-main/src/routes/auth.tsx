import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Connexion admin — Fragrance & Essencia' }, { name: 'robots', content: 'noindex' }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: '/admin' });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: '/admin' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="eyebrow mb-8 block text-center">Fragrance & Essencia</Link>
        <div className="rounded-sm border border-border bg-card p-8">
          <h1 className="mb-1 text-center font-display text-2xl text-ink">Espace administrateur</h1>
          <p className="mb-6 text-center text-xs text-muted-foreground">
            Accès réservé · Connexion uniquement
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-sm bg-ink text-background hover:bg-ink/90">
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
