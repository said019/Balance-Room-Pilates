import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const newsItems: Array<{id: string; title: string; description: string; date: string}> = [];

export default function News() {
  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold">Noticias</h1>
              <p className="text-muted-foreground">Últimas novedades del estudio.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/app">Volver</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {newsItems.length === 0 && <p className="py-12 text-muted-foreground">Las novedades de 2707 Altitud aparecerán aquí.</p>}
            {newsItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
