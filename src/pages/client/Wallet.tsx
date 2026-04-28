import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { Gift, History, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { es } from 'date-fns/locale';

interface WalletPassResponse {
  memberName: string;
  memberSince: string | null;
  planName: string | null;
  membershipStatus: string | null;
  membershipId: string | null;
  expirationDate: string | null;
  classesRemaining: number | null;
  pointsBalance: number;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  reward_value: string | null;
  is_active: boolean;
  stock: number | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy');
};

export default function WalletClub() {
  const { data, isLoading, isError, error } = useQuery<WalletPassResponse>({
    queryKey: ['wallet-pass'],
    queryFn: async () => {
      const { data } = await api.get('/wallet/pass');
      return data;
    },
  });

  const { data: loyaltyData } = useQuery<{
    history: Array<{
      id: string;
      points: number;
      type: string;
      description: string;
      created_at: string;
      class_name: string | null;
    }>;
    totalPoints: number;
  }>({
    queryKey: ['loyalty-history'],
    queryFn: async () => (await api.get('/loyalty/my-history')).data,
  });

  const {
    data: rewards,
    isLoading: rewardsLoading,
    isError: rewardsIsError,
    error: rewardsError,
  } = useQuery<LoyaltyReward[]>({
    queryKey: ['loyalty-rewards'],
    queryFn: async () => (await api.get('/loyalty/rewards')).data,
  });

  const recentActivity = (loyaltyData?.history || []).slice(0, 3);
  const activeRewards = (rewards || [])
    .filter((reward) => reward.is_active && (reward.stock === null || reward.stock > 0))
    .slice(0, 3);

  const errorMessage = isError ? getErrorMessage(error) : null;

  const hasMembership = Boolean(data?.membershipId);
  const pointsBalance = data?.pointsBalance ?? loyaltyData?.totalPoints ?? 0;

  const formatActivityDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      return format(date, 'd MMM', { locale: es });
    } catch {
      return '';
    }
  };

  const getActivityLabel = (item: { type: string; description: string; class_name: string | null }) => {
    if (item.description?.startsWith('Puntos por pago #')) return 'Compra de membresía';
    if (item.class_name) return `Clase: ${item.class_name}`;
    if (item.type === 'bonus') return item.description || 'Bono';
    if (item.type === 'redemption') return item.description || 'Canje';
    return item.description || 'Puntos';
  };

  const getRewardIcon = (type: string) => {
    const icons: Record<string, string> = {
      discount: '💸',
      free_class: '🎁',
      product: '🛍️',
      membership_extension: '⭐',
    };
    return icons[type] || '✨';
  };

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-heading font-bold">Programa de lealtad</h1>
            <p className="text-muted-foreground">
              Tus puntos, recompensas y progreso en Balance Room.
            </p>
          </div>

          <Card className="overflow-hidden border-none">
            <CardContent className="p-0">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Balance Room Barre colors: Verde salvia #8F9A8A, Crema #F4EFE6, Terracota #C6A77A, Chocolate #3F352D */}
                <div className="bg-gradient-to-br from-[#8F9A8A] via-[#8F9A8A]/90 to-[#C6A77A]/80 text-white p-6 md:p-8">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-40 bg-white/20" />
                      <Skeleton className="h-4 w-64 bg-white/20" />
                      <Skeleton className="h-32 w-full bg-white/20" />
                    </div>
                  ) : errorMessage ? (
                    <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-sm text-white/80">
                      No pudimos cargar tu información. {errorMessage}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-white/70">
                            Balance Room Pilates
                          </p>
                          <h2 className="text-2xl font-semibold">{data?.memberName || 'Miembro'}</h2>
                          <p className="text-sm text-white/80">
                            Miembro desde {formatDate(data?.memberSince)}
                          </p>
                        </div>
                        <Badge className="bg-white/20 text-white hover:bg-white/30">
                          {data?.membershipStatus === 'active'
                            ? 'Activa'
                            : hasMembership
                              ? 'Inactiva'
                              : 'Sin plan'}
                        </Badge>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-xs uppercase text-white/70">Plan</p>
                          <p className="font-medium">{data?.planName || 'Sin plan activo'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-white/70">Válido hasta</p>
                          <p className="font-medium">{formatDate(data?.expirationDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-white/70">Puntos</p>
                          <p className="font-medium">{data?.pointsBalance ?? 0} pts</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-white/70">Clases</p>
                          <p className="font-medium">
                            {hasMembership
                              ? data?.classesRemaining ?? 'Ilimitado'
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8 space-y-5">
                  <div className="rounded-2xl border bg-muted/30 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-balance-gold" />
                      Lealtad Balance Room
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Gana puntos al asistir a clases y canjéalos por beneficios del studio.
                    </p>
                    <div className="mt-5 rounded-xl bg-background p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Puntos disponibles
                      </p>
                      <p className="mt-1 text-3xl font-bold text-balance-gold">
                        {pointsBalance} pts
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to="/app/wallet/rewards">Ver recompensas</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/app/wallet/history">Ver historial de puntos</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-warning" />
                  Canjear recompensas
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/wallet/rewards">Ver todas</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {rewardsLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <Skeleton key={item} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : rewardsIsError ? (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    No pudimos cargar las recompensas. {getErrorMessage(rewardsError)}
                  </div>
                ) : activeRewards.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {activeRewards.map((reward) => {
                      const canAfford = pointsBalance >= reward.points_cost;
                      return (
                        <div
                          key={reward.id}
                          className={`rounded-xl border p-4 text-center transition-colors ${
                            canAfford
                              ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                              : 'bg-muted/40'
                          }`}
                        >
                          <div className="text-3xl">{getRewardIcon(reward.reward_type)}</div>
                          <p className="mt-2 text-sm font-medium line-clamp-2">{reward.name}</p>
                          <p className={canAfford ? 'text-xs font-semibold text-emerald-700' : 'text-xs text-muted-foreground'}>
                            {reward.points_cost} pts
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No hay recompensas disponibles por ahora.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Historial reciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{getActivityLabel(item)}</p>
                        <p className="text-xs text-muted-foreground">{formatActivityDate(item.created_at)}</p>
                      </div>
                      <span className={item.points > 0 ? 'text-success' : 'text-rose-600'}>
                        {item.points > 0 ? `+${item.points}` : item.points} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aún no tienes movimientos. Asiste a clases para ganar puntos.
                  </p>
                )}
                {recentActivity.length > 0 && (
                  <Button variant="ghost" size="sm" asChild className="px-0">
                    <Link to="/app/wallet/history">Ver todo</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
