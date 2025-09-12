import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Loader2, Syringe, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            setLoading(true);
            const today = new Date();
            const upcoming_limit = new Date();
            upcoming_limit.setDate(today.getDate() + 14); // 2 semanas de antecedência

            try {
                // Lembretes de vacinas
                const { data: vaccines, error: vError } = await supabase
                    .from('vacinas')
                    .select('*, animais(nome)')
                    .eq('clinica_id', user.id)
                    .lte('data_vencimento', upcoming_limit.toISOString())
                    .gte('data_vencimento', today.toISOString());
                if(vError) throw vError;

                // Lembretes de agendamentos
                const { data: appointments, error: aError } = await supabase
                    .from('agendamentos')
                    .select('*, animais(nome), usuarios_tutores(nome)')
                    .eq('clinica_id', user.id)
                    .eq('status', 'confirmado')
                    .lte('data_agendamento', upcoming_limit.toISOString())
                    .gte('data_agendamento', today.toISOString());
                if(aError) throw aError;
                
                const allNotifications = [
                    ...vaccines.map(v => ({ type: 'vaccine', data: v })),
                    ...appointments.map(a => ({ type: 'appointment', data: a })),
                ].sort((a,b) => new Date(a.data.data_vencimento || a.data.data_agendamento) - new Date(b.data.data_vencimento || b.data.data_agendamento));
                
                setNotifications(allNotifications);
            } catch (error) {
                console.error("Erro ao buscar notificações:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user]);

    const renderNotification = (notification) => {
        if (notification.type === 'vaccine') {
            const { data } = notification;
            return (
                <div key={`vaccine-${data.id}`} className="flex items-start gap-4">
                    <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full">
                        <Syringe className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">Vacina Próxima ao Vencimento</p>
                        <p className="text-sm text-muted-foreground">
                            A vacina <span className="font-bold">{data.nome_vacina}</span> de <Link to={`/dashboard/prontuarios/${data.animal_id}`} className="font-bold underline">{data.animais.nome}</Link> vence em <span className="font-bold">{new Date(data.data_vencimento).toLocaleDateString()}</span>.
                        </p>
                    </div>
                </div>
            );
        }
        if (notification.type === 'appointment') {
            const { data } = notification;
            return (
                <div key={`appt-${data.id}`} className="flex items-start gap-4">
                    <div className="bg-green-500/20 text-green-500 p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">Consulta Agendada</p>
                        <p className="text-sm text-muted-foreground">
                            Consulta para <Link to={`/dashboard/prontuarios/${data.animal_id}`} className="font-bold underline">{data.animais.nome}</Link> com o tutor <span className="font-bold">{data.usuarios_tutores.nome}</span> em <span className="font-bold">{new Date(data.data_agendamento).toLocaleDateString()}</span> às <span className="font-bold">{data.horario}</span>.
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notificações e Lembretes
                </CardTitle>
                <Badge>{notifications.length}</Badge>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {notifications.map(renderNotification)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma notificação no momento.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default Notifications;