import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, PawPrint, Calendar, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Link } from 'react-router-dom';
import Notifications from '@/components/Notifications';
import { useToast } from '@/components/ui/use-toast';


const ClinicDashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState({
        totalPets: 0,
        totalTutors: 0,
        pendingAppointments: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { count: totalPets, error: petsError } = await supabase
                .from('animais')
                .select('*', { count: 'exact', head: true })
                .eq('clinica_id', user.id);
            if (petsError) throw petsError;
            
            const { data: clinicPets, error: clinicPetsError } = await supabase
                .from('animais')
                .select('tutor_id')
                .eq('clinica_id', user.id)
                .not('tutor_id', 'is', null);
            if (clinicPetsError) throw clinicPetsError;

            const uniqueTutorIds = [...new Set(clinicPets.map(p => p.tutor_id))];
            const totalTutors = uniqueTutorIds.length;

            const { count: pendingAppointments, error: appointmentsError } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('clinica_id', user.id)
                .eq('status', 'Pendente');
            if (appointmentsError) throw appointmentsError;

            setStats({ totalPets, totalTutors, pendingAppointments });
        } catch (error) {
            console.error("Error fetching clinic stats:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar estatísticas",
                description: "Não foi possível buscar os dados do painel. Tente novamente mais tarde.",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <>
            <Helmet>
                <title>Dashboard da Clínica - PetSafe QR</title>
                <meta name="description" content="Sua central de gerenciamento para pets, tutores e agendamentos." />
            </Helmet>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Olá, {user?.user_metadata?.nome_clinica || 'Clínica'}!</h1>
                <Button asChild>
                  <Link to="/dashboard/pets">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                  </Link>
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                        <PawPrint className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.totalPets}</div>}
                        <p className="text-xs text-muted-foreground">Pets cadastrados na sua clínica</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tutores Vinculados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.totalTutors}</div>}
                        <p className="text-xs text-muted-foreground">Tutores com pets na sua clínica</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consultas Pendentes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.pendingAppointments}</div>}
                        <p className="text-xs text-muted-foreground">
                            {/* ================== CORREÇÃO APLICADA AQUI ================== */}
                            <Link to="/dashboard/solicitacoes" className="underline">Revisar solicitações</Link>
                            {/* ============================================================ */}
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <Notifications />

        </>
    );
};

export default ClinicDashboardPage;
