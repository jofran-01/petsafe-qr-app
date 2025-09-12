import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { PlusCircle, Dog, Calendar, Loader2 } from 'lucide-react';
    import { Helmet } from 'react-helmet';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Link } from 'react-router-dom';

    const TutorDashboardPage = () => {
      const { user } = useAuth();
      const [stats, setStats] = useState({
        totalPets: 0,
        upcomingAppointments: 0,
      });
      const [loading, setLoading] = useState(true);

      const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
          const { count: totalPets, error: petsError } = await supabase
            .from('animais')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_id', user.id);
          if (petsError) throw petsError;
          
          const today = new Date().toISOString().split('T')[0];
          const { count: upcomingAppointments, error: appointmentsError } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_id', user.id)
            .eq('status', 'confirmado')
            .gte('data_agendamento', today);
          if (appointmentsError) throw appointmentsError;

          setStats({ totalPets, upcomingAppointments });
        } catch (error) {
          console.error("Error fetching tutor stats:", error);
        } finally {
          setLoading(false);
        }
      }, [user]);

      useEffect(() => {
        fetchStats();
      }, [fetchStats]);

      return (
        <>
          <Helmet>
            <title>Portal do Tutor - PetSafe QR</title>
            <meta name="description" content="Seu portal para gerenciar a saúde e o bem-estar dos seus pets." />
          </Helmet>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Olá, {user?.user_metadata?.nome || 'Tutor'}!</h1>
            <Button asChild>
              <Link to="/tutor/dashboard/consultas">
                <PlusCircle className="mr-2 h-4 w-4" />
                Agendar Consulta
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meus Pets</CardTitle>
                <Dog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.totalPets}</div>}
                <p className="text-xs text-muted-foreground">
                    <Link to="/tutor/dashboard/pets" className="underline">Ver todos</Link>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas Consultas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>}
                <p className="text-xs text-muted-foreground">
                  <Link to="/tutor/dashboard/consultas" className="underline">Ver agendamentos</Link>
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Lembretes Importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">Nenhum lembrete no momento.</p>
            </CardContent>
          </Card>
        </>
      );
    };

    export default TutorDashboardPage;