import { useQuery } from '@tanstack/react-query';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Gift, Copy, Users, Star, ChevronRight, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReferralStats {
  code: string;
  totalReferrals: number;
  totalPointsEarned: number;
  recentReferrals: Array<{ friend_name: string; created_at: string; points_awarded: number }>;
}

export default function ReferFriends() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ReferralStats>({
    queryKey: ['referral-me'],
    queryFn: async () => (await api.get('/referrals/me')).data,
  });

  const handleCopy = async () => {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      toast({ title: '¡Copiado!', description: 'Comparte tu código con tus amigas.' });
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo copiar' });
    }
  };

  const handleShareWhatsApp = () => {
    if (!data?.code) return;
    const msg = encodeURIComponent(
      `¡Te invito a Balance Room Pilates! 🧘\nUsa mi código *${data.code}* al registrarte y obtén 10% de descuento en tu primer paquete. 💚\nhttps://balance-room-pilates-production.up.railway.app`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="space-y-6 max-w-lg mx-auto pb-10">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/app/wallet"><ChevronRight className="h-5 w-5 rotate-180" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Referir amigas</h1>
              <p className="text-sm text-muted-foreground">Comparte y gana puntos de lealtad.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl bg-balance-olive/10 border border-balance-olive/20 p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-balance-olive">¿Cómo funciona?</p>
            <div className="space-y-2 text-sm text-balance-dark/80">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-balance-olive text-white text-xs font-bold">1</span>
                <p>Comparte tu código personal con tus amigas.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-balance-olive text-white text-xs font-bold">2</span>
                <p>Tu amiga usa el código al comprar su primer paquete y obtiene <strong>10% de descuento</strong>.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-balance-olive text-white text-xs font-bold">3</span>
                <p>Tú recibes <strong>10 puntos de lealtad</strong> automáticamente.</p>
              </div>
            </div>
          </div>

          {/* Code card */}
          <div className="rounded-2xl bg-balance-dark text-balance-cream p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-balance-sand/70">
              <Gift className="h-4 w-4" />
              Tu código personal
            </div>

            {isLoading ? (
              <div className="h-10 w-40 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <p className="text-3xl font-mono font-bold tracking-[0.15em] text-balance-cream">
                {data?.code ?? '—'}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-white/20 bg-white/8 text-balance-cream hover:bg-white/15"
                onClick={handleCopy}
                disabled={!data?.code}
              >
                <Copy className="h-4 w-4" />
                Copiar código
              </Button>
              <Button
                className="flex-1 gap-2 bg-[#25D366] hover:bg-[#1fba58] text-white"
                onClick={handleShareWhatsApp}
                disabled={!data?.code}
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-card p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-balance-olive" />
              <p className="text-2xl font-bold">{data?.totalReferrals ?? 0}</p>
              <p className="text-xs text-muted-foreground">Amigas referidas</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-balance-olive" />
              <p className="text-2xl font-bold">{data?.totalPointsEarned ?? 0}</p>
              <p className="text-xs text-muted-foreground">Puntos ganados</p>
            </div>
          </div>

          {/* Recent referrals */}
          {(data?.recentReferrals?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Amigas recientes</p>
              <div className="rounded-2xl border bg-card divide-y">
                {data!.recentReferrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.friend_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(r.created_at), "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-balance-olive">+{r.points_awarded} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
